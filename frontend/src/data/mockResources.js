export const MOCK_RESOURCES = [
  // ── Computer Science Notes ──
  { id: 'mock-cs-n1', title: 'Data Structures & Algorithms Complete Notes', subject: 'Data Structures (CS-302)', branch: 'Computer Science', semester: 3, type: 'notes', icon: '📚', file_url: '#', download_count: 120, created_at: new Date().toISOString() },
  { id: 'mock-cs-n2', title: 'Database Management Systems Notes', subject: 'DBMS (CS-403)', branch: 'Computer Science', semester: 4, type: 'notes', icon: '🗄️', file_url: '#', download_count: 85, created_at: new Date().toISOString() },
  { id: 'mock-cs-n3', title: 'Operating Systems Notes', subject: 'OS (CS-501)', branch: 'Computer Science', semester: 5, type: 'notes', icon: '💻', file_url: '#', download_count: 210, created_at: new Date().toISOString() },
  { id: 'mock-cs-n4', title: 'Computer Networks Notes', subject: 'CN (CS-601)', branch: 'Computer Science', semester: 6, type: 'notes', icon: '🌐', file_url: '#', download_count: 175, created_at: new Date().toISOString() },
  { id: 'mock-cs-n5', title: 'Engineering Mathematics I Notes', subject: 'Maths-I (BT-101)', branch: 'Computer Science', semester: 1, type: 'notes', icon: '📐', file_url: '#', download_count: 310, created_at: new Date().toISOString() },
  { id: 'mock-cs-n6', title: 'Object Oriented Programming (C++) Notes', subject: 'OOP (CS-202)', branch: 'Computer Science', semester: 2, type: 'notes', icon: '🔷', file_url: '#', download_count: 145, created_at: new Date().toISOString() },

  // ── Computer Science PYQ ──
  { id: 'mock-cs-p1', title: 'Data Structures Exam Paper 2023', subject: 'Data Structures (CS-302)', branch: 'Computer Science', semester: 3, type: 'pyq', year: '2023', icon: '📄', file_url: '#', download_count: 450, created_at: new Date().toISOString() },
  { id: 'mock-cs-p2', title: 'DBMS Exam Paper 2022', subject: 'DBMS (CS-403)', branch: 'Computer Science', semester: 4, type: 'pyq', year: '2022', icon: '📄', file_url: '#', download_count: 320, created_at: new Date().toISOString() },
  { id: 'mock-cs-p3', title: 'Operating Systems Exam Paper 2023', subject: 'OS (CS-501)', branch: 'Computer Science', semester: 5, type: 'pyq', year: '2023', icon: '📄', file_url: '#', download_count: 280, created_at: new Date().toISOString() },

  // ── Computer Science Syllabus ──
  { id: 'mock-cs-s1', title: 'CS 3rd Semester Official Syllabus', branch: 'Computer Science', semester: 3, type: 'syllabus', icon: '📋', topics: ['Data Structures', 'Discrete Maths', 'Digital Electronics'], file_url: '#', download_count: 230, created_at: new Date().toISOString() },
  { id: 'mock-cs-s2', title: 'CS 5th Semester Official Syllabus', branch: 'Computer Science', semester: 5, type: 'syllabus', icon: '📋', topics: ['Operating Systems', 'Web Tech', 'Software Engineering'], file_url: '#', download_count: 190, created_at: new Date().toISOString() },

  // ── Mechanical Notes ──
  { id: 'mock-me-n1', title: 'Strength of Materials Complete Notes', subject: 'SOM (ME-302)', branch: 'Mechanical', semester: 3, type: 'notes', icon: '⚙️', file_url: '#', download_count: 98, created_at: new Date().toISOString() },
  { id: 'mock-me-n2', title: 'Thermodynamics Notes', subject: 'Thermal Engg (ME-403)', branch: 'Mechanical', semester: 4, type: 'notes', icon: '🔥', file_url: '#', download_count: 112, created_at: new Date().toISOString() },
  { id: 'mock-me-n3', title: 'Engineering Drawing Notes', subject: 'ED (BT-102)', branch: 'Mechanical', semester: 1, type: 'notes', icon: '📐', file_url: '#', download_count: 77, created_at: new Date().toISOString() },
  { id: 'mock-me-n4', title: 'Fluid Mechanics Notes', subject: 'FM (ME-501)', branch: 'Mechanical', semester: 5, type: 'notes', icon: '💧', file_url: '#', download_count: 88, created_at: new Date().toISOString() },

  // ── Mechanical PYQ ──
  { id: 'mock-me-p1', title: 'Strength of Materials Exam Paper 2023', branch: 'Mechanical', semester: 3, type: 'pyq', year: '2023', icon: '📄', file_url: '#', download_count: 190, created_at: new Date().toISOString() },
  { id: 'mock-me-p2', title: 'Thermodynamics Exam Paper 2022', branch: 'Mechanical', semester: 4, type: 'pyq', year: '2022', icon: '📄', file_url: '#', download_count: 155, created_at: new Date().toISOString() },

  // ── Mechanical Syllabus ──
  { id: 'mock-me-s1', title: 'Mechanical 4th Semester Syllabus', branch: 'Mechanical', semester: 4, type: 'syllabus', icon: '📋', topics: ['Thermodynamics', 'Machine Design', 'Manufacturing'], file_url: '#', download_count: 140, created_at: new Date().toISOString() },

  // ── Electrical Notes ──
  { id: 'mock-el-n1', title: 'Basic Electrical Engineering Notes', subject: 'BEE (BT-104)', branch: 'Electrical', semester: 1, type: 'notes', icon: '⚡', file_url: '#', download_count: 95, created_at: new Date().toISOString() },
  { id: 'mock-el-n2', title: 'Power Systems Notes', subject: 'Power Sys (EE-501)', branch: 'Electrical', semester: 5, type: 'notes', icon: '🔌', file_url: '#', download_count: 82, created_at: new Date().toISOString() },
  { id: 'mock-el-n3', title: 'Electrical Machines Notes', subject: 'Elec Machines (EE-402)', branch: 'Electrical', semester: 4, type: 'notes', icon: '⚡', file_url: '#', download_count: 110, created_at: new Date().toISOString() },

  // ── Electrical PYQ ──
  { id: 'mock-el-p1', title: 'Electrical Machines Exam Paper 2023', branch: 'Electrical', semester: 4, type: 'pyq', year: '2023', icon: '📄', file_url: '#', download_count: 175, created_at: new Date().toISOString() },

  // ── Civil Notes ──
  { id: 'mock-cv-n1', title: 'Structural Engineering Notes', subject: 'Structural Engg (CE-302)', branch: 'Civil', semester: 3, type: 'notes', icon: '🏗️', file_url: '#', download_count: 76, created_at: new Date().toISOString() },
  { id: 'mock-cv-n2', title: 'Surveying Notes', subject: 'Surveying (CE-202)', branch: 'Civil', semester: 2, type: 'notes', icon: '🗺️', file_url: '#', download_count: 63, created_at: new Date().toISOString() },
  { id: 'mock-cv-n3', title: 'Fluid Mechanics (Civil) Notes', subject: 'FM (CE-401)', branch: 'Civil', semester: 4, type: 'notes', icon: '💧', file_url: '#', download_count: 59, created_at: new Date().toISOString() },

  // ── Civil PYQ ──
  { id: 'mock-cv-p1', title: 'Structural Engineering Exam Paper 2023', branch: 'Civil', semester: 3, type: 'pyq', year: '2023', icon: '📄', file_url: '#', download_count: 120, created_at: new Date().toISOString() },

  // ── Electronics Notes ──
  { id: 'mock-ec-n1', title: 'Electronic Circuits Notes', subject: 'EC (EC-302)', branch: 'Electronics', semester: 3, type: 'notes', icon: '📡', file_url: '#', download_count: 88, created_at: new Date().toISOString() },
  { id: 'mock-ec-n2', title: 'Digital Electronics Notes', subject: 'DE (EC-201)', branch: 'Electronics', semester: 2, type: 'notes', icon: '💡', file_url: '#', download_count: 120, created_at: new Date().toISOString() },
  { id: 'mock-ec-n3', title: 'Microprocessors Notes', subject: 'MP (EC-502)', branch: 'Electronics', semester: 5, type: 'notes', icon: '🔲', file_url: '#', download_count: 97, created_at: new Date().toISOString() },

  // ── Electronics PYQ ──
  { id: 'mock-ec-p1', title: 'Digital Electronics Exam Paper 2023', branch: 'Electronics', semester: 2, type: 'pyq', year: '2023', icon: '📄', file_url: '#', download_count: 210, created_at: new Date().toISOString() },

  // ── Electronics Syllabus ──
  { id: 'mock-ec-s1', title: 'Electronics 3rd Semester Syllabus', branch: 'Electronics', semester: 3, type: 'syllabus', icon: '📋', topics: ['Electronic Circuits', 'Communication', 'Signals & Systems'], file_url: '#', download_count: 105, created_at: new Date().toISOString() },
]

export const MOCK_STATS = {
  total_notes: 18,
  total_pyq: 9,
  total_syllabus: 4,
}
