import React from 'react';
import { DualPlagiarismSummaryDto, PlagiarismReportStatus } from '@fulafia/shared';
import { ShieldCheck, AlertTriangle, Globe, Database, FileText, CheckCircle2, X } from 'lucide-react';

interface OriginalityReportModalProps {
  report: DualPlagiarismSummaryDto;
  onClose: () => void;
}

export const OriginalityReportModal: React.FC<OriginalityReportModalProps> = ({ report, onClose }) => {
  const ext = report.externalReport;
  const int = report.internalReport;

  const getScoreColor = (score?: number) => {
    if (score === undefined || score === null) return 'var(--color-gray-500)';
    if (score <= 15) return 'var(--color-status-success)';
    if (score <= 25) return 'var(--color-status-warning)';
    return 'var(--color-status-danger)';
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '850px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-gray-200)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-shark)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldCheck color="var(--color-luxor-gold)" size={22} />
              Dual-Layer Originality & Plagiarism Verification
            </h2>
            <p style={{ fontSize: '0.8125rem', color: 'var(--color-gray-600)' }}>
              Independent side-by-side verification: Turnitin External Corpus vs FULafia Self-Hosted Repository
            </p>
          </div>
          <button onClick={onClose} className="btn btn-secondary btn-sm" style={{ padding: '0.25rem 0.5rem' }}>
            <X size={18} />
          </button>
        </div>

        {/* Manual Review Alert Banner if threshold exceeded */}
        {report.requiresManualReview && (
          <div style={{ backgroundColor: 'var(--color-status-warning-bg)', border: '1px solid var(--color-status-warning-border)', borderRadius: 'var(--border-radius-md)', padding: '0.875rem 1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <AlertTriangle color="var(--color-status-warning)" size={24} />
            <div>
              <div style={{ fontWeight: 700, color: 'var(--color-status-warning)', fontSize: '0.875rem' }}>
                Flagged for Librarian Manual Review
              </div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--color-gray-700)' }}>
                One or both similarity scores exceeded standard institutional tolerance limits (Turnitin &gt; 20% or Internal &gt; 15%).
              </div>
            </div>
          </div>
        )}

        {/* Side-by-Side Dual Layer Comparison */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          {/* LAYER 1: TURNITIN EXTERNAL */}
          <div className="card" style={{ borderTop: `4px solid ${getScoreColor(ext?.overallSimilarityPercentage)}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div>
                <span className="badge badge-info" style={{ marginBottom: '0.25rem' }}>Layer 1 — External</span>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-shark)' }}>Turnitin Similarity API</h3>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '1.75rem', fontWeight: 800, color: getScoreColor(ext?.overallSimilarityPercentage) }}>
                  {ext?.overallSimilarityPercentage !== undefined ? `${ext.overallSimilarityPercentage}%` : 'N/A'}
                </span>
                <div style={{ fontSize: '0.6875rem', color: 'var(--color-gray-500)' }}>Overall Similarity</div>
              </div>
            </div>

            {/* Scope Toggles Info */}
            <div style={{ backgroundColor: 'var(--color-gray-50)', padding: '0.75rem', borderRadius: 'var(--border-radius-sm)', fontSize: '0.75rem', marginBottom: '1rem' }}>
              <div style={{ fontWeight: '600', color: 'var(--color-gray-800)', marginBottom: '0.35rem' }}>Configured Scopes:</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.25rem' }}>
                <span>Student Papers: <strong>{ext?.compareStudentPapers ? 'Yes' : 'No'}</strong></span>
                <span>Institutional: <strong>{ext?.compareInstitutional ? 'Yes' : 'No'}</strong></span>
                <span>Internet Corpus: <strong>{ext?.compareInternet ? 'Yes' : 'No'}</strong></span>
                <span>Contribute to Repo: <strong>{ext?.submitToRepo ? 'Yes' : 'No'}</strong></span>
              </div>
            </div>

            {/* Matched External Sources */}
            <div style={{ fontSize: '0.8125rem' }}>
              <div style={{ fontWeight: 600, color: 'var(--color-shark)', marginBottom: '0.5rem' }}>Top Matched Sources:</div>
              {ext?.matchedSources && ext.matchedSources.length > 0 ? (
                ext.matchedSources.map((src, idx) => (
                  <div key={idx} style={{ borderBottom: '1px solid var(--color-gray-200)', padding: '0.5rem 0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
                      <span style={{ color: 'var(--color-shark)' }}>{src.title}</span>
                      <span style={{ color: getScoreColor(src.similarityPercentage) }}>{src.similarityPercentage}%</span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-gray-600)' }}>{src.publicationOrInstitution}</div>
                    {src.matchedTextSnippet && (
                      <div style={{ fontSize: '0.75rem', fontStyle: 'italic', color: 'var(--color-gray-500)', marginTop: '0.25rem' }}>
                        "{src.matchedTextSnippet}"
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div style={{ fontStyle: 'italic', color: 'var(--color-gray-500)' }}>No external matched sources detected.</div>
              )}
            </div>
          </div>

          {/* LAYER 2: INTERNAL FULAFIA SIMILARITY */}
          <div className="card" style={{ borderTop: `4px solid ${getScoreColor(int?.overallSimilarityPercentage)}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div>
                <span className="badge badge-info" style={{ marginBottom: '0.25rem', backgroundColor: '#F0FDF4', color: '#166534', borderColor: '#BBF7D0' }}>
                  Layer 2 — Self-Hosted
                </span>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-shark)' }}>FULafia Internal Repository</h3>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '1.75rem', fontWeight: 800, color: getScoreColor(int?.overallSimilarityPercentage) }}>
                  {int?.overallSimilarityPercentage !== undefined ? `${int.overallSimilarityPercentage}%` : 'N/A'}
                </span>
                <div style={{ fontSize: '0.6875rem', color: 'var(--color-gray-500)' }}>Internal Similarity</div>
              </div>
            </div>

            <div style={{ backgroundColor: 'var(--color-gray-50)', padding: '0.75rem', borderRadius: 'var(--border-radius-sm)', fontSize: '0.75rem', marginBottom: '1rem' }}>
              <div style={{ fontWeight: '600', color: 'var(--color-gray-800)' }}>Engine Details:</div>
              <div>Independent n-gram MinHash shingling computed across all past FULafia institutional submissions.</div>
            </div>

            {/* Matched Internal Submissions */}
            <div style={{ fontSize: '0.8125rem' }}>
              <div style={{ fontWeight: 600, color: 'var(--color-shark)', marginBottom: '0.5rem' }}>Top Internal Matches:</div>
              {int?.topMatches && int.topMatches.length > 0 ? (
                int.topMatches.map((item, idx) => (
                  <div key={idx} style={{ borderBottom: '1px solid var(--color-gray-200)', padding: '0.5rem 0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
                      <span style={{ color: 'var(--color-shark)' }}>{item.matchedSubmissionTitle}</span>
                      <span style={{ color: getScoreColor(item.similarityScore) }}>{item.similarityScore}%</span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-gray-600)' }}>
                      Author: {item.matchedAuthorName} ({item.matchedDepartment})
                    </div>
                    {item.matchedSnippets && item.matchedSnippets.length > 0 && (
                      <div style={{ fontSize: '0.75rem', fontStyle: 'italic', color: 'var(--color-gray-500)', marginTop: '0.25rem' }}>
                        Overlapping: {item.matchedSnippets.slice(0, 2).join(' ')}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div style={{ fontStyle: 'italic', color: 'var(--color-gray-500)', padding: '1rem 0' }}>
                  No internal FULafia repository matches detected (Original work).
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={onClose} className="btn btn-secondary">
            Close Report View
          </button>
        </div>
      </div>
    </div>
  );
};
