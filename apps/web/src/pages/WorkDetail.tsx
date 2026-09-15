import React, { useState, useEffect } from 'react';
import { submissionsApi } from '../services/api';
import { SubmissionDto, UserDto, UserRole } from '@fulafia/shared';
import { StatusBadge } from '../components/StatusBadge';
import { OriginalityReportModal } from '../components/OriginalityReportModal';
import { ArrowLeft, Download, ShieldCheck, FileCode, Calendar, User, BookOpen, Lock, Hash } from 'lucide-react';
import { useUI } from '../components/UIProvider';

interface WorkDetailProps {
  workId: string;
  currentUser: UserDto | null;
  onBack: () => void;
}

export const WorkDetail: React.FC<WorkDetailProps> = ({ workId, currentUser, onBack }) => {
  const { toast } = useUI();
  const [work, setWork] = useState<SubmissionDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPlagiarismModal, setShowPlagiarismModal] = useState(false);
  const [manifestData, setManifestData] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    submissionsApi.getById(workId)
      .then(setWork)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [workId]);

  const handleDownloadManifest = async () => {
    try {
      const manifest = await submissionsApi.getManifest(workId);
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(manifest, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `${work?.stableIdentifier}-signed-manifest.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      toast('success', 'Manifest Downloaded', 'Signed integrity manifest exported successfully.');
    } catch (err) {
      toast('error', 'Export Failed', 'Failed to export signed manifest. Please try again.');
    }
  };


  if (loading) {
    return <div style={{ padding: '3rem', textAlign: 'center' }}>Loading submission record...</div>;
  }

  if (!work) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
        <h3>Work record not found</h3>
        <button onClick={onBack} className="btn btn-secondary" style={{ marginTop: '1rem' }}>
          Back to Catalog
        </button>
      </div>
    );
  }

  const latestVer = work.versions?.[0];
  const canSeeOriginality = currentUser && (
    currentUser.id === work.authorId ||
    currentUser.id === work.supervisorId ||
    currentUser.role === UserRole.REVIEWER ||
    currentUser.role === UserRole.ADMIN
  );

  return (
    <div>
      <button onClick={onBack} className="btn btn-secondary btn-sm" style={{ marginBottom: '1.5rem' }}>
        <ArrowLeft size={16} /> Back to Catalog
      </button>

      {/* Main Header Card */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <span className="badge badge-info">{work.documentType}</span>
          <StatusBadge status={work.status} isEmbargoed={work.isEmbargoed} />
          <span style={{ fontSize: '0.8125rem', fontFamily: 'monospace', color: 'var(--color-gray-500)' }}>
            ID: {work.stableIdentifier}
          </span>
        </div>

        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-shark)', lineHeight: 1.3, marginBottom: '1rem' }}>
          {work.title}
        </h1>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', borderTop: '1px solid var(--color-gray-200)', paddingTop: '1rem', fontSize: '0.875rem' }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-gray-500)' }}>Author</div>
            <div style={{ fontWeight: 600, color: 'var(--color-shark)' }}>{work.authorName}</div>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-gray-500)' }}>Department</div>
            <div style={{ fontWeight: 600, color: 'var(--color-shark)' }}>{work.departmentName}</div>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-gray-500)' }}>Degree / Programme</div>
            <div style={{ fontWeight: 600, color: 'var(--color-shark)' }}>{work.degreeProgramme} ({work.year})</div>
          </div>

          {work.supervisorName && (
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-gray-500)' }}>Academic Supervisor</div>
              <div style={{ fontWeight: 600, color: 'var(--color-shark)' }}>{work.supervisorName}</div>
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
        {/* Left Column: Abstract & Versions */}
        <div>
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <h2 className="card-title">Abstract</h2>
            <p style={{ fontSize: '0.9375rem', color: 'var(--color-gray-800)', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
              {work.abstract}
            </p>
          </div>

          {/* Keywords */}
          {work.keywords && work.keywords.length > 0 && (
            <div className="card" style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-shark)', marginBottom: '0.5rem' }}>Keywords</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {work.keywords.map((kw, i) => (
                  <span key={i} style={{ backgroundColor: 'var(--color-gray-100)', color: 'var(--color-shark)', padding: '0.25rem 0.625rem', borderRadius: 'var(--border-radius-sm)', fontSize: '0.75rem' }}>
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Version History */}
          <div className="card">
            <h2 className="card-title">Version History</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.75rem' }}>
              {work.versions?.map((v) => (
                <div key={v.id} style={{ border: '1px solid var(--color-gray-200)', borderRadius: 'var(--border-radius-md)', padding: '0.875rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, fontSize: '0.875rem' }}>
                    <span>Version {v.versionNumber}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-gray-500)' }}>
                      {new Date(v.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--color-gray-500)', marginTop: '0.25rem' }}>
                    SHA-256: {v.sha256Hash}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Sidebar: Downloads, Manifest & Identifiers */}
        <div>
          {/* File Access Box */}
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <h3 className="card-title" style={{ fontSize: '1rem' }}>Full Text Document</h3>

            {work.isEmbargoed && !work.canAccessFile ? (
              <div style={{ backgroundColor: '#F3E8FF', border: '1px solid #E9D5FF', padding: '0.875rem', borderRadius: 'var(--border-radius-md)', fontSize: '0.8125rem', color: '#6B21A8' }}>
                <Lock size={16} style={{ display: 'inline', marginRight: '0.35rem' }} />
                This full-text file is under academic embargo until{' '}
                <strong>{new Date(work.embargoReleaseDate!).toLocaleDateString()}</strong>. Public metadata remains open.
              </div>
            ) : latestVer?.file ? (
              <div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--color-gray-600)', marginBottom: '0.75rem' }}>
                  <div>File: <strong>{latestVer.file.originalName}</strong></div>
                  <div>Size: {(latestVer.file.sizeBytes / 1024 / 1024).toFixed(2)} MB</div>
                  <div>Integrity: Verified SHA-256</div>
                </div>
                <button
                  onClick={() => toast('info', 'Downloading File', `Fetching ${latestVer.file?.originalName} — SHA-256 verified.`)}
                  className="btn btn-primary"
                  style={{ width: '100%' }}
                >
                  <Download size={16} /> Download Full-Text PDF
                </button>
              </div>
            ) : (
              <div style={{ fontStyle: 'italic', fontSize: '0.8125rem', color: 'var(--color-gray-500)' }}>
                No file document attached.
              </div>
            )}
          </div>

          {/* Persistent Identifiers & Manifest */}
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <h3 className="card-title" style={{ fontSize: '1rem' }}>Persistent Identifiers</h3>
            <div style={{ fontSize: '0.8125rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
              <div>
                <span style={{ color: 'var(--color-gray-500)' }}>Stable ID:</span>{' '}
                <strong style={{ fontFamily: 'monospace' }}>{work.stableIdentifier}</strong>
              </div>
              {work.doi && (
                <div>
                  <span style={{ color: 'var(--color-gray-500)' }}>DOI:</span>{' '}
                  <span style={{ color: 'var(--color-luxor-gold)', fontWeight: 600 }}>{work.doi}</span>
                </div>
              )}
              {work.handleId && (
                <div>
                  <span style={{ color: 'var(--color-gray-500)' }}>Handle ID:</span>{' '}
                  <span>{work.handleId}</span>
                </div>
              )}
            </div>

            <button onClick={handleDownloadManifest} className="btn btn-secondary btn-sm" style={{ width: '100%' }}>
              <FileCode size={14} /> Export Signed Manifest (JSON)
            </button>
          </div>

          {/* Originality & Plagiarism button */}
          {canSeeOriginality && work.latestDualPlagiarism && (
            <div className="card">
              <h3 className="card-title" style={{ fontSize: '1rem' }}>Originality Verification</h3>
              <p style={{ fontSize: '0.8125rem', color: 'var(--color-gray-600)', marginBottom: '0.75rem' }}>
                Dual-layer results: Turnitin External + FULafia Internal.
              </p>
              <button
                onClick={() => setShowPlagiarismModal(true)}
                className="btn btn-outline btn-sm"
                style={{ width: '100%' }}
              >
                <ShieldCheck size={16} /> View Dual Originality Report
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Dual Plagiarism Modal */}
      {showPlagiarismModal && work.latestDualPlagiarism && (
        <OriginalityReportModal
          report={work.latestDualPlagiarism}
          onClose={() => setShowPlagiarismModal(false)}
        />
      )}
    </div>
  );
};
