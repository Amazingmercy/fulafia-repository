import React, { useState, useEffect } from 'react';
import { reviewApi } from '../services/api';
import { SubmissionDto, UserDto, UserRole, ReviewAction } from '@fulafia/shared';
import { StatusBadge } from '../components/StatusBadge';
import { OriginalityReportModal } from '../components/OriginalityReportModal';
import { CheckSquare, ShieldCheck, ThumbsUp, CheckCircle, AlertTriangle, XCircle, MessageSquare } from 'lucide-react';
import { useUI } from '../components/UIProvider';

interface ReviewQueueProps {
  currentUser: UserDto;
  onSelectWork: (id: string) => void;
}

export const ReviewQueue: React.FC<ReviewQueueProps> = ({ currentUser, onSelectWork }) => {
  const { toast } = useUI();
  const [queue, setQueue] = useState<SubmissionDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWork, setSelectedWork] = useState<SubmissionDto | null>(null);
  const [showPlagiarismModal, setShowPlagiarismModal] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);

  // Action form state
  const [actionType, setActionType] = useState<ReviewAction>(ReviewAction.APPROVED);
  const [comments, setComments] = useState('');
  const [processing, setProcessing] = useState(false);

  const loadQueue = async () => {
    setLoading(true);
    try {
      const items = await reviewApi.getQueue();
      setQueue(items);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQueue();
  }, []);

  const handleProcessAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWork || !comments.trim()) {
      toast('warning', 'Comments Required', 'Please enter review comments before submitting.');
      return;
    }

    setProcessing(true);
    try {
      await reviewApi.processAction(selectedWork.id, actionType, comments);
      toast('success', 'Review Submitted', `Action "${actionType}" recorded for "${selectedWork.title}".`);
      setShowActionModal(false);
      setSelectedWork(null);
      setComments('');
      loadQueue();
    } catch (err: any) {
      toast('error', 'Review Failed', err.response?.data?.message || 'Failed to process review action');
    } finally {
      setProcessing(false);
    }
  };

  const isSupervisor = currentUser.role === UserRole.SUPERVISOR;


  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-shark)' }}>
          Review & Approval Queue
        </h1>
        <p style={{ color: 'var(--color-gray-600)', fontSize: '0.9375rem' }}>
          {isSupervisor
            ? 'Supervisee submissions requiring your academic endorsement.'
            : 'Submissions awaiting librarian review, plagiarism verification, and publication approval.'}
        </p>
      </div>

      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center' }}>Loading review queue...</div>
      ) : queue.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <CheckCircle size={40} color="var(--color-status-success)" style={{ margin: '0 auto 1rem auto' }} />
          <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--color-shark)' }}>Queue is empty</h3>
          <p style={{ color: 'var(--color-gray-500)', fontSize: '0.875rem', marginTop: '0.5rem' }}>
            There are no pending submissions awaiting review at this time.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {queue.map((sub) => {
            const dual = sub.latestDualPlagiarism;
            const extScore = dual?.externalReport?.overallSimilarityPercentage;
            const intScore = dual?.internalReport?.overallSimilarityPercentage;

            return (
              <div key={sub.id} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                      <span className="badge badge-info">{sub.documentType}</span>
                      <StatusBadge status={sub.status} />
                      <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--color-gray-500)' }}>
                        {sub.stableIdentifier}
                      </span>
                    </div>

                    <h3
                      onClick={() => onSelectWork(sub.id)}
                      style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--color-shark)', cursor: 'pointer', marginBottom: '0.5rem' }}
                    >
                      {sub.title}
                    </h3>

                    <div style={{ fontSize: '0.8125rem', color: 'var(--color-gray-600)', display: 'flex', gap: '1.5rem', marginBottom: '0.75rem' }}>
                      <span>Author: <strong>{sub.authorName}</strong> ({sub.authorEmail})</span>
                      <span>Dept: <strong>{sub.departmentName}</strong></span>
                      {sub.supervisorName && <span>Supervisor: <strong>{sub.supervisorName}</strong></span>}
                    </div>
                  </div>

                  {/* Dual Originality Scores Pill */}
                  {dual && (
                    <div style={{ border: '1px solid var(--color-gray-200)', borderRadius: 'var(--border-radius-md)', padding: '0.5rem 0.875rem', backgroundColor: 'var(--color-gray-50)', textAlign: 'right' }}>
                      <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--color-gray-500)', textTransform: 'uppercase' }}>
                        Side-by-Side Originality
                      </div>
                      <div style={{ display: 'flex', gap: '0.875rem', marginTop: '0.25rem' }}>
                        <div>
                          <div style={{ fontSize: '0.6875rem', color: 'var(--color-gray-600)' }}>Turnitin (Ext)</div>
                          <div style={{ fontWeight: 700, color: extScore !== undefined && extScore > 20 ? 'var(--color-status-danger)' : 'var(--color-status-success)' }}>
                            {extScore !== undefined ? `${extScore}%` : 'Pending'}
                          </div>
                        </div>

                        <div style={{ borderLeft: '1px solid var(--color-gray-300)', paddingLeft: '0.875rem' }}>
                          <div style={{ fontSize: '0.6875rem', color: 'var(--color-gray-600)' }}>Internal (In-house)</div>
                          <div style={{ fontWeight: 700, color: intScore !== undefined && intScore > 15 ? 'var(--color-status-danger)' : 'var(--color-status-success)' }}>
                            {intScore !== undefined ? `${intScore}%` : 'Pending'}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setSelectedWork(sub);
                          setShowPlagiarismModal(true);
                        }}
                        className="btn btn-outline btn-sm"
                        style={{ marginTop: '0.5rem', width: '100%', fontSize: '0.75rem', padding: '0.2rem 0.4rem' }}
                      >
                        <ShieldCheck size={12} /> Inspect Reports
                      </button>
                    </div>
                  )}
                </div>

                {/* Review Action Controls */}
                <div style={{ borderTop: '1px solid var(--color-gray-200)', paddingTop: '0.875rem', marginTop: '0.875rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                  {isSupervisor && sub.status === 'SUBMITTED' ? (
                    <button
                      onClick={() => {
                        setSelectedWork(sub);
                        setActionType(ReviewAction.ENDORSED);
                        setShowActionModal(true);
                      }}
                      className="btn btn-primary"
                    >
                      <ThumbsUp size={16} /> Endorse Submisssion
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => {
                          setSelectedWork(sub);
                          setActionType(ReviewAction.REQUESTED_CHANGES);
                          setShowActionModal(true);
                        }}
                        className="btn btn-secondary btn-sm"
                      >
                        <AlertTriangle size={14} /> Request Changes
                      </button>

                      <button
                        onClick={() => {
                          setSelectedWork(sub);
                          setActionType(ReviewAction.REJECTED);
                          setShowActionModal(true);
                        }}
                        className="btn btn-danger btn-sm"
                      >
                        <XCircle size={14} /> Reject
                      </button>

                      <button
                        onClick={() => {
                          setSelectedWork(sub);
                          setActionType(ReviewAction.APPROVED);
                          setShowActionModal(true);
                        }}
                        className="btn btn-primary btn-sm"
                      >
                        <CheckCircle size={14} /> Approve & Publish
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Side-by-Side Dual Plagiarism Modal */}
      {showPlagiarismModal && selectedWork?.latestDualPlagiarism && (
        <OriginalityReportModal
          report={selectedWork.latestDualPlagiarism}
          onClose={() => {
            setShowPlagiarismModal(false);
            setSelectedWork(null);
          }}
        />
      )}

      {/* Review Action Form Modal */}
      {showActionModal && selectedWork && (
        <div className="modal-overlay" onClick={() => setShowActionModal(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '540px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-shark)', marginBottom: '0.5rem' }}>
              Confirm Review Action: {actionType}
            </h2>
            <p style={{ fontSize: '0.8125rem', color: 'var(--color-gray-600)', marginBottom: '1.25rem' }}>
              Submitting review for: <strong>{selectedWork.title}</strong>
            </p>

            <form onSubmit={handleProcessAction}>
              <div className="form-group">
                <label className="form-label">Review Comments / Justification *</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Enter detailed academic review notes or change requests..."
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  className="form-textarea"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="button" onClick={() => setShowActionModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={processing} className="btn btn-primary">
                  {processing ? 'Processing...' : `Submit Action (${actionType})`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
