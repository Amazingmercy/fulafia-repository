import React from 'react';
import { Mail, Phone, MapPin, ExternalLink } from 'lucide-react';

interface FooterProps {
  onNavigate?: (page: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const nav = (page: string, label: string) => (
    <li>
      <button
        onClick={() => onNavigate?.(page)}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-gray-600)', fontSize: '0.8125rem', padding: 0, textAlign: 'left' }}
        onMouseOver={(e) => (e.currentTarget.style.color = 'var(--color-luxor-gold)')}
        onMouseOut={(e) => (e.currentTarget.style.color = 'var(--color-gray-600)')}
      >
        {label}
      </button>
    </li>
  );

  return (
    <footer style={{ borderTop: '3px solid var(--color-luxor-gold)', backgroundColor: 'var(--color-shark)', color: 'var(--color-white)', marginTop: '4rem' }}>
      {/* Main footer body */}
      <div style={{ maxWidth: 'var(--max-width-container)', margin: '0 auto', padding: '3rem 1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2.5rem' }}>

        {/* About */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '1rem' }}>
            <img src="/logo.png" alt="FULafia" style={{ width: '36px', height: '36px', objectFit: 'contain' }} />
            <div style={{ fontWeight: 800, fontSize: '1rem', lineHeight: 1.2 }}>
              FULafia<br />
              <span style={{ fontSize: '0.75rem', fontWeight: 400, color: 'var(--color-gray-400)' }}>Institutional Repository</span>
            </div>
          </div>
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-gray-400)', lineHeight: 1.65, marginBottom: '1rem' }}>
            Official digital repository for academic theses, dissertations, peer-reviewed journals, and research output from the Federal University of Lafia, Nasarawa State, Nigeria.
          </p>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.6875rem', backgroundColor: 'rgba(157,122,38,0.2)', color: 'var(--color-luxor-gold)', border: '1px solid rgba(157,122,38,0.4)', borderRadius: '999px', padding: '0.2rem 0.6rem', fontWeight: 700 }}>
              Open Access
            </span>
            <span style={{ fontSize: '0.6875rem', backgroundColor: 'rgba(255,255,255,0.08)', color: 'var(--color-gray-400)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '999px', padding: '0.2rem 0.6rem' }}>
              NDPR Compliant
            </span>
          </div>
        </div>

        {/* Repository Links */}
        <div>
          <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--color-white)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Repository
          </div>
          <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            {nav('catalog', 'Browse All Publications')}
            {nav('submit', 'Submit Your Work')}
            {nav('home', 'About This Repository')}
            {nav('home', 'Submission Guidelines')}
            {nav('home', 'Originality Policy')}
          </ul>
        </div>

        {/* Faculties */}
        <div>
          <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--color-white)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Faculties
          </div>
          <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.625rem', fontSize: '0.8125rem', color: 'var(--color-gray-400)' }}>
            <li>Faculty of Agriculture</li>
            <li>Faculty of Arts</li>
            <li>Faculty of Computing</li>
            <li>Faculty of Education</li>
            <li>Faculty of Science</li>
            <li>Faculty of Social Sciences</li>
            <li>College of Medicine</li>
          </ul>
        </div>

        {/* Contact */}
        <div>
          <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--color-white)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Contact & Support
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.8125rem', color: 'var(--color-gray-400)' }}>
            <a href="mailto:info@fulafia.edu.ng" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-gray-400)', textDecoration: 'none' }}>
              <Mail size={14} color="var(--color-luxor-gold)" />
              info@fulafia.edu.ng
            </a>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <MapPin size={14} color="var(--color-luxor-gold)" />
              Lafia, Nasarawa State, Nigeria
            </div>
            <a
              href="https://www.fulafia.edu.ng"
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-luxor-gold)', textDecoration: 'none', fontWeight: 600 }}
            >
              <ExternalLink size={14} />
              University Website
            </a>
          </div>

          <div style={{ marginTop: '1.5rem', fontSize: '0.75rem', color: 'var(--color-gray-600)', lineHeight: 1.5 }}>
            Dual-layer plagiarism: Turnitin + FULafia Internal Engine.<br />
            OWASP ASVS security controls applied.
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', padding: '1rem 1.5rem' }}>
        <div style={{ maxWidth: 'var(--max-width-container)', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--color-gray-600)' }}>
          <span>© {new Date().getFullYear()} Federal University of Lafia. All rights reserved.</span>
          <span>Integrity · Innovation · Excellence</span>
        </div>
      </div>
    </footer>
  );
};
