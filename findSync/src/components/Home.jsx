import React, { useState } from 'react';
import Threads from '../components/Prism.jsx';

function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [featuresOpen, setFeaturesOpen] = useState(false);

  const linkStyle = { color: '#ffffff', textDecoration: 'none' };
  const btnStyle = {
    padding: '8px 14px',
    borderRadius: 8,
    border: '1px solid rgba(255,255,255,0.3)',
    color: '#ffffff',
    background: 'transparent',
    cursor: 'pointer'
  };
  const btnPrimary = {
    ...btnStyle,
    border: '1px solid rgba(255,255,255,0.5)',
    background: 'rgba(255,255,255,0.1)'
  };

  return (
    <header
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 24px',
        zIndex: 10,
        background: 'transparent',
        color: '#ffffff',
        boxSizing: 'border-box'
      }}
    >
      {/* Left: Title */}
      <a href="#" style={{ ...linkStyle, fontWeight: 700, fontSize: '1.25rem', letterSpacing: '0.3px' }}>FindSync</a>

      {/* Right: Desktop Nav */}
      <nav aria-label="Main" style={{ display: 'none' }} className="nav-desktop">
        <ul style={{ listStyle: 'none', display: 'flex', gap: '20px', margin: 0, padding: 0, alignItems: 'center' }}>
          <li style={{ position: 'relative' }}
              onMouseEnter={() => setFeaturesOpen(true)}
              onMouseLeave={() => setFeaturesOpen(false)}>
            <a href="#" style={linkStyle}>Features ▾</a>
            {featuresOpen && (
              <div style={{
                position: 'absolute', top: 'calc(100% + 8px)', left: 0,
                minWidth: 260,
                background: 'rgba(0,0,0,0.6)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 10,
                padding: 12,
                backdropFilter: 'blur(4px)'
              }}>
                <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 8 }}>
                  {[
                    { title: 'Dashboard', description: 'Overview of your activity' },
                    { title: 'Analytics', description: 'Track your performance' },
                    { title: 'Settings', description: 'Configure your preferences' },
                    { title: 'Integrations', description: 'Connect with other tools' },
                    { title: 'Storage', description: 'Manage your files' },
                    { title: 'Support', description: 'Get help when needed' },
                  ].map((f) => (
                    <li key={f.title}>
                      <a href="#" style={{ ...linkStyle, display: 'block', padding: '8px 10px', borderRadius: 8 }}>
                        <div style={{ fontWeight: 600 }}>{f.title}</div>
                        <div style={{ fontSize: 12, opacity: 0.8 }}>{f.description}</div>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </li>
          <li><a href="#" style={linkStyle}>Products</a></li>
          <li><a href="#" style={linkStyle}>Resources</a></li>
          <li><a href="#" style={linkStyle}>Contact</a></li>
          <li style={{ display: 'flex', gap: 12, marginLeft: 8 }}>
            <button style={btnStyle}>Sign in</button>
            <button style={btnPrimary}>Start for free</button>
          </li>
        </ul>
      </nav>

      {/* Mobile: Hamburger */}
      <button aria-label="Toggle menu" onClick={() => setMobileOpen((v) => !v)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 40,
          height: 40,
          borderRadius: 10,
          border: '1px solid rgba(255,255,255,0.3)',
          background: 'transparent',
          color: '#fff'
        }}
        className="nav-mobile-toggle"
      >
        {/* Simple menu icon */}
        <span style={{ width: 18, height: 2, background: '#fff', display: 'block', position: 'relative' }}>
          <span style={{ content: '""', position: 'absolute', left: 0, top: -6, width: 18, height: 2, background: '#fff' }}></span>
          <span style={{ content: '""', position: 'absolute', left: 0, top: 6, width: 18, height: 2, background: '#fff' }}></span>
        </span>
      </button>

      {/* Mobile sheet */}
      {mobileOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0,
          background: 'rgba(0,0,0,0.8)', color: '#fff',
          borderBottom: '1px solid rgba(255,255,255,0.12)',
          padding: 16, zIndex: 20, backdropFilter: 'blur(4px)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>FindSync</div>
            <button onClick={() => setMobileOpen(false)} style={{ ...btnStyle, padding: '6px 10px' }}>Close</button>
          </div>
          <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <details>
              <summary style={{ cursor: 'pointer' }}>Features</summary>
              <ul style={{ listStyle: 'none', margin: '8px 0 0', padding: 0, display: 'grid', gap: 8 }}>
                {[
                  { title: 'Dashboard', description: 'Overview of your activity' },
                  { title: 'Analytics', description: 'Track your performance' },
                  { title: 'Settings', description: 'Configure your preferences' },
                  { title: 'Integrations', description: 'Connect with other tools' },
                  { title: 'Storage', description: 'Manage your files' },
                  { title: 'Support', description: 'Get help when needed' },
                ].map((f) => (
                  <li key={f.title}>
                    <a href="#" style={{ ...linkStyle, display: 'block' }}>
                      <div style={{ fontWeight: 600 }}>{f.title}</div>
                      <div style={{ fontSize: 12, opacity: 0.8 }}>{f.description}</div>
                    </a>
                  </li>
                ))}
              </ul>
            </details>
            <a href="#" style={linkStyle}>Products</a>
            <a href="#" style={linkStyle}>Resources</a>
            <a href="#" style={linkStyle}>Contact</a>
            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              <button style={btnStyle}>Sign in</button>
              <button style={btnPrimary}>Start for free</button>
            </div>
          </div>
        </div>
      )}

      {/* Responsive behavior without CSS framework: show desktop nav on >= 1024px */}
      <style>
        {`
          @media (min-width: 1024px) {
            .nav-desktop { display: block !important; }
            .nav-mobile-toggle { display: none !important; }
          }
        `}
      </style>
    </header>
  );
}

export default function Home() {
  return (
    <div style={{ background: '#000000', minHeight: '100vh', color: '#000000' }}>
      <Navbar />

      {/* Threads full-screen animated background for Home */}
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0 }}>
        <div style={{ width: '100%', height: '100%', position: 'relative' }}>
          <Threads amplitude={1} distance={0} enableMouseInteraction={true} />
        </div>
      </div>
    </div>
  );
}