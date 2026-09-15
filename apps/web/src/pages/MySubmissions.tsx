import React, { useState, useEffect } from 'react';
import { submissionsApi } from '../services/api';
import { UserDto, SubmissionStatus } from '@fulafia/shared';
import { StatusBadge } from '../components/StatusBadge';
import { useUI } from '../components/UIProvider';
import { FileText, Upload, AlertTriangle, Clock, CheckCircle, XCircle, ChevronRight, RefreshCw, Check } from 'lucide-react';

/* ── Workflow step definitions ─────────────────────────────────────────── */
const STEPS = [
  {
    label: 'Submitted',
    who: 'You',
    desc: 'You submitted the work for review.',
    statuses: [SubmissionStatus.SUBMITTED],
  },
  {
    label: 'Supervisor Review',
    who: 'Your Supervisor',
    desc: 'Your assigned supervisor endorses the work before it goes to the library.',
    statuses: [SubmissionStatus.SUPERVISOR_APPROVED],
  },
  {
    label: 'Library Review',
    who: 'Librarian / Reviewer',
    desc: 'A librarian checks originality scores and approves final publication.',
    statuses: [SubmissionStatus.UNDER_REVIEW],
  },
  {
    label: 'Published',
    who: 'FULafia Repository',
    desc: 'Your work is live in the open repository and citable.',
    statuses: [SubmissionStatus.PUBLISHED],
  },
];

const stepIndex = (status: string): number => {
  if (status === SubmissionStatus.DRAFT) return -1;
  if (status === SubmissionStatus.SUBMITTED) return 0;
  if (status === SubmissionStatus.SUPERVISOR_APPROVED) return 1;
  if (status === SubmissionStatus.UNDER_REVIEW) return 2;
  if (status === SubmissionStatus.PUBLISHED) return 3;
  return -1; // REJECTED / CHANGES_REQUESTED handled separately
};

