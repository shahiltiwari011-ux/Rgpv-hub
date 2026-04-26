import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getResourceRatingsBatch } from '../services/api';
import { useResources } from '../hooks/useResources';
import FilterBar from '../components/FilterBar';
import Pagination from '../components/Pagination';
import { LoadingSpinner, EmptyState, ErrorState } from '../components/States';
import SEO from '../components/SEO';
import { useAuth } from '../context/AuthContext';
import ResourceCard from '../components/ResourceCard';
import { buildResourceListLink } from '../utils/resourceLinks';
import OfflineBanner from '../components/OfflineBanner';

const PAGE_CONFIG = {
  notes: {
    icon: '📝',
    title: 'Lecture Notes',
    subtitle: 'Download detailed, exam-focused notes for every subject',
    seoTitle: 'Lecture Notes - PROJECTX',
    seoDescription: 'Browse latest elite academic notes on PROJECTX. Download high-quality lecture notes for all engineering branches.',
    emptyTitle: 'No notes found',
    emptyMessage: 'Try selecting a different branch or semester.',
    loadingText: 'Loading notes...',
    countLabel: 'resources'
  },
  syllabus: {
    icon: '📋',
    title: 'Syllabus',
    subtitle: 'Official RGPV Diploma syllabus with topic-wise breakdowns',
    seoTitle: 'Official Syllabus - PROJECTX',
    seoDescription: 'Access the official academic syllabus on PROJECTX with comprehensive topic-wise breakdowns.',
    emptyTitle: 'No syllabus found',
    emptyMessage: 'Try a different filter.',
    loadingText: 'Loading syllabus...',
    countLabel: 'entries'
  },
  pyq: {
    icon: '📄',
    title: 'Previous Year Papers',
    subtitle: 'Practice with real exam papers from 2021-2024',
    seoTitle: 'Previous Year Papers (PYQ) - PROJECTX',
    seoDescription: 'Practice with verified academic exam papers from 2021-2024 on PROJECTX.',
    emptyTitle: 'No papers found',
    emptyMessage: 'Try a different filter.',
    loadingText: 'Loading papers...',
    countLabel: 'papers'
  }
};

