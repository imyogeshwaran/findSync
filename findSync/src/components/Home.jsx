import React from 'react';
import Prism from '../components/Prism.jsx';

export default function Home() {
  return (
    <div style={{ background: '#ffffff', minHeight: '100vh', color: '#111' }}>
      <header style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        background: 'transparent',
        borderBottom: 'none',
        zIndex: 10
      }}>
        <nav style={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: '0.85rem 1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{
            fontFamily: '"Bodoni Moda", serif',
            fontWeight: 700,
            fontSize: '1.25rem',
            letterSpacing: '0.2px',
            color: '#ffffff',
            textShadow: '0 2px 8px rgba(0,0,0,0.35)'
          }}>
            Find Sync
          </div>
          <ul style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', listStyle: 'none' }}>
            <li><a href="#" style={{ color: '#000000', textDecoration: 'none', fontWeight: 500 }}>Home</a></li>
            <li><a href="#" style={{ color: '#000000', textDecoration: 'none', fontWeight: 500 }}>Explore</a></li>
            <li><a href="#" style={{ color: '#000000', textDecoration: 'none', fontWeight: 500 }}>Find My Product</a></li>
            <li><a href="#" style={{ color: '#000000', textDecoration: 'none', fontWeight: 500 }}>My Account</a></li>
          </ul>
        </nav>
      </header>
      {/* Hero section with Prism background effect (Home page only) */}
      <section style={{ width: '100%', height: '600px', position: 'relative' }}>
        <Prism
          animationType="rotate"
          timeScale={0.5}
          height={3.5}
          baseWidth={5.5}
          scale={3.6}
          hueShift={0}
          colorFrequency={1}
          noise={0.5}
          glow={1}
        />
      </section>
      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '2rem 1rem' }}>
        <h1 style={{ fontFamily: '"Bodoni Moda", serif', fontSize: '2rem', fontWeight: 600, marginBottom: '0.5rem' }}>Welcome to Find Sync</h1>
        <p style={{ color: '#4b5563' }}>Start exploring your products and account using the navigation above.</p>
      </main>
    </div>
  );
}