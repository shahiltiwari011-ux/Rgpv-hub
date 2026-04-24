import { useState } from 'react'

export default function RatingPicker ({ value, onChange, size = '1.5rem', disabled = false }) {
  const [hover, setHover] = useState(null)

  return (
    <div className='rating-picker' style={{ display: 'flex', gap: '0.2rem' }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type='button'
          disabled={disabled}
          onClick={() => onChange(star)}
          onMouseEnter={() => !disabled && setHover(star)}
          onMouseLeave={() => !disabled && setHover(null)}
          style={{
            background: 'none',
            border: 'none',
            cursor: disabled ? 'default' : 'pointer',
            fontSize: size,
            padding: 0,
            transition: 'transform 0.1s ease',
            transform: (hover || value) >= star ? 'scale(1.1)' : 'scale(1)',
            color: (hover || value) >= star ? '#fbbf24' : 'var(--text-muted)',
            opacity: disabled ? 0.7 : 1
          }}
        >
          {(hover || value) >= star ? '★' : '☆'}
        </button>
      ))}
    </div>
  )
}