export default function ResourcePage ({ type }) {
  const config = PAGE_CONFIG[type] || PAGE_CONFIG.notes;
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialBranch = searchParams.get('branch') || '';
  const { data, isPending, error, filters, totalPages, count, updateFilter, refetch, isMock } = useResources(type, { branch: initialBranch });

  const { user, isAdmin } = useAuth();
  const [searchTerm, setSearchTerm] = useState(filters.search);
  const [ratingsByResource, setRatingsByResource] = useState({});
  const [userRatingsByResource, setUserRatingsByResource] = useState({});

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== filters.search) {
        updateFilter('search', searchTerm);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [searchTerm, updateFilter, filters.search]);

  useEffect(() => {
    const nextParams = new URLSearchParams(searchParams);
    
    if (filters.branch) nextParams.set('branch', filters.branch);
    else nextParams.delete('branch');
    
    if (filters.semester) nextParams.set('semester', filters.semester);
    else nextParams.delete('semester');
    
    if (filters.page > 1) nextParams.set('page', filters.page);
    else nextParams.delete('page');

    const current = searchParams.toString();
    const next = nextParams.toString();

    if (current !== next) {
      setSearchParams(nextParams, { replace: true });
    }
  }, [filters, searchParams, setSearchParams]);

  const refreshRatings = useCallback(async () => {
    if (!data.length || isMock) {
      setRatingsByResource({});
      setUserRatingsByResource({});
      return;
    }

    try {
      const { ratingsByResource: nextRatings, userRatingsByResource: nextUserRatings } = await getResourceRatingsBatch(
        data.map(item => item.id),
        user?.id || null
      );

      setRatingsByResource(nextRatings);
      setUserRatingsByResource(nextUserRatings);
    } catch (err) {
      console.warn('Ratings fetch failed in offline/error mode');
    }
  }, [data, user?.id, isMock]);

  useEffect(() => {
    refreshRatings();
  }, [refreshRatings]);

  const handleTypeChange = (newType) => {
    navigate(
      buildResourceListLink({
        type: newType === 'pyq' ? 'pyq' : newType,
        branch: filters.branch
      })
    );
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  return (
    <>
      <SEO
        title={config.seoTitle}
        description={config.seoDescription}
        urlPath={`/${type === 'pyq' ? 'pyq' : type}`}
      />
      
      <OfflineBanner isMock={isMock} onRetry={refetch} />

      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="page-hero-premium"
      >
        <div className="hero-icon-blob">{config.icon}</div>
        <h1 className="page-hero-title">{config.title}</h1>
        <p className="page-hero-sub">{config.subtitle}</p>

        {isAdmin && (
          <Link
            to={`/admin/upload?type=${type}`}
            className="btn-primary-glow"
          >
            + Upload {type === 'pyq' ? 'Paper' : type.charAt(0).toUpperCase() + type.slice(1, -1)}
          </Link>
        )}

        {count > 0 && <div className="results-count-pill">{count} {config.countLabel} found</div>}
      </motion.div>

      <FilterBar
        branch={filters.branch}
        semester={filters.semester}
        search={searchTerm}
        type={type}
        onBranchChange={(value) => updateFilter('branch', value)}
        onSemesterChange={(value) => updateFilter('semester', value)}
        onSearchChange={setSearchTerm}
        onTypeChange={handleTypeChange}
      />

      {isPending && <LoadingSpinner text={config.loadingText} />}
      {error && !isMock && <ErrorState message={error} onRetry={refetch} />}
      {!isPending && !isMock && !error && data.length === 0 && <EmptyState icon={config.icon} title={config.emptyTitle} message={config.emptyMessage} />}

      {!isPending && (data.length > 0 || isMock) && (!error || isMock) && (
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="subjects-grid"
        >
          {data.map((item) => (
            <ResourceCard
              key={item.id}
              item={item}
              type={type}
              ratingInfo={ratingsByResource[item.id] || { average: 0, count: 0 }}
              userRating={userRatingsByResource[item.id] ?? null}
              onRatingSubmitted={refreshRatings}
            />
          ))}
        </motion.div>
      )}
      
      {!isPending && totalPages > 1 && (
        <Pagination page={filters.page} totalPages={totalPages} onPageChange={(page) => updateFilter('page', page)} />
      )}

      <style>{`
        .page-hero-premium {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: 6rem 1rem 4rem;
          position: relative;
        }
        
        .hero-icon-blob {
          width: 80px;
          height: 80px;
          background: rgba(59, 130, 246, 0.1);
          border-radius: 2.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2.5rem;
          margin-bottom: 1.5rem;
          box-shadow: 0 20px 40px rgba(0,0,0,0.1);
          border: 1px solid rgba(59, 130, 246, 0.2);
        }

        .page-hero-title {
          font-family: 'Syne', sans-serif;
          font-size: clamp(2rem, 8vw, 3.5rem);
          font-weight: 800;
          letter-spacing: -2px;
          margin: 0;
          color: var(--text-primary);
        }

        .page-hero-sub {
          font-size: 1.1rem;
          color: var(--text-muted);
          max-width: 600px;
          margin: 1rem auto 0;
          font-weight: 500;
        }

        .btn-primary-glow {
          margin-top: 2rem;
          background: var(--accent-blue);
          color: #fff;
          padding: 1rem 2rem;
          border-radius: 1.25rem;
          font-weight: 800;
          text-decoration: none;
          box-shadow: 0 10px 25px rgba(59, 130, 246, 0.4);
          transition: 0.3s;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
        }
        .btn-primary-glow:hover {
          transform: translateY(-3px);
          box-shadow: 0 15px 35px rgba(59, 130, 246, 0.5);
        }

        .results-count-pill {
          margin-top: 1.5rem;
          background: var(--bg-card);
          color: var(--text-muted);
          padding: 0.4rem 1rem;
          border-radius: 2rem;
          font-size: 0.8rem;
          font-weight: 700;
          border: 1px solid var(--border);
          letter-spacing: 1px;
          text-transform: uppercase;
        }

        .subjects-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 2rem;
          padding-bottom: 4rem;
        }

        @media (max-width: 768px) {
          .page-hero-premium { padding: 4rem 1rem 2rem; }
          .subjects-grid { grid-template-columns: 1fr; gap: 1.5rem; }
        }
      `}</style>
    </>
  );
}
