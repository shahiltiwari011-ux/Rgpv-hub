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
      .ilike('enrollment', enrollment)
      .eq('semester', String(semester))
      .maybeSingle();

    if (error || !data) {
      // Fallback: try old schema (no semester column)
      const { data: fallback } = await supabase
        .from('results_cache')
        .select('result_data, updated_at')
        .ilike('enrollment', enrollment)
        .limit(1)
        .maybeSingle();

      if (fallback?.result_data) {
        const rd = fallback.result_data;
        if (String(rd.semester) === String(semester)) {
          return { ...rd, _cachedAt: fallback.updated_at };
        }
      }
      return null;
    }

    const rd = data.result_data;
    if (rd) {
      return { ...rd, _cachedAt: data.updated_at };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Search for a student in the profiles table by enrollment number.
 */
export async function findStudentByEnrollment(enrollment) {
  if (!enrollment || !enrollment.trim()) {
    throw new Error('Enrollment number is required');
  }

  const normalized = enrollment.trim().toUpperCase();

  if (!/^[A-Z0-9]{6,20}$/.test(normalized)) {
    throw new Error('Invalid enrollment number format');
  }

  if (!isSupabaseReady()) {
    // Return null instead of throwing — we can still try scraping
    return null;
  }

  let data = null;
  try {
    const result = await supabase
      .from('profiles')
      .select('id, name, email, roll_number, branch, semester, department, college, created_at, role')
      .eq('roll_number', normalized)
      .maybeSingle();
    data = result.data;
  } catch (e) {
    console.warn("Profile search error:", e);
  }

  // Also check the results_cache for student info from RGPV data
  let cacheData = null;
  try {
    const result = await supabase
      .from('results_cache')
      .select('result_data, updated_at, enrollment')
      .ilike('enrollment', normalized)
      .limit(1)
      .maybeSingle();
    cacheData = result.data;
  } catch (e) {
    console.warn("Cache search error:", e);
  }

  if (!data && !cacheData) {
    return null;
  }

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
 * Phase 1: Build an academic profile from CACHED data only (no live scraping).
 * Returns whatever is available in the cache. If nothing is cached, returns found:false.
 * Also returns missingSemesters so the UI can drive live fetching.
 */
export async function getStudentAcademicProfile(enrollment, onProgress = null) {
  const normalized = enrollment.trim().toUpperCase();

  // 1. Find student from DB or Cache
  let student = await findStudentByEnrollment(normalized);
  
  if (!student) {
    student = {
      id: null,
      name: null,
      email: null,
      rollNumber: normalized,
      branch: null,
      semester: null,
      department: null,
      college: 'RGPV',
      joinedAt: null,
      _fromCache: false,
      _lastResultAt: null,
    };
  }

  // 2. Check cache for each semester
  const semesterResults = [];
  const missingSemesters = [];

  for (const sem of SEMESTERS) {
    const cached = await getCachedSemesterResult(normalized, sem);
    if (cached) {
      semesterResults.push(normalizeSemesterResult(cached, sem));
    } else {
      missingSemesters.push(sem);
    }
    if (onProgress) onProgress(sem, SEMESTERS.length);
  }

  semesterResults.sort((a, b) => a.semester - b.semester);

  if (semesterResults.length === 0) {
    // Nothing cached — need live fetch
    return {
      found: false,
      student,
      needsLiveFetch: true,
      missingSemesters,
      semesterResults: [],
      academicSummary: null,
      backlogDetails: [],
    };
  }

  // Update student info from results if missing
  if (!student.name || student.name === 'Unknown') {
    const lastResult = semesterResults[semesterResults.length - 1];
    student.name = lastResult._rawName || 'Unknown';
    student.branch = lastResult._rawBranch || student.branch || 'N/A';
  }

  const lastResult = semesterResults[semesterResults.length - 1];
  const academicSummary = computeAcademicSummary(semesterResults, lastResult);
  const backlogDetails = extractBacklogDetails(semesterResults);

  return {
    found: true,
    student: {
      ...student,
      currentSemester: lastResult.semester,
    },
    academicSummary,
    semesterResults,
    backlogDetails,
    missingSemesters,
    _fetchedAt: new Date().toISOString(),
  };
}

/**
 * Phase 2: Live-fetch a single semester via the backend proxy.
 * This is called by the UI one semester at a time, handling CAPTCHA interactively.
 * 
 * @param {string} enrollment 
 * @param {string} semester 
 * @param {string} captcha - The captcha text (empty on first call)
 * @param {string} sessionId - Session ID from previous captcha_required response
 * @returns {object} - { success, data, type, captchaImg, sessionId }
 */
export async function fetchSemesterLive(enrollment, semester, captcha = '', sessionId = null) {
  const normalized = enrollment.trim().toUpperCase();
  const data = await fetchProxyResult(normalized, String(semester), captcha, sessionId);
  
  if (data.success && data.data) {
    return {
      success: true,
      result: normalizeSemesterResult(data.data, semester),
    };
  }
  
  // Pass through captcha_required, not_found, etc
  return data;
}

/**
 * Build the academic summary from an array of semester results.
 * Can be called from the UI after accumulating results.
 */
export function buildProfileFromResults(student, semesterResults) {
  if (!semesterResults || semesterResults.length === 0) {
    return {
      found: false,
      student,
      semesterResults: [],
      academicSummary: null,
      backlogDetails: [],
    };
  }

  const sorted = [...semesterResults].sort((a, b) => a.semester - b.semester);
  const lastResult = sorted[sorted.length - 1];

  // Update student info from results
  if (!student.name || student.name === 'Unknown') {
    student.name = lastResult._rawName || 'Unknown';
    student.branch = lastResult._rawBranch || student.branch || 'N/A';
  }

  const academicSummary = computeAcademicSummary(sorted, lastResult);
  const backlogDetails = extractBacklogDetails(sorted);

  return {
    found: true,
    student: {
      ...student,
      currentSemester: lastResult.semester,
    },
    academicSummary,
    semesterResults: sorted,
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
    _rawName: raw.name || null,
    _rawBranch: raw.branch || null,
    _cachedAt: raw._cachedAt || null,
    _timestamp: raw.timestamp || null,
  };
}

/**
 * A grade is a backlog if grade is F/AB/EX/W
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

  const seenBacklogs = new Map();
  const clearedBacklogs = [];
  const activeBacklogs = [];

  for (const result of semesterResults) {
    for (const subject of result.subjects) {
      if (subject.isBacklog) {
        if (!seenBacklogs.has(subject.code)) {
          seenBacklogs.set(subject.code, { ...subject, semester: result.semester });
        }
      } else {
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
 * Extract backlog details across all semesters.
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
