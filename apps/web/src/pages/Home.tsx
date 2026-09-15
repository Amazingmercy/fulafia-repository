import React from 'react';
import { Shield, Award, Globe, FileText, Users, BookOpen, ChevronDown } from 'lucide-react';

interface HomeProps {
  onNavigate: (page: string) => void;
  isLoggedIn: boolean;
}

export const Home: React.FC<HomeProps> = ({ onNavigate, isLoggedIn }) => {
  const scrollDown = () => {
    document.getElementById('features-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div style={{ width: '100%' }}>

      {/* ━━━ HERO — full viewport height ━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div style={{
        backgroundColor: 'var(--color-shark)',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '5rem 1.5rem 4rem',
        position: 'relative',
        textAlign: 'center',
      }}>
        {/* Top accent */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', backgroundColor: 'var(--color-luxor-gold)' }} />

        <div style={{ maxWidth: '740px', width: '100%' }}>
          {/* University badge */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'rgba(157,122,38,0.15)', border: '1px solid rgba(157,122,38,0.4)', borderRadius: '999px', padding: '0.3rem 1rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-luxor-gold)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '1.5rem' }}>
            Federal University of Lafia · Est. 2011
          </div>

          <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.25rem)', fontWeight: 900, lineHeight: 1.1, color: 'var(--color-white)', marginBottom: '1.25rem', letterSpacing: '-0.025em' }}>
            FULafia Institutional<br />
            <span style={{ color: 'var(--color-luxor-gold)' }}>Scholarly Repository</span>
          </h1>

          <p style={{ fontSize: 'clamp(0.9375rem, 2vw, 1.0625rem)', color: 'rgba(255,255,255,0.72)', lineHeight: 1.75, maxWidth: '580px', margin: '0 auto 2.75rem' }}>
            The official digital home for academic theses, dissertations, journal articles, and research output from FULafia's academic community — with dual-layer originality verification and persistent identifiers.
          </p>

          {/* CTA buttons */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.875rem', flexWrap: 'wrap' }}>
            {isLoggedIn ? (
              <>
                <button onClick={() => onNavigate('catalog')} className="btn btn-primary" style={{ padding: '0.875rem 2rem', fontSize: '1rem' }}>
                  <BookOpen size={17} /> Browse Repository
                </button>
                <button onClick={() => onNavigate('submit')} style={{ backgroundColor: 'transparent', color: 'var(--color-white)', border: '2px solid rgba(255,255,255,0.4)', cursor: 'pointer', padding: '0.875rem 2rem', borderRadius: 'var(--border-radius-md)', fontWeight: 600, fontSize: '1rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FileText size={17} /> Submit Your Work
                </button>
              </>
            ) : (
              <>
                <button onClick={() => onNavigate('register')} className="btn btn-primary" style={{ padding: '0.875rem 2rem', fontSize: '1rem' }}>
                  <Users size={17} /> Create Account
                </button>
                <button onClick={() => onNavigate('login')} style={{ backgroundColor: 'transparent', color: 'var(--color-white)', border: '2px solid rgba(255,255,255,0.4)', cursor: 'pointer', padding: '0.875rem 2rem', borderRadius: 'var(--border-radius-md)', fontWeight: 600, fontSize: '1rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                  Log in
                </button>
              </>
            )}
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '2.5rem', flexWrap: 'wrap', marginTop: '4.5rem', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '2.5rem', width: '100%', maxWidth: '640px' }}>
          {[
            { value: '80+', label: 'Departments', icon: <Award size={20} /> },
            { value: '8', label: 'Faculties', icon: <Shield size={20} /> },
            { value: 'Open', label: 'Access', icon: <Globe size={20} /> },
            { value: 'Dual', label: 'Plagiarism Layers', icon: <Shield size={20} /> },
          ].map(({ value, label, icon }) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <div style={{ color: 'var(--color-luxor-gold)', display: 'flex', justifyContent: 'center', marginBottom: '0.25rem' }}>{icon}</div>
              <div style={{ fontSize: '1.625rem', fontWeight: 900, color: 'var(--color-white)', lineHeight: 1 }}>{value}</div>
              <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.55)', marginTop: '0.25rem' }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Scroll hint */}
        <button onClick={scrollDown} style={{ position: 'absolute', bottom: '1.5rem', left: '50%', transform: 'translateX(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem', fontSize: '0.625rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          Learn More <ChevronDown size={16} style={{ animation: 'heroChevron 2s ease-in-out infinite' }} />
        </button>
      </div>

      {/* ━━━ Features ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div id="features-section" style={{ backgroundColor: 'var(--color-gray-50)', borderTop: '1px solid var(--color-gray-200)', borderBottom: '1px solid var(--color-gray-200)' }}>
        <div style={{ maxWidth: 'var(--max-width-container)', margin: '0 auto', padding: '3.5rem 1.5rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <h2 style={{ fontSize: '1.625rem', fontWeight: 800, color: 'var(--color-shark)', marginBottom: '0.5rem' }}>
              World-class standards for Nigerian scholarship
            </h2>
            <p style={{ color: 'var(--color-gray-600)', fontSize: '0.9375rem', maxWidth: '520px', margin: '0 auto' }}>
              Built on the same principles as DSpace and Zenodo, purpose-built for FULafia.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '1.25rem' }}>
            {[
              { icon: <Shield size={24} color="var(--color-luxor-gold)" />, title: 'Dual-Layer Originality', desc: 'Turnitin + FULafia in-house MinHash run in parallel. Both scores shown side-by-side to reviewers.' },
              { icon: <FileText size={24} color="var(--color-luxor-gold)" />, title: 'Persistent Identifiers', desc: 'Every work gets a stable FULafia ID, optional DOI, and Handle. Citable even if URLs change.' },
              { icon: <Award size={24} color="var(--color-luxor-gold)" />, title: 'Rigorous Review Pipeline', desc: 'Supervisor endorsement → Librarian approval. Every step immutably audit-logged for compliance.' },
              { icon: <Globe size={24} color="var(--color-luxor-gold)" />, title: 'Open Access', desc: 'Published works are freely discoverable. Authors may set an embargo period before public release.' },
            ].map((f) => (
              <div key={f.title} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {f.icon}
                <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--color-shark)' }}>{f.title}</div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--color-gray-600)', lineHeight: 1.65 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ━━━ CTA Banner (non-logged-in only) ━━━━━━━━━━━━━━━━━━━━━ */}
      {!isLoggedIn && (
        <div style={{ backgroundColor: 'var(--color-luxor-gold)', padding: '3rem 1.5rem', textAlign: 'center' }}>
          <h2 style={{ fontSize: '1.375rem', fontWeight: 800, color: 'var(--color-white)', marginBottom: '0.625rem' }}>
            Ready to archive your research?
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.88)', marginBottom: '1.5rem', fontSize: '1rem' }}>
            Register your FULafia account and submit your work today.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button onClick={() => onNavigate('register')} style={{ backgroundColor: 'var(--color-white)', color: 'var(--color-luxor-gold)', border: 'none', cursor: 'pointer', padding: '0.75rem 1.75rem', borderRadius: 'var(--border-radius-md)', fontWeight: 700, fontSize: '0.9375rem' }}>
              Create Account
            </button>
            <button onClick={() => onNavigate('login')} style={{ backgroundColor: 'transparent', color: 'var(--color-white)', border: '2px solid rgba(255,255,255,0.6)', cursor: 'pointer', padding: '0.75rem 1.75rem', borderRadius: 'var(--border-radius-md)', fontWeight: 600, fontSize: '0.9375rem' }}>
              Log in
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes heroChevron {
          0%, 100% { transform: translateY(0); opacity: 0.3; }
          50% { transform: translateY(5px); opacity: 0.6; }
        }
      `}</style>
    </div>
  );
};
