import React from 'react';
import { SubmissionStatus } from '@fulafia/shared';

interface StatusBadgeProps {
  status: SubmissionStatus | string;
  isEmbargoed?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, isEmbargoed }) => {
  if (isEmbargoed) {
    return <span className="badge badge-embargo">EMBARGOED</span>;
  }

  switch (status) {
    case SubmissionStatus.PUBLISHED:
      return <span className="badge badge-published">PUBLISHED</span>;
    case SubmissionStatus.SUPERVISOR_APPROVED:
      return <span className="badge badge-published" style={{ backgroundColor: '#F0FDF4', color: '#166534' }}>SUPERVISOR APPROVED</span>;
    case SubmissionStatus.UNDER_REVIEW:
    case SubmissionStatus.SUBMITTED:
      return <span className="badge badge-under-review">{status.replace('_', ' ')}</span>;
    case SubmissionStatus.CHANGES_REQUESTED:
      return <span className="badge badge-under-review" style={{ backgroundColor: '#FEF3C7', color: '#92400E' }}>CHANGES REQUESTED</span>;
    case SubmissionStatus.REJECTED:
      return <span className="badge badge-rejected">REJECTED</span>;
    default:
      return <span className="badge badge-draft">{status}</span>;
  }
};