const WorkflowTracker: React.FC<{ status: string }> = ({ status }) => {
  const isBlocked = status === SubmissionStatus.CHANGES_REQUESTED || status === SubmissionStatus.REJECTED;
  const current = stepIndex(status);

  return (
    <div style={{ marginTop: '0.875rem', padding: '0.875rem 1rem', backgroundColor: 'var(--color-gray-50)', borderRadius: 'var(--border-radius-md)', border: '1px solid var(--color-gray-200)' }}>
      <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--color-gray-500)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.75rem' }}>
        Approval Pipeline
      </div>

      {isBlocked && (
        <div style={{ fontSize: '0.8125rem', color: status === SubmissionStatus.REJECTED ? 'var(--color-status-danger)' : '#92400E', fontWeight: 600, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
          <AlertTriangle size={14} />
          {status === SubmissionStatus.REJECTED
            ? 'Submission rejected — see feedback above.'
            : 'Changes requested — revise and resubmit to continue.'}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 0, flexWrap: 'wrap' }}>
        {STEPS.map((step, i) => {
          const done = current > i;
          const active = current === i;
          return (
            <React.Fragment key={step.label}>
              {/* Step bubble */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem', minWidth: '72px' }}>
                <div style={{
                  width: '28px', height: '28px', borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  backgroundColor: done
                    ? 'var(--color-status-success)'
                    : active && !isBlocked
                      ? 'var(--color-luxor-gold)'
                      : 'var(--color-gray-200)',
                  color: (done || (active && !isBlocked)) ? 'var(--color-white)' : 'var(--color-gray-400)',
                  flexShrink: 0,
                }}>
                  {done ? <Check size={14} strokeWidth={3} /> : <span style={{ fontSize: '0.6875rem', fontWeight: 800 }}>{i + 1}</span>}
                </div>
                <div style={{ fontSize: '0.625rem', fontWeight: active ? 700 : 500, color: active && !isBlocked ? 'var(--color-shark)' : done ? 'var(--color-status-success)' : 'var(--color-gray-500)', textAlign: 'center', lineHeight: 1.2, maxWidth: '64px' }}>
                  {step.label}
                </div>
                <div style={{ fontSize: '0.5625rem', color: 'var(--color-gray-400)', textAlign: 'center', lineHeight: 1.2, maxWidth: '64px' }}>
                  {step.who}
                </div>
                {active && !isBlocked && (
                  <div style={{ fontSize: '0.5625rem', color: 'var(--color-luxor-gold)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    ← Now
                  </div>
                )}
              </div>
              {/* Connector line */}
              {i < STEPS.length - 1 && (
                <div style={{ flex: 1, minWidth: '16px', height: '2px', backgroundColor: done ? 'var(--color-status-success)' : 'var(--color-gray-200)', margin: '0 2px', marginBottom: '28px' }} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

interface MySubmissionsProps {
  currentUser: UserDto;
  onSelectWork: (id: string) => void;
  onNavigate: (page: string) => void;
}

export const MySubmissions: React.FC<MySubmissionsProps> = ({ currentUser, onSelectWork, onNavigate }) => {
  const { toast } = useUI();
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Revision modal state
  const [revising, setRevising] = useState<any | null>(null);
  const [revTitle, setRevTitle] = useState('');
  const [revAbstract, setRevAbstract] = useState('');
  const [revFile, setRevFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await submissionsApi.getMySubmissions();
      setSubmissions(data);
    } catch (err: any) {
      toast('error', 'Failed to Load', 'Could not load your submissions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openRevision = (sub: any) => {
    setRevising(sub);
    setRevTitle(sub.title);
    setRevAbstract(sub.abstract || '');
    setRevFile(null);
  };

  const handleRevisionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!revising || !revTitle || !revAbstract) {
      toast('warning', 'Required Fields', 'Title and abstract are required.');
      return;
    }
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('title', revTitle);
      formData.append('abstract', revAbstract);
      if (revFile) formData.append('file', revFile);
      await submissionsApi.createVersion(revising.id, formData);
      toast('success', 'Revision Submitted', 'Your updated version has been submitted for review.');
      setRevising(null);
      load();
    } catch (err: any) {
      toast('error', 'Submission Failed', err.response?.data?.message || 'An error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  const needsAction = (status: string) =>
    status === SubmissionStatus.CHANGES_REQUESTED || status === SubmissionStatus.REJECTED;

  const statusIcon = (status: string) => {
    switch (status) {
      case SubmissionStatus.PUBLISHED: return <CheckCircle size={16} color="var(--color-status-success)" />;
      case SubmissionStatus.REJECTED: return <XCircle size={16} color="var(--color-status-danger)" />;
      case SubmissionStatus.CHANGES_REQUESTED: return <AlertTriangle size={16} color="var(--color-status-warning)" />;
      default: return <Clock size={16} color="var(--color-status-info)" />;
    }
  };

  const pendingCount = submissions.filter((s) => needsAction(s.status)).length;

  return (
    <div style={{ maxWidth: '860px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-shark)' }}>My Submissions</h1>
          <p style={{ color: 'var(--color-gray-600)', fontSize: '0.9375rem', marginTop: '0.25rem' }}>
            Track the status of your work and respond to reviewer feedback.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.625rem' }}>
          <button onClick={load} className="btn btn-secondary btn-sm"><RefreshCw size={14} /> Refresh</button>
          <button onClick={() => onNavigate('submit')} className="btn btn-primary btn-sm"><Upload size={14} /> New Submission</button>
        </div>
      </div>

      {/* Action required banner */}
      {pendingCount > 0 && (
        <div style={{ backgroundColor: 'var(--color-status-warning-bg)', border: '1px solid var(--color-status-warning-border)', borderLeft: '4px solid var(--color-status-warning)', borderRadius: 'var(--border-radius-md)', padding: '0.875rem 1.125rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <AlertTriangle size={20} color="var(--color-status-warning)" />
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-shark)' }}>
              {pendingCount} submission{pendingCount > 1 ? 's' : ''} require{pendingCount === 1 ? 's' : ''} your attention
            </div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--color-gray-700)' }}>
              Review the feedback below and submit a revised version to continue the approval process.
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--color-gray-500)' }}>Loading your submissions…</div>
      ) : submissions.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '4rem' }}>
          <FileText size={40} color="var(--color-gray-300)" style={{ margin: '0 auto 1rem' }} />
          <h3 style={{ fontWeight: 700, color: 'var(--color-shark)', marginBottom: '0.5rem' }}>No submissions yet</h3>
          <p style={{ color: 'var(--color-gray-600)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
            Submit your thesis, dissertation, or research paper to get started.
          </p>
          <button onClick={() => onNavigate('submit')} className="btn btn-primary">
            <Upload size={16} /> Submit Your First Work
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {submissions.map((sub) => {
            const latestReview = sub.reviewLogs?.[0];
            const actionNeeded = needsAction(sub.status);

            return (
              <div
                key={sub.id}
                className="card"
                style={{
                  borderLeft: actionNeeded
                    ? `4px solid ${sub.status === SubmissionStatus.REJECTED ? 'var(--color-status-danger)' : 'var(--color-status-warning)'}`
                    : sub.status === SubmissionStatus.PUBLISHED
                      ? '4px solid var(--color-status-success)'
                      : '4px solid var(--color-gray-300)',
                }}
              >
                {/* Title row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.375rem' }}>
                      {statusIcon(sub.status)}
                      <StatusBadge status={sub.status} />
                      <span className="badge badge-info" style={{ fontSize: '0.6875rem' }}>{sub.documentType}</span>
                      <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--color-gray-400)' }}>{sub.stableIdentifier}</span>
                    </div>
                    <h3
                      style={{ fontSize: '1.0625rem', fontWeight: 700, color: 'var(--color-shark)', cursor: 'pointer' }}
                      onClick={() => onSelectWork(sub.id)}
                    >
                      {sub.title}
                    </h3>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--color-gray-600)', marginTop: '0.25rem' }}>
                      {sub.department?.name} · {sub.year}
                      {sub.supervisor && <span> · Supervised by <strong>{sub.supervisor.firstName} {sub.supervisor.lastName}</strong></span>}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                    <button onClick={() => onSelectWork(sub.id)} className="btn btn-secondary btn-sm">
                      View <ChevronRight size={13} />
                    </button>
                    {actionNeeded && (
                      <button onClick={() => openRevision(sub)} className="btn btn-primary btn-sm">
                        <Upload size={13} /> Revise & Resubmit
                      </button>
                    )}
                  </div>
                </div>

                {/* Reviewer feedback — only shown when action is needed */}
                {actionNeeded && latestReview && (
                  <div style={{
                    backgroundColor: sub.status === SubmissionStatus.REJECTED
                      ? 'var(--color-status-danger-bg)'
                      : 'var(--color-status-warning-bg)',
                    border: `1px solid ${sub.status === SubmissionStatus.REJECTED ? 'var(--color-status-danger-border)' : 'var(--color-status-warning-border)'}`,
                    borderRadius: 'var(--border-radius-md)',
                    padding: '0.875rem 1rem',
                    marginTop: '0.75rem',
                  }}>
                    <div style={{ fontWeight: 700, fontSize: '0.8125rem', color: 'var(--color-shark)', marginBottom: '0.375rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <AlertTriangle size={14} />
                      Reviewer Feedback
                      {latestReview.reviewer && (
                        <span style={{ fontWeight: 400, color: 'var(--color-gray-600)' }}>
                          — {latestReview.reviewer.firstName} {latestReview.reviewer.lastName} ({latestReview.reviewer.role})
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: '0.875rem', color: 'var(--color-shark)', lineHeight: 1.6, margin: 0 }}>
                      {latestReview.comments}
                    </p>
                    {sub.reviewLogs?.length > 1 && (
                      <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--color-gray-500)' }}>
                        +{sub.reviewLogs.length - 1} earlier review note{sub.reviewLogs.length > 2 ? 's' : ''}
                      </div>
                    )}
                  </div>
                )}

                {/* Version info */}
                {sub.versions?.[0] && (
                  <div style={{ marginTop: '0.625rem', fontSize: '0.75rem', color: 'var(--color-gray-500)' }}>
                    Version {sub.versions[0].versionNumber} · Last updated {new Date(sub.versions[0].createdAt).toLocaleDateString()}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Revision Modal ─────────────────────────────────────────── */}
      {revising && (
        <div className="modal-overlay" onClick={() => setRevising(null)} role="dialog" aria-modal="true" aria-labelledby="revision-modal-title">
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <h2 id="revision-modal-title" style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--color-shark)', marginBottom: '0.25rem' }}>
              Revise & Resubmit
            </h2>
            <p style={{ fontSize: '0.8125rem', color: 'var(--color-gray-600)', marginBottom: '1.5rem' }}>
              Submitting a revision for: <strong>{revising.title}</strong>
            </p>

            {/* Show latest feedback in modal too */}
            {revising.reviewLogs?.[0] && (
              <div style={{ backgroundColor: 'var(--color-status-warning-bg)', border: '1px solid var(--color-status-warning-border)', borderRadius: 'var(--border-radius-md)', padding: '0.875rem', marginBottom: '1.25rem', fontSize: '0.875rem' }}>
                <strong style={{ display: 'block', marginBottom: '0.375rem' }}>Reviewer comments to address:</strong>
                {revising.reviewLogs[0].comments}
              </div>
            )}

            <form onSubmit={handleRevisionSubmit}>
              <div className="form-group">
                <label className="form-label">Title *</label>
                <input
                  type="text"
                  required
                  value={revTitle}
                  onChange={(e) => setRevTitle(e.target.value)}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Abstract *</label>
                <textarea
                  required
                  rows={5}
                  value={revAbstract}
                  onChange={(e) => setRevAbstract(e.target.value)}
                  className="form-textarea"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Updated Document (PDF / DOCX — optional if content unchanged)</label>
                <input
                  type="file"
                  accept=".pdf,.docx"
                  onChange={(e) => setRevFile(e.target.files?.[0] || null)}
                  className="form-input"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="button" onClick={() => setRevising(null)} className="btn btn-secondary">Cancel</button>
                <button type="submit" disabled={submitting} className="btn btn-primary">
                  <Upload size={15} /> {submitting ? 'Submitting…' : 'Submit Revision'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
