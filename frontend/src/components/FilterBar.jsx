import { BRANCHES, SEMESTERS, RESOURCE_TYPES } from '../utils/constants'

export default function FilterBar ({ 
  branch, 
  semester, 
  search = '', 
  type,
  onBranchChange, 
  onSemesterChange, 
  onSearchChange,
  onTypeChange 
}) {
  return (
    <div className='selector-section'>
      <div className='filter-grid'>
        {/* Search */}
        <div className='filter-item search-box'>
          <div className='selector-label'>Search Resources</div>
          <div style={{ position: 'relative' }}>
            <input
              type='text'
              placeholder='Search by subject, title or topic...'
              className='form-input'
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              style={{ paddingLeft: '2.8rem', height: '48px' }}
            />
            <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.5, fontSize: '1.2rem' }}>🔍</span>
          </div>
        </div>

        {/* Resource Type */}
        <div className='filter-item'>
          <div className='selector-label'>Resource Type</div>
          <div className='tab-group'>
            {RESOURCE_TYPES.map((t) => (
              <button
                key={t}
                className={`tab-btn ${type === t ? 'active' : ''}`}
                onClick={() => onTypeChange(t)}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Branch */}
        <div className='filter-item'>
          <div className='selector-label'>Branch</div>
          <div className='tab-group'>
            <button
              className={`tab-btn ${!branch ? 'active' : ''}`}
              onClick={() => onBranchChange('')}
            >
              All
            </button>
            {BRANCHES.map((b) => (
              <button
                key={b}
                className={`tab-btn ${branch === b ? 'active' : ''}`}
                onClick={() => onBranchChange(b)}
              >
                {b}
              </button>
            ))}
          </div>
        </div>

        {/* Semester */}
        <div className='filter-item'>
          <div className='selector-label'>Semester</div>
          <div className='tab-group'>
            <button
              className={`tab-btn sem-btn ${!semester ? 'active' : ''}`}
              onClick={() => onSemesterChange('')}
            >
              All
            </button>
            {SEMESTERS.map((s) => (
              <button
                key={s}
                className={`tab-btn sem-btn ${semester === s ? 'active' : ''}`}
                onClick={() => onSemesterChange(s)}
              >
                Sem {s}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
