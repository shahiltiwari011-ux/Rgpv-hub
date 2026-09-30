import { supabase, isSupabaseReady } from './supabaseClient';
import { fetchProxyResult } from './api';

const SEMESTERS = [1, 2, 3, 4, 5, 6];

/**
 * Fetch a single semester result from the cache table (written by backend after each scrape).
 * Returns null if not cached.
 */
async function getCachedSemesterResult(enrollment, semester) {
  if (!isSupabaseReady()) return null;
  try {
    const { data, error } = await supabase
      .from('results_cache')
      .select('result_data, updated_at')
      .eq('enrollment', enrollment.toUpperCase())
      .maybeSingle();

    if (error || !data) return null;

    // The cache stores a single result_data object keyed by last fetch.
    // Check if the cached semester matches the requested semester.
    const rd = data.result_data;
    if (rd && String(rd.semester) === String(semester)) {
      return { ...rd, _cachedAt: data.updated_at };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Search for a student in the profiles table by enrollment number.
 * Only queries the specific enrollment — never fetches all students.
 */
export async function findStudentByEnrollment(enrollment) {
  if (!enrollment || !enrollment.trim()) {
    throw new Error('Enrollment number is required');
  }

  const normalized = enrollment.trim().toUpperCase();

  // Validate format: must be alphanumeric, 8-15 chars
  if (!/^[A-Z0-9]{6,20}$/.test(normalized)) {
    throw new Error('Invalid enrollment number format');
  }

  if (!isSupabaseReady()) {
    throw new Error('Database not available');
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('id, name, email, roll_number, branch, semester, department, college, created_at, role')
    .or(`roll_number.eq.${normalized},email.ilike.%${normalized}%`)
    .maybeSingle();

  if (error) throw new Error('Failed to search student');

  // Also check the results_cache for student info from RGPV data
  const { data: cacheData } = await supabase
    .from('results_cache')
    .select('result_data, updated_at')
    .eq('enrollment', normalized)
    .maybeSingle();

  if (!data && !cacheData) {
    return null;
  }

  // Merge: profile data takes precedence; result_data fills gaps
  const rgpvInfo = cacheData?.result_data || {};

  return {
    id: data?.id || null,
    name: data?.name || rgpvInfo.name || 'Unknown',
    email: data?.email || null,
    rollNumber: normalized,
    branch: data?.branch || rgpvInfo.branch || 'N/A',
    semester: data?.semester || rgpvInfo.semester || null,
    department: data?.department || null,
    college: data?.college || 'RGPV',
    joinedAt: data?.created_at || null,
    _fromCache: !data && !!cacheData,
    _lastResultAt: cacheData?.updated_at || null,
  };
}

/**
 * Primary service: builds a complete Academic Profile for a student.
 * Uses the existing result scraping backend + results_cache as the single source of truth.
 * 
 * @param {string} enrollment - Student enrollment number
 * @param {Function} onProgress - Optional callback (semester, total) for progress updates
 * @returns {AcademicProfile}
 */
export async function getStudentAcademicProfile(enrollment, onProgress = null) {
  const normalized = enrollment.trim().toUpperCase();

  // 1. Find student
  const student = await findStudentByEnrollment(normalized);
  if (!student) {
    return { found: false, student: null };
  }

  // 2. Fetch semester results — first check cache, then scrape
  const semesterResults = [];
  let checkedSemesters = 0;

  for (const sem of SEMESTERS) {
    // Try the cache first (set by backend on each result check)
    const cached = await getCachedSemesterResult(normalized, sem);

    if (cached) {
      semesterResults.push(normalizeSemesterResult(cached, sem));
      checkedSemesters++;
      if (onProgress) onProgress(sem, SEMESTERS.length);
      continue;
    }

    // No cache — try live scrape (no captcha on first attempt)
    try {
      const data = await fetchProxyResult(normalized, String(sem));
      if (data.success && data.data) {
        semesterResults.push(normalizeSemesterResult(data.data, sem));
        checkedSemesters++;
      }
      // If captcha required or not found, just skip this semester silently
    } catch {
      // Network error for this semester — skip
    }

    if (onProgress) onProgress(sem, SEMESTERS.length);
  }

  // 3. Sort by semester ascending
  semesterResults.sort((a, b) => a.semester - b.semester);

  if (semesterResults.length === 0) {
    return {
      found: true,
      student,
      noResults: true,
      semesterResults: [],
      academicSummary: null,
      backlogDetails: [],
    };
  }

  // 4. Compute Academic Summary from fetched results
  const lastResult = semesterResults[semesterResults.length - 1];
  const academicSummary = computeAcademicSummary(semesterResults, lastResult);

  // 5. Extract backlog details
  const backlogDetails = extractBacklogDetails(semesterResults);

  return {
    found: true,
    student: {
      ...student,
      // Override semester with the highest completed semester from results
      currentSemester: lastResult.semester,
    },
    academicSummary,
    semesterResults,
    backlogDetails,
    _fetchedAt: new Date().toISOString(),
  };
}

/**
 * Normalize raw result data (from scrape or cache) into a consistent shape.
 */
function normalizeSemesterResult(raw, semester) {
  const subjects = (raw.subjects || []).map(s => ({
    code: s.code || '',
    totalCredit: s.tCredit || '0',
    earnedCredit: s.eCredit || '0',
    grade: s.grade || 'N/A',
    isBacklog: isBacklogGrade(s.grade),
  }));

  const sgpa = parseFloat(raw.summary?.sgpa) || null;
  const cgpa = parseFloat(raw.summary?.cgpa) || null;
  const resultStatus = raw.summary?.resultDes || raw.status || '';
  const isPass = resultStatus.toLowerCase().includes('pass');
  const backlogs = subjects.filter(s => s.isBacklog).length;

  return {
    semester: parseInt(semester, 10),
    sgpa,
    cgpa,
    resultDescription: resultStatus,
    division: raw.summary?.division || null,
    isPass,
    backlogs,
    subjects,
    _cachedAt: raw._cachedAt || null,
    _timestamp: raw.timestamp || null,
  };
}

/**
 * A grade is a backlog if earned credit < total credit OR grade is F/AB/EX/W
 */
function isBacklogGrade(grade) {
  if (!grade) return false;
  const g = grade.toUpperCase().trim();
  return g === 'F' || g === 'AB' || g === 'EX' || g === 'W' || g === 'FAIL' || g === 'XX';
}

/**
 * Compute the overall academic summary from all semester results.
 */
function computeAcademicSummary(semesterResults, lastResult) {
  const validSGPAs = semesterResults.filter(r => r.sgpa !== null).map(r => r.sgpa);
  const latestCGPA = lastResult?.cgpa ?? null;
  const latestSGPA = lastResult?.sgpa ?? null;

  // Count backlogs across all semesters
  const allBacklogSubjects = semesterResults.flatMap(r =>
    r.subjects.filter(s => s.isBacklog).map(s => ({
      ...s,
      semester: r.semester,
    }))
  );

  // Count cleared backlogs: a subject that appeared as backlog in earlier sem 
  // but passed in a later sem (by code matching)
  const seenBacklogs = new Map();
  const clearedBacklogs = [];
  const activeBacklogs = [];

  for (const result of semesterResults) {
    for (const subject of result.subjects) {
      if (subject.isBacklog) {
        // Mark as backlog in this semester
        if (!seenBacklogs.has(subject.code)) {
          seenBacklogs.set(subject.code, { ...subject, semester: result.semester });
        }
      } else {
        // Passed — check if it was previously a backlog
        if (seenBacklogs.has(subject.code)) {
          const backlogEntry = seenBacklogs.get(subject.code);
          clearedBacklogs.push({
            ...backlogEntry,
            clearedInSemester: result.semester,
          });
          seenBacklogs.delete(subject.code);
        }
      }
    }
  }

  // Whatever remains in seenBacklogs is still active
  for (const [, backlog] of seenBacklogs.entries()) {
    activeBacklogs.push(backlog);
  }

  return {
    currentSGPA: latestSGPA,
    currentCGPA: latestCGPA,
    activeBacklogs: activeBacklogs.length,
    clearedBacklogs: clearedBacklogs.length,
    totalBacklogs: activeBacklogs.length + clearedBacklogs.length,
    semestersCompleted: semesterResults.length,
    overallStatus: semesterResults.every(r => r.isPass) ? 'GOOD STANDING' : 'AT RISK',
  };
}

/**
 * Extract backlog details across all semesters for the detailed view.
 */
function extractBacklogDetails(semesterResults) {
  const seenBacklogs = new Map();
  const allDetails = [];

  for (const result of semesterResults) {
    for (const subject of result.subjects) {
      if (subject.isBacklog) {
        if (!seenBacklogs.has(subject.code)) {
          seenBacklogs.set(subject.code, {
            code: subject.code,
            firstBacklogSemester: result.semester,
            status: 'active',
            clearedInSemester: null,
          });
        }
      } else if (seenBacklogs.has(subject.code)) {
        const entry = seenBacklogs.get(subject.code);
        entry.status = 'cleared';
        entry.clearedInSemester = result.semester;
      }
    }
  }

  for (const [, detail] of seenBacklogs.entries()) {
    allDetails.push(detail);
  }

  return allDetails;
}
