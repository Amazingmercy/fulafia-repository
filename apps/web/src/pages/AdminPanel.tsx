import React, { useState, useEffect } from 'react';
import { auditApi, usersApi } from '../services/api';
import { AuditLogDto, UserDto, UserRole } from '@fulafia/shared';
import { Shield, List, Users as UsersIcon, RefreshCw } from 'lucide-react';
import { useUI } from '../components/UIProvider';

const PAGE_SIZE = 15;

export const AdminPanel: React.FC = () => {
  const { toast, confirm } = useUI();
  const [activeTab, setActiveTab] = useState<'audit' | 'users'>('audit');

  // Audit state
  const [auditLogs, setAuditLogs] = useState<AuditLogDto[]>([]);
  const [auditPage, setAuditPage] = useState(1);
  const [auditTotal, setAuditTotal] = useState(0);

  // Users state
  const [allUsers, setAllUsers] = useState<UserDto[]>([]);
  const [usersPage, setUsersPage] = useState(1);

  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'audit') {
        const res = await auditApi.getLogs(auditPage, PAGE_SIZE);
        setAuditLogs(res.data);
        setAuditTotal(res.total);
      } else {
        const uList = await usersApi.getAllUsers();
        setAllUsers(uList);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab, auditPage]);

  const handleRoleChange = (userId: string, currentRole: string, newRole: string) => {
    if (newRole === currentRole) return;
    confirm(
      'Change User Role',
      `Are you sure you want to change this user's role from ${currentRole} to ${newRole}?`,
      async () => {
        try {
          await usersApi.updateUserRole(userId, newRole);
          toast('success', 'Role Updated', `User role changed to ${newRole}`);
          loadData();
        } catch (err: any) {
          toast('error', 'Failed to Update Role', err.response?.data?.message || 'An error occurred');
        }
      },
    );
  };

  // Derived values
  const auditTotalPages = Math.ceil(auditTotal / PAGE_SIZE);
  const usersTotalPages = Math.ceil(allUsers.length / PAGE_SIZE);
  const visibleUsers = allUsers.slice((usersPage - 1) * PAGE_SIZE, usersPage * PAGE_SIZE);

  // Inline Pagination component
  const Pagination = ({ page, totalPages, total, pageSize, onPrev, onNext }: { page: number; totalPages: number; total: number; pageSize: number; onPrev: () => void; onNext: () => void }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.875rem 1rem', borderTop: '1px solid var(--color-gray-200)', fontSize: '0.8125rem', color: 'var(--color-gray-600)', flexWrap: 'wrap', gap: '0.5rem' }}>
      <span>Showing {total === 0 ? 0 : Math.min((page-1)*pageSize+1, total)}–{Math.min(page*pageSize, total)} of {total}</span>
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <button onClick={onPrev} disabled={page === 1} className="btn btn-secondary btn-sm">← Prev</button>
        <span style={{ fontWeight: 600, color: 'var(--color-shark)', padding: '0 0.5rem' }}>Page {page} of {Math.max(1, totalPages)}</span>
        <button onClick={onNext} disabled={page >= totalPages} className="btn btn-secondary btn-sm">Next →</button>
      </div>
    </div>
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-shark)' }}>
            System Administration &amp; Audit Controls
          </h1>
          <p style={{ color: 'var(--color-gray-600)', fontSize: '0.9375rem' }}>
            OWASP-compliant immutable audit logs and institutional RBAC user management.
          </p>
        </div>

        <button onClick={loadData} className="btn btn-secondary btn-sm">
          <RefreshCw size={14} /> Refresh Data
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--color-gray-200)', marginBottom: '1.5rem' }}>
        <button
          onClick={() => setActiveTab('audit')}
          className={`btn ${activeTab === 'audit' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ borderRadius: 'var(--border-radius-md) var(--border-radius-md) 0 0' }}
        >
          <List size={16} /> Immutable Audit Logs
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`btn ${activeTab === 'users' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ borderRadius: 'var(--border-radius-md) var(--border-radius-md) 0 0' }}
        >
          <UsersIcon size={16} /> User &amp; RBAC Management
        </button>
      </div>

      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center' }}>Loading administration records...</div>
      ) : activeTab === 'audit' ? (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '160px' }}>Timestamp</th>
                <th>Action</th>
                <th>Actor</th>
                <th>Target</th>
                <th style={{ width: '110px' }}>IP Address</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.map((log: any) => {
                // Actor: prefer joined name, fall back to email, then SYSTEM
                const actorName = log.actor
                  ? `${log.actor.firstName} ${log.actor.lastName}`.trim()
                  : (log.actorEmail || 'SYSTEM');
                const actorRole = log.actor?.role;

                // Target: just the entity type as a readable label
                const targetLabel = (log.targetEntity || 'Unknown')
                  .replace(/_/g, ' ')
                  .replace(/([A-Z])/g, ' $1')
                  .trim();

                // Metadata: render as readable key-value pairs, skip empty/null
                const meta = log.metadata && typeof log.metadata === 'object'
                  ? Object.entries(log.metadata).filter(([, v]) => v !== null && v !== undefined && v !== '')
                  : [];

                return (
                  <tr key={log.id}>
                    {/* Timestamp */}
                    <td style={{ fontSize: '0.75rem', whiteSpace: 'nowrap', color: 'var(--color-gray-700)' }}>
                      {new Date(log.createdAt).toLocaleString()}
                    </td>

                    {/* Action badge */}
                    <td>
                      <span className="badge badge-info" style={{ fontSize: '0.6875rem', letterSpacing: '0.02em' }}>
                        {log.action}
                      </span>
                    </td>

                    {/* Actor — full name + role chip */}
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.125rem' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.8125rem', color: 'var(--color-shark)' }}>
                          {actorName}
                        </span>
                        {actorRole && (
                          <span style={{ fontSize: '0.625rem', color: 'var(--color-gray-500)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                            {actorRole}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Target — entity type only, no raw ID */}
                    <td>
                      <span style={{
                        display: 'inline-block',
                        backgroundColor: 'var(--color-gray-100)',
                        border: '1px solid var(--color-gray-300)',
                        borderRadius: 'var(--border-radius-sm)',
                        padding: '0.125rem 0.5rem',
                        fontSize: '0.6875rem',
                        fontWeight: 600,
                        color: 'var(--color-gray-700)',
                        textTransform: 'capitalize',
                      }}>
                        {targetLabel}
                      </span>
                    </td>

                    {/* IP Address */}
                    <td style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--color-gray-600)' }}>
                      {log.ipAddress === '::1' ? 'localhost' : (log.ipAddress || '—')}
                    </td>

                    {/* Metadata — key:value pills, empty → dash */}
                    <td>
                      {meta.length === 0 ? (
                        <span style={{ color: 'var(--color-gray-400)', fontSize: '0.75rem' }}>—</span>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                          {meta.slice(0, 4).map(([key, value]) => (
                            <div key={key} style={{ display: 'flex', alignItems: 'baseline', gap: '0.375rem', fontSize: '0.75rem' }}>
                              <span style={{
                                fontWeight: 700,
                                color: 'var(--color-gray-500)',
                                textTransform: 'uppercase',
                                letterSpacing: '0.03em',
                                fontSize: '0.625rem',
                                flexShrink: 0,
                              }}>
                                {key.replace(/([A-Z])/g, ' $1').trim()}
                              </span>
                              <span style={{
                                color: 'var(--color-shark)',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                maxWidth: '200px',
                              }}>
                                {typeof value === 'boolean'
                                  ? (value ? '✓ Yes' : '✗ No')
                                  : String(value).length > 60
                                    ? String(value).slice(0, 60) + '…'
                                    : String(value)}
                              </span>
                            </div>
                          ))}
                          {meta.length > 4 && (
                            <span style={{ fontSize: '0.625rem', color: 'var(--color-gray-400)' }}>
                              +{meta.length - 4} more fields
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <Pagination
            page={auditPage}
            totalPages={auditTotalPages}
            total={auditTotal}
            pageSize={PAGE_SIZE}
            onPrev={() => setAuditPage((p) => Math.max(1, p - 1))}
            onNext={() => setAuditPage((p) => Math.min(auditTotalPages, p + 1))}
          />
        </div>

      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>User Name</th>
                <th>Email Address</th>
                <th>Department</th>
                <th>Current Role</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {visibleUsers.map((u) => (
                <tr key={u.id}>
                  <td style={{ fontWeight: 600 }}>{u.firstName} {u.lastName}</td>
                  <td>{u.email}</td>
                  <td>{u.departmentName || 'Computer Science'}</td>
                  <td>
                    <span className="badge badge-published" style={{ fontSize: '0.6875rem' }}>
                      {u.role}
                    </span>
                  </td>
                  <td>
                    <select
                      value={u.role}
                      onChange={(e) => handleRoleChange(u.id, u.role, e.target.value)}
                      className="form-select"
                      style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', width: 'auto' }}
                    >
                      <option value="STUDENT">STUDENT</option>
                      <option value="SUPERVISOR">SUPERVISOR</option>
                      <option value="REVIEWER">REVIEWER</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination
            page={usersPage}
            totalPages={usersTotalPages}
            total={allUsers.length}
            pageSize={PAGE_SIZE}
            onPrev={() => setUsersPage((p) => Math.max(1, p - 1))}
            onNext={() => setUsersPage((p) => Math.min(usersTotalPages, p + 1))}
          />
        </div>
      )}
    </div>
  );
};
