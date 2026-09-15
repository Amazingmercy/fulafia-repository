import React, { useState, useEffect } from 'react';
import { authApi, departmentsApi } from '../services/api';
import { DepartmentDto, UserDto, UserRole } from '@fulafia/shared';
import { UserPlus } from 'lucide-react';

interface RegisterProps {
  onRegisterSuccess: (user: UserDto, accessToken: string, refreshToken: string) => void;
  onNavigateLogin: () => void;
}

export const Register: React.FC<RegisterProps> = ({ onRegisterSuccess, onNavigateLogin }) => {
  const [departments, setDepartments] = useState<DepartmentDto[]>([]);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.STUDENT);
  const [departmentId, setDepartmentId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    departmentsApi.getAll().then((depts) => {
      setDepartments(depts);
      if (depts.length > 0) setDepartmentId(depts[0].id);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!departmentId) {
      setError('Please select a department before registering.');
      return;
    }

    setError(null);
    setLoading(true);
    try {
      const data = await authApi.register({
        email,
        password,
        firstName,
        lastName,
        role,
        departmentId,
      });
      onRegisterSuccess(data.user, data.tokens.accessToken, data.tokens.refreshToken);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '520px', margin: '2rem auto' }}>
      <div className="card">
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-shark)' }}>
            Register Repository Account
          </h2>
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-gray-600)' }}>
            Create an institutional account to submit theses, dissertations, and research papers.
          </p>
        </div>

        {error && (
          <div style={{ backgroundColor: 'var(--color-status-danger-bg)', border: '1px solid var(--color-status-danger-border)', color: 'var(--color-status-danger)', padding: '0.75rem', borderRadius: 'var(--border-radius-md)', fontSize: '0.8125rem', marginBottom: '1.25rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">First Name *</label>
              <input
                type="text"
                required
                placeholder="Chidi"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Last Name *</label>
              <input
                type="text"
                required
                placeholder="Okonkwo"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="form-input"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Institutional Email Address *</label>
            <input
              type="email"
              required
              placeholder="name@fulafia.edu.ng"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password *</label>
            <input
              type="password"
              required
              placeholder="At least 8 characters..."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-input"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Department *</label>
              <select
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                className="form-select"
              >
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Initial Account Role *</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
                className="form-select"
              >
                <option value="STUDENT">Student / Author</option>
                <option value="SUPERVISOR">Supervisor</option>
                <option value="REVIEWER">Reviewer / Librarian</option>
              </select>
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn btn-primary btn-lg" style={{ width: '100%', marginTop: '1rem' }}>
            <UserPlus size={18} /> {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--color-gray-200)', textAlign: 'center', fontSize: '0.8125rem' }}>
          Already registered?{' '}
          <button onClick={onNavigateLogin} style={{ background: 'none', border: 'none', color: 'var(--color-luxor-gold)', fontWeight: 600, cursor: 'pointer' }}>
            Sign In here
          </button>
        </div>
      </div>
    </div>
  );
};
