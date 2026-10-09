/**
 * MobileResources — Resource browsing screen for the mobile app.
 * Provides search, type tabs (Notes/PYQ/Syllabus), semester filters,
 * and a clean list layout. Reuses useResources hook.
 */
import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useResources } from '../hooks/useResources';
import { buildResourceListLink } from '../utils/resourceLinks';

const TYPE_TABS = [
  { key: 'notes', label: 'Notes', icon: '📝' },
  { key: 'pyq', label: 'PYQ', icon: '📄' },
  { key: 'syllabus', label: 'Syllabus', icon: '📋' }
];

const SEMESTERS = [1, 2, 3, 4, 5, 6];

export default function MobileResources() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialType = searchParams.get('type') || 'notes';
  const [activeType, setActiveType] = useState(initialType);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSemester, setActiveSemester] = useState('');

  const { data, isPending, error, filters, count, updateFilter, refetch } = useResources(activeType, {
    branch: searchParams.get('branch') || ''
  });

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== filters.search) {
        updateFilter('search', searchTerm);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm, updateFilter, filters.search]);

  const handleTypeChange = useCallback((newType) => {
    setActiveType(newType);
    navigate(`/resources?type=${newType}`, { replace: true });
  }, [navigate]);

  const handleSemesterChange = useCallback((sem) => {
    const next = activeSemester === sem ? '' : sem;
    setActiveSemester(next);
    updateFilter('semester', next);
  }, [activeSemester, updateFilter]);

  const handleItemClick = useCallback((item) => {
    // If resource has a file_url, open it
    if (item.file_url) {
      window.open(item.file_url, '_blank');
    } else {
      // Navigate to the resource list for the type/branch
      navigate(buildResourceListLink({ type: item.type || activeType, branch: item.branch }));
    }
  }, [navigate, activeType]);

  const getTypeIcon = (type) => {
    if (type === 'notes') return '📝';
    if (type === 'pyq') return '📄';
    if (type === 'syllabus') return '📋';
    return '📁';
  };

  const getIconBg = (type) => {
    if (type === 'notes') return 'rgba(59, 130, 246, 0.12)';
    if (type === 'pyq') return 'rgba(139, 92, 246, 0.12)';
    if (type === 'syllabus') return 'rgba(16, 185, 129, 0.12)';
    return 'rgba(59, 130, 246, 0.12)';
  };

  return (
    <div className="m-resources">
      {/* Search */}
      <div className="m-search-bar">
        <span className="search-icon">🔍</span>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search resources..."
        />
      </div>

      {/* Type Tabs */}
      <div className="m-type-tabs">
        {TYPE_TABS.map(tab => (
          <button
            key={tab.key}
            className={`m-type-tab ${activeType === tab.key ? 'active' : ''}`}
            onClick={() => handleTypeChange(tab.key)}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Semester Filter */}
      <div className="m-sem-filter">
        <button
          className={`m-sem-pill ${!activeSemester ? 'active' : ''}`}
          onClick={() => handleSemesterChange('')}
        >
          All
        </button>
        {SEMESTERS.map(s => (
          <button
            key={s}
            className={`m-sem-pill ${activeSemester === s.toString() ? 'active' : ''}`}
            onClick={() => handleSemesterChange(s.toString())}
          >
            Sem {s}
          </button>
        ))}
      </div>

      {/* Count */}
      {count > 0 && !isPending && (
        <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '700', marginBottom: '12px' }}>
          {count} {activeType === 'pyq' ? 'papers' : 'resources'} found
        </div>
      )}

      {/* Loading */}
      {isPending && (
        <div>
          <div className="m-skeleton m-skeleton-card"></div>
          <div className="m-skeleton m-skeleton-card"></div>
          <div className="m-skeleton m-skeleton-card"></div>
          <div className="m-skeleton m-skeleton-card"></div>
        </div>
      )}

      {/* Error */}
      {error && error !== 'OFFLINE_MODE' && !isPending && (
        <div className="m-result-error">
          {error}
          <br />
          <button className="m-result-retry" onClick={refetch}>Retry</button>
        </div>
      )}

      {/* Empty State */}
      {!isPending && !error && data.length === 0 && (
        <div className="m-empty">
          <div className="m-empty-icon">{getTypeIcon(activeType)}</div>
          <h3 className="m-empty-title">No {activeType} found</h3>
          <p className="m-empty-desc">Try a different semester or search term</p>
        </div>
      )}

      {/* Resource List */}
      {!isPending && data.length > 0 && (
        <div>
          {data.map(item => (
            <div
              key={item.id}
              className="m-resource-item"
              onClick={() => handleItemClick(item)}
            >
              <div className="m-resource-icon" style={{ background: getIconBg(item.type || activeType) }}>
                {item.icon || getTypeIcon(item.type || activeType)}
              </div>
              <div className="m-resource-info">
                <div className="m-resource-title">{item.title}</div>
                <div className="m-resource-sub">
                  {item.branch && `${item.branch} • `}Sem {item.semester}
                  {item.download_count > 0 && ` • ${item.download_count} downloads`}
                </div>
              </div>
              <span className="m-resource-arrow">›</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
