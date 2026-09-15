import React, { useState } from 'react';
import { authApi } from '../services/api';
import { UserDto } from '@fulafia/shared';
import { LogIn, Key, Mail } from 'lucide-react';

interface LoginProps {
  onLoginSuccess: (user: UserDto, accessToken: string, refreshToken: string) => void;
  onNavigateRegister: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess, onNavigateRegister }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const data = await authApi.login(email, password);
      onLoginSuccess(data.user, data.tokens.accessToken, data.tokens.refreshToken);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '440px', margin: '3rem auto' }}>
      <div className="card">
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{ width: '48px', height: '48px', backgroundColor: 'var(--color-luxor-gold)', color: 'var(--color-white)', borderRadius: 'var(--border-radius-md)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1.5rem', marginBottom: '0.75rem' }}>
            FU
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-shark)' }}>
            Sign In to Repository
          </h2>
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-gray-600)' }}>
            FULafia Institutional Single Sign-On & Authentication
          </p>
        </div>

        {error && (
          <div style={{ backgroundColor: 'var(--color-status-danger-bg)', border: '1px solid var(--color-status-danger-border)', color: 'var(--color-status-danger)', padding: '0.75rem', borderRadius: 'var(--border-radius-md)', fontSize: '0.8125rem', marginBottom: '1.25rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Institutional Email</label>
            <input
              type="email"
              required
              placeholder="e.g. student.chidi@fulafia.edu.ng"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              required
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-input"
            />
          </div>

          <button type="submit" disabled={loading} className="btn btn-primary btn-lg" style={{ width: '100%', marginTop: '0.5rem' }}>
            <LogIn size={18} /> {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--color-gray-200)', textAlign: 'center', fontSize: '0.8125rem' }}>
          Don't have an account yet?{' '}
          <button onClick={onNavigateRegister} style={{ background: 'none', border: 'none', color: 'var(--color-luxor-gold)', fontWeight: 600, cursor: 'pointer' }}>
            Register Account
          </button>
        </div>
      </div>
    </div>
  );
};
