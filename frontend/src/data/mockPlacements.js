export const MOCK_COMPANIES = [
  {
    id: 'comp-1',
    name: 'Tata Consultancy Services (TCS)',
    industry: 'Information Technology & Consulting',
    location: 'Indore / PAN India',
    website: 'https://tcs.com',
    description: 'Global leader in IT services, consulting, and business solutions hiring for Ninja and Digital profiles.',
    logo_url: 'https://images.unsplash.com/photo-1542744094-3a3172720177?w=120&auto=format&fit=crop&q=80',
    created_at: new Date().toISOString()
  },
  {
    id: 'comp-2',
    name: 'Infosys Limited',
    industry: 'Software & Technology',
    location: 'Bengaluru / Pune',
    website: 'https://infosys.com',
    description: 'Next-generation digital services and consulting leader hiring Specialist Programmers and System Engineers.',
    logo_url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=120&auto=format&fit=crop&q=80',
    created_at: new Date().toISOString()
  },
  {
    id: 'comp-3',
    name: 'Wipro Technologies',
    industry: 'IT Services & BPO',
    location: 'Hyderabad / PAN India',
    website: 'https://wipro.com',
    description: 'Leading technology services and consulting company offering Elite National Talent Hunt opportunities.',
    logo_url: 'https://images.unsplash.com/photo-1554469384-e58fac16e23a?w=120&auto=format&fit=crop&q=80',
    created_at: new Date().toISOString()
  },
  {
    id: 'comp-4',
    name: 'Accenture India',
    industry: 'Management Consulting & Tech',
    location: 'Gurugram / Pune',
    website: 'https://accenture.com',
    description: 'Global professional services company providing services in strategy, consulting, digital, and technology.',
    logo_url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=120&auto=format&fit=crop&q=80',
    created_at: new Date().toISOString()
  },
  {
    id: 'comp-5',
    name: 'Cognizant Technology Solutions',
    industry: 'IT Services',
    location: 'Chennai / PAN India',
    website: 'https://cognizant.com',
    description: 'Multinational information technology services and consulting company hiring GenC Elevate roles.',
    logo_url: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=120&auto=format&fit=crop&q=80',
    created_at: new Date().toISOString()
  }
];

export const MOCK_DRIVES = [
  {
    id: 'drive-1',
    company_id: 'comp-1',
    title: 'TCS NQT National Campus Drive 2026',
    drive_date: '2026-10-15',
    registration_deadline: '2026-10-10',
    package: '3.6 - 7.2 LPA',
    eligibility_percentage: '60% or 6.0 CGPA (Diploma / BE / B.Tech)',
    location: 'Indore Campus / Online Assessment',
    companies: {
      name: 'Tata Consultancy Services (TCS)',
      logo_url: 'https://images.unsplash.com/photo-1542744094-3a3172720177?w=120&auto=format&fit=crop&q=80'
    },
    created_at: new Date().toISOString()
  },
  {
    id: 'drive-2',
    company_id: 'comp-2',
    title: 'Infosys Specialist Programmer & SE Recruitment',
    drive_date: '2026-10-22',
    registration_deadline: '2026-10-18',
    package: '4.0 - 9.5 LPA',
    eligibility_percentage: '65% Throughout in 10th, 12th & Diploma/Degree',
    location: 'Virtual Drive',
    companies: {
      name: 'Infosys Limited',
      logo_url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=120&auto=format&fit=crop&q=80'
    },
    created_at: new Date().toISOString()
  },
  {
    id: 'drive-3',
    company_id: 'comp-3',
    title: 'Wipro Elite NTH Drive for Batch 2026',
    drive_date: '2026-11-05',
    registration_deadline: '2026-11-01',
    package: '3.5 - 6.5 LPA',
    eligibility_percentage: '60% or 6.0 CGPA',
    location: 'Virtual Assessment',
    companies: {
      name: 'Wipro Technologies',
      logo_url: 'https://images.unsplash.com/photo-1554469384-e58fac16e23a?w=120&auto=format&fit=crop&q=80'
    },
    created_at: new Date().toISOString()
  }
];
