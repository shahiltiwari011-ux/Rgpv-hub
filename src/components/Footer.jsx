import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'

const HINGLISH_JOKES = [
  'Engineering life: Raat bhar padhai, subah sab safai! 🧹📖',
  'HTML seekh kar khud ko developer samajhna... alag hi swag hai! 😎',
  "VIVA ke time external: 'Beta, tell me anything.' Me: 'Dukh, dard, peeda...' 🥲",
  'RGPV exams: 40 pages bhariye, pass ho jaiye! (Conditions apply) 😂📝',
  'Chai + Coding + Last night study = Diploma Engineering! ☕️💻',
  "Internal marks mangna is like asking for 'Udhari'. Milta hi nahi! 💸😭",
  'Why do programmers prefer dark mode? Kyunki light se bugs chamakte hain! 🐜💡',
  'Attendance 75%: Engineering student ka sabse bada mission impossible! 🏃‍♂️💨'
]

export default function Footer () {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % HINGLISH_JOKES.length)
    }, 8000) // Change every 8 seconds
    return () => clearInterval(interval)
  }, [])

  return (
    <footer>
      <div className='footer-inner' style={{ gridTemplateColumns: '1.5fr 1fr 1.2fr' }}>
        <div className='footer-brand'>
          <Link to='/' className='nav-logo'>📚 StudyHub RGPV</Link>
          <p>Free Notes, Syllabus &amp; PYQ for all RGPV Diploma students. Built with ❤️ for engineering students.</p>
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
            <span className='footer-badge'>📍 RGPV Bhopal</span>
            <span className='footer-badge'>🎓 Diploma</span>
            <span className='footer-badge'>✅ Free Forever</span>
          </div>
        </div>

        <div className='footer-links'>
          <h4>Quick Links</h4>
          <ul>
            <li><Link to='/'>🏠 Home</Link></li>
            <li><Link to='/notes'>📝 Notes</Link></li>
            <li><Link to='/syllabus'>📋 Syllabus</Link></li>
            <li><Link to='/pyq'>📄 PYQ</Link></li>
          </ul>
        </div>

        <div className='footer-links'>
          <h4>Humour Zone 💡</h4>
          <div
            className='footer-joke' style={{
              background: 'var(--bg-primary)',
              padding: '1.25rem',
              borderRadius: '16px',
              border: '1px solid var(--border)',
              minHeight: '100px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              transition: 'all 0.5s ease',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <p style={{ margin: 0, fontStyle: 'italic', fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              "{HINGLISH_JOKES[index]}"
            </p>
            <div style={{ position: 'absolute', bottom: 0, left: 0, height: '2px', background: 'var(--accent-blue)', animation: 'progress 8s linear infinite' }} />
          </div>
          <p style={{ fontSize: '0.75rem', marginTop: '0.75rem', color: 'var(--text-muted)', textAlign: 'right' }}>Changes automatically ✨</p>
        </div>
      </div>

      <div className='footer-bottom'>
        <p>© {new Date().getFullYear()} RGPV Diploma Study Hub. Made for students, by students.</p>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes progress {
          from { width: 0%; }
          to { width: 100%; }
        }
        @media (max-width: 968px) {
          .footer-inner { grid-template-columns: 1fr 1fr !important; }
        }
        @media (max-width: 600px) {
          .footer-inner { grid-template-columns: 1fr !important; }
        }
      `
      }}
      />
    </footer>
  )
}
