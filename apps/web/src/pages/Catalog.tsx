import React, { useState, useEffect } from 'react';
import { searchApi, departmentsApi } from '../services/api';
import { SubmissionDto, DepartmentDto, DocumentType } from '@fulafia/shared';
import { StatusBadge } from '../components/StatusBadge';
import { Search, Filter, BookOpen, Calendar, User, FileText, ExternalLink } from 'lucide-react';

interface CatalogProps {
  onSelectWork: (id: string) => void;
}

const PAGE_SIZE = 12;

export const Catalog: React.FC<CatalogProps> = ({ onSelectWork }) => {
  const [submissions, setSubmissions] = useState<SubmissionDto[]>([]);
  const [departments, setDepartments] = useState<DepartmentDto[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  // Filters
  const [query, setQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedDocType, setSelectedDocType] = useState<DocumentType | ''>('');
  const [selectedYear, setSelectedYear] = useState('');

  useEffect(() => {
    departmentsApi.getAll().then(setDepartments).catch(console.error);
  }, []);

  const loadCatalog = async (p = 1) => {
    setLoading(true);
    try {
      const res = await searchApi.searchCatalog({
        query: query || undefined,
        departmentId: selectedDept || undefined,
        documentType: selectedDocType || undefined,
        year: selectedYear ? Number(selectedYear) : undefined,
        page: p,
        limit: PAGE_SIZE,
      });
      setSubmissions(res.data);
      setTotal(res.total);
      setPage(p);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Auto-load on mount and when dropdown filters change
  useEffect(() => { loadCatalog(1); }, [selectedDept, selectedDocType, selectedYear]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadCatalog(1);
  };

  const clearFilters = () => {
    setSelectedDept('');
    setSelectedDocType('');
    setSelectedYear('');
    setQuery('');
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div>
      {/* Page header */}
      <div style={{ padding: '2rem 0 1.75rem', borderBottom: '1px solid var(--color-gray-200)', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 800, color: 'var(--color-shark)', marginBottom: '0.375rem' }}>
          Scholarly Repository
        </h1>
        <p style={{ color: 'var(--color-gray-600)', fontSize: '0.9375rem', marginBottom: '1.25rem', maxWidth: '680px' }}>
          Browse published theses, dissertations, peer-reviewed journals, and conference papers from the Federal University of Lafia.
        </p>

        {/* Search bar */}
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.625rem', maxWidth: '680px', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: '1 1 280px' }}>
            <Search size={17} color="var(--color-gray-400)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
            <input
              type="text"
              placeholder="Search title, author, keyword, or ID (e.g. FULAFIA-2026-TH-001)…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="form-input"
              style={{ paddingLeft: '2.5rem' }}
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ flexShrink: 0 }}>
            <Search size={15} /> Search
          </button>
        </form>
      </div>

      {/* Main layout: sidebar + results */}
      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '2rem', alignItems: 'start' }} className="catalog-grid">

        {/* Sidebar filters */}
        <aside className="card" style={{ padding: '1.25rem', position: 'sticky', top: '80px' }}>
          <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--color-shark)', borderBottom: '1px solid var(--color-gray-200)', paddingBottom: '0.75rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Filter size={15} color="var(--color-luxor-gold)" /> Filter Publications
          </div>

          <div className="form-group">
            <label className="form-label">Department</label>
            <select value={selectedDept} onChange={(e) => setSelectedDept(e.target.value)} className="form-select">
              <option value="">All Departments</option>
              {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Document Type</label>
            <select value={selectedDocType} onChange={(e) => setSelectedDocType(e.target.value as any)} className="form-select">
              <option value="">All Types</option>
              <option value="THESIS">Thesis</option>
              <option value="DISSERTATION">Dissertation</option>
              <option value="JOURNAL_ARTICLE">Journal Article</option>
              <option value="CONFERENCE_PAPER">Conference Paper</option>
              <option value="TECHNICAL_REPORT">Technical Report</option>
              <option value="DATASET">Dataset</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Publication Year</label>
            <input
              type="number"
              placeholder="e.g. 2025"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="form-input"
              min="2000"
              max="2099"
            />
          </div>

          {(selectedDept || selectedDocType || selectedYear || query) && (
            <button onClick={clearFilters} className="btn btn-secondary btn-sm" style={{ width: '100%', marginTop: '0.25rem' }}>
              Clear Filters
            </button>
          )}
        </aside>

        {/* Results */}
        <main>
          {/* Result count */}
          <div style={{ fontSize: '0.875rem', color: 'var(--color-gray-600)', marginBottom: '1rem' }}>
            {loading ? 'Loading…' : (
              <>Showing <strong>{total === 0 ? 0 : Math.min((page - 1) * PAGE_SIZE + 1, total)}–{Math.min(page * PAGE_SIZE, total)}</strong> of <strong>{total}</strong> repository works</>
            )}
          </div>

          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-gray-500)' }}>
              Loading repository records…
            </div>
          ) : submissions.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
              <BookOpen size={40} color="var(--color-gray-300)" style={{ margin: '0 auto 1rem' }} />
              <h3 style={{ fontWeight: 700, color: 'var(--color-shark)', marginBottom: '0.5rem' }}>No works found</h3>
              <p style={{ color: 'var(--color-gray-500)', fontSize: '0.875rem' }}>
                Try relaxing your search query or clearing the filters.
              </p>
              {(selectedDept || selectedDocType || selectedYear || query) && (
                <button onClick={clearFilters} className="btn btn-secondary btn-sm" style={{ marginTop: '1rem' }}>
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                {submissions.map((sub) => (
                  <div
                    key={sub.id}
                    className="card"
                    onClick={() => onSelectWork(sub.id)}
                    style={{ cursor: 'pointer', transition: 'border-color 0.15s' }}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--color-luxor-gold)')}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--color-gray-200)')}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.375rem', flexWrap: 'wrap' }}>
                          <span className="badge badge-info" style={{ fontSize: '0.6875rem' }}>{sub.documentType}</span>
                          <StatusBadge status={sub.status} isEmbargoed={sub.isEmbargoed} />
                          <span style={{ fontSize: '0.6875rem', fontFamily: 'monospace', color: 'var(--color-gray-500)' }}>
                            {sub.stableIdentifier}
                          </span>
                        </div>

                        <h3 style={{ fontSize: '1.0625rem', fontWeight: 700, color: 'var(--color-shark)', marginBottom: '0.4rem', lineHeight: 1.35 }}>
                          {sub.title}
                        </h3>

                        <div style={{ fontSize: '0.8125rem', color: 'var(--color-gray-600)', display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '0.625rem' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <User size={13} color="var(--color-luxor-gold)" /> {sub.authorName}
                          </span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <BookOpen size={13} color="var(--color-gray-400)" /> {sub.departmentName}
                          </span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <Calendar size={13} color="var(--color-gray-400)" /> {sub.year}
                          </span>
                        </div>

                        <p style={{ fontSize: '0.875rem', color: 'var(--color-gray-700)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.55 }}>
                          {sub.abstract}
                        </p>
                      </div>

                      <button
                        className="btn btn-outline btn-sm"
                        style={{ whiteSpace: 'nowrap', flexShrink: 0 }}
                        onClick={(e) => { e.stopPropagation(); onSelectWork(sub.id); }}
                      >
                        View Details <ExternalLink size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', padding: '1rem 0', flexWrap: 'wrap' }}>
                  <button onClick={() => loadCatalog(page - 1)} disabled={page === 1} className="btn btn-secondary btn-sm">← Prev</button>
                  {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      onClick={() => loadCatalog(p)}
                      className={`btn btn-sm ${p === page ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ minWidth: '34px' }}
                    >
                      {p}
                    </button>
                  ))}
                  {totalPages > 7 && <span style={{ color: 'var(--color-gray-400)', fontSize: '0.875rem' }}>…{totalPages}</span>}
                  <button onClick={() => loadCatalog(page + 1)} disabled={page >= totalPages} className="btn btn-secondary btn-sm">Next →</button>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* Responsive: stack sidebar on mobile */}
      <style>{`
        @media (max-width: 768px) {
          .catalog-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
};
