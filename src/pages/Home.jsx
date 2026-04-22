import { Link } from 'react-router-dom'
import { useStats } from '../hooks/useStats'
import { useTrending } from '../hooks/useTrending'
import { useAuth } from '../context/AuthContext'
import SEO from '../components/SEO'
import TrendingSection from '../components/TrendingSection'
import ContinueLearning from '../components/ContinueLearning'
import XPBar from '../components/XPBar'

const BRANCHES = [
  { name: 'Computer Science', icon: '🖥️', param: 'Computer+Science' },
  { name: 'Mechanical', icon: '⚙️', param: 'Mechanical' },
  { name: 'Electrical', icon: '⚡', param: 'Electrical' },
  { name: 'Civil', icon: '🏗️', param: 'Civil' },
  { name: 'Electronics', icon: '📡', param: 'Electronics' }
]

export default function Home () {
  const { stats } = useStats()
  const { trending, recentlyAdded, loading: trendingLoading } = useTrending()
  const { user } = useAuth()
  const s = stats || { total_notes: 0, total_pyq: 0, total_syllabus: 0 }

  return (
    <>
<<<<<<< HEAD
      <SEO title='RGPV Study Hub' description='One-stop portal for RGPV Study Hub notes, pyq and syllabus.' urlPath="/" />
=======
      <SEO title='RGPV Study Hub' description='One-stop portal for RGPV Diploma notes, pyq and syllabus.' urlPath="/" />
>>>>>>> ad11b44fc234b13ed695f73fce199db7d659a2e2

      {/* ── Hero ── */}
      <section className='hero' aria-label='Hero'>
        <div className='hero-bg' aria-hidden='true'>
          <div className='hero-blob hero-blob-1' />
          <div className='hero-blob hero-blob-2' />
          <div className='hero-blob hero-blob-3' />
          <div className='hero-grid' />
        </div>
        <div className='hero-content'>
<<<<<<< HEAD
          <div className='hero-badge'><span aria-hidden='true'>🟢</span><span>Free for all RGPV Students</span></div>
          <h1 className='hero-title'>RGPV<br /><span className='gradient-text'>Study Hub</span></h1>
=======
          <div className='hero-badge'><span aria-hidden='true'>🟢</span><span>Free for all RGPV Diploma Students</span></div>
          <h1 className='hero-title'>RGPV Diploma<br /><span className='gradient-text'>Study Hub</span></h1>
>>>>>>> ad11b44fc234b13ed695f73fce199db7d659a2e2
          <p className='hero-subtitle'>
            Your one-stop resource for <strong style={{ color: 'var(--accent-blue)' }}>all branches</strong>
            <br />Notes, Syllabus &amp; Previous Year Questions
          </p>
          <div className='hero-cta'>
            <Link to='/notes' className='btn-primary'><span aria-hidden='true'>📝</span><span>Browse Notes</span></Link>
            <Link to='/pyq' className='btn-secondary'><span aria-hidden='true'>📄</span><span>Previous Year Papers</span></Link>
          </div>

          {user && (
            <div className='hero-xp-wrapper'>
              <XPBar />
            </div>
          )}
        </div>
      </section>

      {/* ── Stats Strip ── */}
      <div className='stats-strip fade-in-up' aria-label='Site statistics'>
        <div className='stat-item'><div className='stat-number'>5+</div><div className='stat-label'>Diploma Branches</div></div>
        <div className='stat-item'><div className='stat-number'>6</div><div className='stat-label'>Semesters Covered</div></div>
        <div className='stat-item'><div className='stat-number'>{s.total_notes || 0}</div><div className='stat-label'>Subject Notes</div></div>
        <div className='stat-item'><div className='stat-number'>{s.total_pyq || 0}</div><div className='stat-label'>PYQ Papers</div></div>
        <div className='stat-item'><div className='stat-number'>Free</div><div className='stat-label'>Always</div></div>
      </div>

      {/* ── Continue Learning (logged-in only) ── */}
      <ContinueLearning />

      {/* ── Trending ── */}
      <div className='home-sections-wrapper'>
        <TrendingSection title='Trending This Week' icon='🔥' items={trending} sectionId='trending' loading={trendingLoading} />
        <TrendingSection title='Recently Added' icon='🆕' items={recentlyAdded} sectionId='recent' loading={trendingLoading} />
      </div>

      {/* ── What We Offer ── */}
      <section className='features-section' aria-labelledby='offers-heading'>
        <div className='section-header fade-in-up'>
          <div className='section-label'>What We Offer</div>
          <h2 className='section-title' id='offers-heading'>Everything You Need to Ace Your Exams 🎯</h2>
<<<<<<< HEAD
          <p className='section-desc'>Handpicked resources for RGPV — organized by branch and semester</p>
=======
          <p className='section-desc'>Handpicked resources for RGPV Diploma — organized by branch and semester</p>
>>>>>>> ad11b44fc234b13ed695f73fce199db7d659a2e2
        </div>
        <div className='feature-cards'>
          <Link to='/notes' className='feature-card notes fade-in-up'>
            <div className='card-icon notes-icon' aria-hidden='true'>📝</div>
            <div className='card-title'>Lecture Notes</div>
            <div className='card-desc'>Detailed, exam-focused notes for every subject. PDF format, free download.</div>
            <div className='card-meta'><span className='card-tag'>{s.total_notes || 0} PDFs</span><div className='card-arrow' aria-hidden='true'>→</div></div>
          </Link>
          <Link to='/syllabus' className='feature-card syllabus fade-in-up'>
            <div className='card-icon syllabus-icon' aria-hidden='true'>📋</div>
            <div className='card-title'>Syllabus</div>
<<<<<<< HEAD
            <div className='card-desc'>Official RGPV syllabus with topic-wise breakdowns.</div>
=======
            <div className='card-desc'>Official RGPV Diploma syllabus with topic-wise breakdowns.</div>
>>>>>>> ad11b44fc234b13ed695f73fce199db7d659a2e2
            <div className='card-meta'><span className='card-tag'>All Branches</span><div className='card-arrow' aria-hidden='true'>→</div></div>
          </Link>
          <Link to='/pyq' className='feature-card pyq fade-in-up'>
            <div className='card-icon pyq-icon' aria-hidden='true'>📄</div>
            <div className='card-title'>Previous Year Q.</div>
            <div className='card-desc'>Last 4 years of question papers. Understand exam patterns and practice.</div>
            <div className='card-meta'><span className='card-tag'>2021–2024</span><div className='card-arrow' aria-hidden='true'>→</div></div>
          </Link>
        </div>
      </section>

      {/* ── Branches ── */}
      <section className='branches-section' aria-labelledby='branches-heading'>
        <div className='section-header fade-in-up'>
          <div className='section-label'>Branches Available</div>
          <h2 className='section-title' id='branches-heading'>Pick Your Branch 🎓</h2>
        </div>
        <div className='branches-grid'>
          {BRANCHES.map((b) => (
            <Link key={b.name} to={`/notes?branch=${b.param}`} className='feature-card branch-card fade-in-up'>
              <div className='branch-icon' aria-hidden='true'>{b.icon}</div>
              <div className='card-title'>{b.name}</div>
              <div className='branch-sem-label'>6 Semesters</div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── How to Use ── */}
      <section className='howto-section' aria-labelledby='how-heading'>
        <div className='section-header fade-in-up'>
          <div className='section-label'>Simple &amp; Fast</div>
          <h2 className='section-title' id='how-heading'>How to Use ⚡</h2>
        </div>
        <div className='howto-grid'>
          {['Choose Page', 'Select Branch', 'Pick Semester', 'Download Free'].map((step, i) => (
            <div key={i} className='howto-card fade-in-up'>
              <div className='howto-num' aria-hidden='true'>{['1️⃣', '2️⃣', '3️⃣', '4️⃣'][i]}</div>
              <div className='howto-label'>{step}</div>
            </div>
          ))}
        </div>
      </section>
    </>
  )
}
