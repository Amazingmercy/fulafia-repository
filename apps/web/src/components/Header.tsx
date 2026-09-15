import React from 'react';
import { UserDto, UserRole } from '@fulafia/shared';
import { Search, Upload, CheckSquare, Shield, LogOut, Home, FileText, Menu, X } from 'lucide-react';

interface HeaderProps {
  currentUser: UserDto | null;
  onNavigate: (page: string) => void;
  currentPage: string;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({ currentUser, onNavigate, currentPage, onLogout }) => {
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const navLink = (page: string, label: string, icon: React.ReactNode) => (
    <button
      onClick={() => { onNavigate(page); setMobileOpen(false); }}
      style={{
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '0.4rem',
        padding: '0.4rem 0.75rem',
        borderRadius: 'var(--border-radius-md)',
        fontSize: '0.875rem',
        fontWeight: currentPage === page ? 700 : 500,
        color: currentPage === page ? 'var(--color-luxor-gold)' : 'var(--color-shark)',
        borderBottom: currentPage === page ? '2px solid var(--color-luxor-gold)' : '2px solid transparent',
        transition: 'color 0.15s, border-color 0.15s',
      }}
    >
      {icon} {label}
    </button>
  );

  return (
    <header style={{ borderBottom: '1px solid var(--color-gray-200)', backgroundColor: 'var(--color-white)', position: 'sticky', top: 0, zIndex: 100 }}>
      {/* Top Brand Bar */}
      <div style={{ backgroundColor: 'var(--color-shark)', color: 'var(--color-white)', padding: '0.3rem 1.5rem', fontSize: '0.6875rem', fontWeight: 500, letterSpacing: '0.03em' }}>
        <div style={{ maxWidth: 'var(--max-width-container)', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>FEDERAL UNIVERSITY OF LAFIA — INSTITUTIONAL SCHOLARLY REPOSITORY</span>
          <a
            href="https://www.fulafia.edu.ng"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'var(--color-luxor-gold)', textDecoration: 'none', fontWeight: 600 }}
          >
            www.fulafia.edu.ng ↗
          </a>
        </div>
      </div>

      {/* Main Nav Row */}
      <div style={{ maxWidth: 'var(--max-width-container)', margin: '0 auto', padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
        {/* Logo + Brand */}
        <div
          onClick={() => onNavigate('home')}
          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}
        >
          <img src="/logo.png" alt="FULafia Logo" style={{ width: '44px', height: '44px', objectFit: 'contain' }} />
          <div>
            <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--color-shark)', lineHeight: 1.15 }}>
              FULafia IR
            </div>
            <div style={{ fontSize: '0.6875rem', color: 'var(--color-gray-500)', fontWeight: 400 }}>
              Institutional Repository
            </div>
          </div>
        </div>

        {/* Desktop Nav */}
        <nav className="desktop-nav" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', flex: 1, justifyContent: 'center' }}>
          {navLink('home', 'Home', <Home size={15} />)}
          {currentUser && navLink('catalog', 'Browse', <Search size={15} />)}
          {currentUser && navLink('my-submissions', 'My Submissions', <FileText size={15} />)}
          {currentUser && navLink('submit', 'Submit Work', <Upload size={15} />)}
          {currentUser && (currentUser.role === UserRole.SUPERVISOR || currentUser.role === UserRole.REVIEWER || currentUser.role === UserRole.ADMIN) &&
            navLink('review', 'Review Queue', <CheckSquare size={15} />)}
          {currentUser && currentUser.role === UserRole.ADMIN &&
            navLink('admin', 'Admin', <Shield size={15} />)}
        </nav>

        {/* Auth Controls */}
        <div className="desktop-auth" style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flexShrink: 0 }}>
          {currentUser ? (
            <>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-shark)' }}>
                  {currentUser.firstName} {currentUser.lastName}
                </div>
                <span style={{ fontSize: '0.625rem', backgroundColor: 'var(--color-status-info-bg)', color: 'var(--color-status-info)', border: '1px solid var(--color-status-info-border)', borderRadius: '999px', padding: '0.1rem 0.4rem', fontWeight: 700, textTransform: 'uppercase' }}>
                  {currentUser.role}
                </span>
              </div>
              <button onClick={onLogout} className="btn btn-secondary btn-sm" title="Log out">
                <LogOut size={14} /> Log out
              </button>
            </>
          ) : (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button onClick={() => onNavigate('login')} className="btn btn-outline btn-sm">Log in</button>
              <button onClick={() => onNavigate('register')} className="btn btn-primary btn-sm">Register</button>
            </div>
          )}
        </div>

        {/* Hamburger button — hidden on desktop, shown on mobile via CSS */}
        <button
          className="mobile-menu-btn"
          onClick={() => setMobileOpen(!mobileOpen)}
          style={{ display: 'none', background: 'none', border: '1px solid var(--color-gray-300)', borderRadius: 'var(--border-radius-md)', padding: '0.375rem 0.5rem', cursor: 'pointer', color: 'var(--color-shark)', alignItems: 'center', marginLeft: 'auto' }}
          aria-label="Toggle navigation menu"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile nav dropdown */}
      {mobileOpen && (
        <>
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 98 }} onClick={() => setMobileOpen(false)} />
          <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, backgroundColor: 'var(--color-white)', borderBottom: '2px solid var(--color-luxor-gold)', zIndex: 99, padding: '1rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
            {navLink('home', 'Home', <Home size={15} />)}
            {currentUser && navLink('catalog', 'Browse', <Search size={15} />)}
            {currentUser && navLink('my-submissions', 'My Submissions', <FileText size={15} />)}
            {currentUser && navLink('submit', 'Submit Work', <Upload size={15} />)}
            {currentUser && (currentUser.role === UserRole.SUPERVISOR || currentUser.role === UserRole.REVIEWER || currentUser.role === UserRole.ADMIN) &&
              navLink('review', 'Review Queue', <CheckSquare size={15} />)}
            {currentUser && currentUser.role === UserRole.ADMIN &&
              navLink('admin', 'Admin', <Shield size={15} />)}
            <div style={{ borderTop: '1px solid var(--color-gray-200)', marginTop: '0.5rem', paddingTop: '0.75rem' }}>
              {currentUser ? (
                <button onClick={() => { onLogout(); setMobileOpen(false); }} className="btn btn-secondary" style={{ width: '100%' }}>
                  <LogOut size={14} /> Log out ({currentUser.firstName})
                </button>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <button onClick={() => { onNavigate('login'); setMobileOpen(false); }} className="btn btn-outline" style={{ width: '100%' }}>Log in</button>
                  <button onClick={() => { onNavigate('register'); setMobileOpen(false); }} className="btn btn-primary" style={{ width: '100%' }}>Register</button>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </header>
  );
};
