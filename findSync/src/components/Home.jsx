import React, { useState } from 'react';
import Threads from '../components/Prism.jsx';

function Navbar({ onNavigate = () => {} }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);

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
          <li><a href="#" style={linkStyle} onClick={(e) => { e.preventDefault(); onNavigate('home'); }}>Home</a></li>
          <li><a href="#" style={linkStyle} onClick={(e) => { e.preventDefault(); onNavigate('explore'); }}>Explore</a></li>
          <li><a href="#" style={linkStyle}>Find</a></li>
          <li style={{ position: 'relative' }}
              onMouseEnter={() => setAccountOpen(true)}
              onMouseLeave={() => setAccountOpen(false)}>
            <a href="#" style={linkStyle}>Account ▾</a>
            {accountOpen && (
              <div style={{
                position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                minWidth: 180,
                background: 'rgba(0,0,0,0.6)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 10,
                padding: 8,
                backdropFilter: 'blur(4px)'
              }}>
                <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 6 }}>
                  <li>
                    <a href="#" style={{ ...linkStyle, display: 'block', padding: '8px 10px', borderRadius: 8 }}>My Profile</a>
                  </li>
                </ul>
              </div>
            )}
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
            <a href="#" style={linkStyle} onClick={(e) => { e.preventDefault(); onNavigate('home'); setMobileOpen(false); }}>Home</a>
            <a href="#" style={linkStyle} onClick={(e) => { e.preventDefault(); onNavigate('explore'); setMobileOpen(false); }}>Explore</a>
            <a href="#" style={linkStyle}>Find</a>
            <details>
              <summary style={{ cursor: 'pointer' }}>Account</summary>
              <ul style={{ listStyle: 'none', margin: '8px 0 0', padding: 0, display: 'grid', gap: 8 }}>
                <li>
                  <a href="#" style={{ ...linkStyle, display: 'block' }}>My Profile</a>
                </li>
              </ul>
            </details>
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

// Inline Explore section with images, finder, description, and "near me" filtering
function ExploreSection() {
  const [query, setQuery] = useState('');
  const [locationFilter, setLocationFilter] = useState('All');
  const [userLoc, setUserLoc] = useState(null); // { lat, lon }
  const [nearMe, setNearMe] = useState(false);
  const [modalItem, setModalItem] = useState(null);

  // Sample data with geo coords (approximate)
  const items = [
    { id: 'e1', title: 'Silver Bracelet', description: 'Found near the fountain. Looks like a charm bracelet.', finder: 'Aisha M.', image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?q=80&w=1200&auto=format&fit=crop', location: 'Central Park', lat: 40.785091, lon: -73.968285, date: '2025-09-14', ownerName: 'Priya Sharma', ownerLocation: 'Upper West Side, NYC', ownerPhone: '+1 555-123-7788' },
    { id: 'e2', title: 'Laptop Sleeve', description: 'Grey 13-inch sleeve with a sticker on it.', finder: 'Rahul S.', image: 'https://images.unsplash.com/photo-1457301547460-216da1913dc0?q=80&w=1200&auto=format&fit=crop', location: 'City Library', lat: 40.753182, lon: -73.982253, date: '2025-09-13', ownerName: 'Daniel Kim', ownerLocation: 'Midtown East, NYC', ownerPhone: '+1 555-987-4421' },
    { id: 'e3', title: 'Sports Bottle', description: 'Blue bottle with name initials "KJ".', finder: 'Meera P.', image: 'https://images.unsplash.com/photo-1597481499750-3e6c4b532c9b?q=80&w=1200&auto=format&fit=crop', location: 'Riverside Walk', lat: 40.8, lon: -73.985, date: '2025-09-12', ownerName: 'Karan Joshi', ownerLocation: 'Harlem, NYC', ownerPhone: '+1 555-332-1144' },
    { id: 'e4', title: 'Passport Cover', description: 'Brown leather cover, no passport inside.', finder: 'Liam T.', image: 'https://images.unsplash.com/photo-1544198365-3cdb2dc6b3ef?q=80&w=1200&auto=format&fit=crop', location: 'Airport T3', lat: 28.55616, lon: 77.100281, date: '2025-09-11', ownerName: 'Anita Rao', ownerLocation: 'Dwarka, New Delhi', ownerPhone: '+91 98765 43210' },
  ];

  const uniqueLocations = ['All', ...Array.from(new Set(items.map(i => i.location)))];

  function haversine(lat1, lon1, lat2, lon2) {
    const toRad = (d) => (d * Math.PI) / 180;
    const R = 6371; // km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon/2)**2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  const filtered = items.filter((it) => {
    const q = query.trim().toLowerCase();
    const matchesQuery = !q || it.title.toLowerCase().includes(q) || it.description.toLowerCase().includes(q) || it.location.toLowerCase().includes(q) || it.finder.toLowerCase().includes(q);
    const matchesLoc = locationFilter === 'All' || it.location === locationFilter;
    let matchesNear = true;
    if (nearMe && userLoc) {
      const dist = haversine(userLoc.lat, userLoc.lon, it.lat, it.lon);
      matchesNear = dist <= 50; // within 50km
    }
    return matchesQuery && matchesLoc && matchesNear;
  }).map(it => {
    let distanceKm = null;
    if (userLoc) {
      distanceKm = Math.round(haversine(userLoc.lat, userLoc.lon, it.lat, it.lon));
    }
    return { ...it, distanceKm };
  });

  function requestLocation() {
    if (!navigator.geolocation) return alert('Geolocation is not supported on this browser.');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLoc({ lat: pos.coords.latitude, lon: pos.coords.longitude });
      },
      (err) => {
        console.error(err);
        alert('Unable to fetch your location. Please allow location access.');
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }

  return (
    <section style={{ marginTop: 8 }}>
      <div
        style={{
          background: 'linear-gradient(135deg, #22c55e 0%, #06b6d4 50%, #6366f1 100%)',
          borderRadius: 16,
          padding: '20px 20px',
          boxShadow: '0 10px 28px rgba(0,0,0,0.28)',
          marginBottom: 14,
          transition: 'transform 400ms ease, box-shadow 400ms ease',
        }}
        className="hero-banner"
      >
        <h2 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800 }}>Explore Found Items</h2>
        <p style={{ marginTop: 6, opacity: 0.95 }}>See items reported by people around you</p>
      </div>

      {/* Controls */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 170px 150px',
          gap: 10,
          background: 'rgba(255,255,255,0.08)',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 14,
          padding: 8,
          boxShadow: '0 6px 20px rgba(0,0,0,0.20)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          marginBottom: 16,
        }}
      >
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by title, description, location or finder"
          style={{
            width: '100%',
            padding: '10px 12px',
            borderRadius: 10,
            border: '1px solid rgba(255,255,255,0.18)',
            background: 'rgba(0,0,0,0.35)',
            color: '#fff',
            outline: 'none',
          }}
        />
        <select
          value={locationFilter}
          onChange={(e) => setLocationFilter(e.target.value)}
          style={{
            width: '100%',
            padding: '10px 12px',
            borderRadius: 10,
            border: '1px solid rgba(255,255,255,0.18)',
            background: 'rgba(0,0,0,0.35)',
            color: '#fff',
            outline: 'none',
            cursor: 'pointer',
          }}
        >
          {uniqueLocations.map(loc => (
            <option key={loc}>{loc}</option>
          ))}
        </select>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => setNearMe(v => !v)}
            style={{
              flex: 1,
              padding: '10px 12px',
              borderRadius: 10,
              border: '1px solid rgba(255,255,255,0.22)',
              background: nearMe ? 'rgba(34,197,94,0.22)' : 'rgba(0,0,0,0.35)',
              color: '#fff',
              cursor: 'pointer',
              transition: 'filter 200ms ease',
            }}
          >
            📍 Near me {nearMe ? 'On' : 'Off'}
          </button>
          <button
            onClick={requestLocation}
            style={{
              flex: 1,
              padding: '10px 12px',
              borderRadius: 10,
              border: '1px solid rgba(255,255,255,0.22)',
              background: 'linear-gradient(135deg, rgba(79,70,229,0.8), rgba(168,85,247,0.8))',
              color: '#fff',
              cursor: 'pointer',
            }}
          >
            Use my location
          </button>
        </div>
      </div>

      {/* Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: 18,
          paddingBottom: 48,
          alignItems: 'start',
        }}
      >
        {filtered.map((it, idx) => (
          <article
            key={it.id}
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 14,
              overflow: 'hidden',
              boxShadow: '0 6px 18px rgba(0,0,0,0.18)',
              transition: 'transform 300ms ease, box-shadow 300ms ease',
              animation: 'fadeUp 500ms ease both',
              animationDelay: `${idx * 60}ms`,
            }}
            className="lost-card"
          >
            <div style={{ width: '100%', height: 180, overflow: 'hidden', background: '#111' }}>
              <img src={it.image} alt={it.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}/>
            </div>
            <div style={{ padding: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>{it.title}</h3>
                <span style={{ fontSize: 12, padding: '4px 10px', borderRadius: 999, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.35)' }}>{it.location}</span>
              </div>
              <p style={{ marginTop: 8, opacity: 0.92, lineHeight: 1.35 }}>
                {it.description}
              </p>
              <div style={{ marginTop: 6, fontSize: 12, opacity: 0.9 }}>
                Owner: <strong>{it.ownerName}</strong> • 📍 {it.ownerLocation}
              </div>
              <div style={{ marginTop: 6, fontSize: 12, opacity: 0.9 }}>
                📞 {it.ownerPhone}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10 }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                  {it.finder.charAt(0)}
                </div>
                <div style={{ fontSize: 13, opacity: 0.95 }}>
                  Found by <strong>{it.finder}</strong>
                </div>
              </div>
              <div style={{ marginTop: 8, fontSize: 12, opacity: 0.8 }}>
                Found at: {it.location}{it.distanceKm != null ? ` • ~${it.distanceKm} km away` : ''} • {it.date}
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                <button
                  onClick={() => setModalItem(it)}
                  style={{
                    flex: 1,
                    padding: '10px 12px',
                    borderRadius: 10,
                    border: '1px solid rgba(255,255,255,0.22)',
                    background: 'linear-gradient(135deg, rgba(79,70,229,0.85), rgba(168,85,247,0.85))',
                    color: '#fff',
                    cursor: 'pointer',
                    transition: 'filter 200ms ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.filter = 'brightness(1.08)')}
                  onMouseLeave={(e) => (e.currentTarget.style.filter = 'brightness(1.0)')}
                >
                  View details
                </button>
                <button
                  style={{
                    flex: 1,
                    padding: '10px 12px',
                    borderRadius: 10,
                    border: '1px solid rgba(255,255,255,0.22)',
                    background: 'rgba(0,0,0,0.35)',
                    color: '#fff',
                    cursor: 'pointer',
                  }}
                >
                  Save
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>

      {/* Detail modal */}
      {modalItem && (
        <div aria-modal="true" role="dialog" onClick={() => setModalItem(null)}
          style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: 'min(720px, 96vw)', background: 'rgba(17,17,17,0.9)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 14, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 0 }}>
              <div style={{ background: '#111', minHeight: 260 }}>
                <img src={modalItem.image} alt={modalItem.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              </div>
              <div style={{ padding: 18 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: 12 }}>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>{modalItem.title}</h3>
                  <button onClick={() => setModalItem(null)} aria-label="Close"
                    style={{ border: '1px solid rgba(255,255,255,0.2)', background: 'transparent', color: '#fff', borderRadius: 8, padding: '6px 10px', cursor: 'pointer' }}>✕</button>
                </div>
                <p style={{ marginTop: 8, opacity: 0.95, lineHeight: 1.5 }}>{modalItem.description}</p>
                <div style={{ marginTop: 10, fontSize: 14, opacity: 0.9 }}>
                  <div>Owner: <strong>{modalItem.ownerName}</strong></div>
                  <div>Owner location: <strong>{modalItem.ownerLocation}</strong></div>
                  <div>Found at: <strong>{modalItem.location}</strong> • {modalItem.date}</div>
                </div>

                <div style={{ marginTop: 14, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <a href={`tel:${modalItem.ownerPhone.replace(/\s/g, '')}`}
                    style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(34,197,94,0.35)', background: 'rgba(34,197,94,0.18)', color: '#bbf7d0', textDecoration: 'none' }}>
                    📞 Call Owner
                  </a>
                  <button
                    onClick={async () => { try { await navigator.clipboard.writeText(modalItem.ownerPhone); alert('Phone number copied'); } catch { alert('Copy failed'); } }}
                    style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(59,130,246,0.35)', background: 'rgba(59,130,246,0.18)', color: '#bfdbfe', cursor: 'pointer' }}>
                    📋 Copy Phone
                  </button>
                  <a href={`https://wa.me/${modalItem.ownerPhone.replace(/[^\d]/g, '')}?text=Hi%2C%20I%20saw%20your%20lost%20item%20on%20FindSync%20and%20would%20like%20to%20connect.`} target="_blank" rel="noreferrer"
                    style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(16,185,129,0.35)', background: 'rgba(16,185,129,0.18)', color: '#d1fae5', textDecoration: 'none' }}>
                    💬 WhatsApp
                  </a>
                </div>

                {modalItem.distanceKm != null && (
                  <div style={{ marginTop: 10, fontSize: 12, opacity: 0.8 }}>
                    Approx. distance from you: ~{modalItem.distanceKm} km
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default function Home() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [view, setView] = useState('explore'); // default to Explore as home

  // Placeholder items for browsing; replace with real data later
  const items = [
    { id: 1, title: 'Black Wallet', category: 'Accessories', location: 'Central Park', date: '2025-09-10' },
    { id: 2, title: 'iPhone 13', category: 'Electronics', location: 'City Library', date: '2025-09-12' },
    { id: 3, title: 'Blue Backpack', category: 'Accessories', location: 'Bus Station', date: '2025-09-13' },
    { id: 4, title: 'Passport', category: 'Documents', location: 'Airport T3', date: '2025-09-14' },
  ];

  const filtered = items.filter((it) => {
    const matchesCategory = category === 'All' || it.category === category;
    const q = query.trim().toLowerCase();
    const matchesQuery = !q || it.title.toLowerCase().includes(q) || it.location.toLowerCase().includes(q);
    return matchesCategory && matchesQuery;
  });

  return (
    <div style={{ background: '#0b0b0b', minHeight: '100vh', color: '#ffffff' }}>
      <Navbar onNavigate={setView} />

      {/* Threads full-screen animated background */}
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0 }}>
        <div style={{ width: '100%', height: '100%', position: 'relative' }}>
          <Threads amplitude={1} distance={0.2} enableMouseInteraction={true} />
        </div>
      </div>

      {/* Foreground content above background */}
      <main style={{ position: 'relative', zIndex: 1, paddingTop: 96 }}>
        <div style={{ maxWidth: 1024, margin: '0 auto', padding: '0 16px' }}>
          {view === 'explore' ? (
            <ExploreSection />
          ) : (
            <>
              {/* Hero banner */}
              <section
                style={{
                  background: 'linear-gradient(135deg, #4f46e5 0%, #06b6d4 50%, #a855f7 100%)',
                  borderRadius: 18,
                  padding: '24px 24px',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
                  color: '#ffffff',
                  backdropFilter: 'saturate(140%)',
                  marginBottom: 16,
                  transition: 'transform 400ms ease, box-shadow 400ms ease',
                }}
                className="hero-banner"
              >
                <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 800, letterSpacing: 0.3 }}>Find Lost Items</h1>
                <p style={{ marginTop: 6, opacity: 0.95 }}>Help reunite people with their lost belongings</p>
              </section>

              {/* Search + Filter card */}
              <section
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 14,
                  padding: 8,
                  boxShadow: '0 6px 20px rgba(0,0,0,0.20)',
                  backdropFilter: 'blur(8px)',
                  WebkitBackdropFilter: 'blur(8px)',
                  marginBottom: 16,
                }}
              >
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 160px', gap: 10 }}>
                  <div style={{ position: 'relative' }}>
                    <input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search lost items..."
                      aria-label="Search lost items"
                      style={{
                        width: '100%',
                        padding: '10px 12px 10px 36px',
                        borderRadius: 10,
                        border: '1px solid rgba(255,255,255,0.18)',
                        background: 'rgba(0,0,0,0.35)',
                        color: '#fff',
                        outline: 'none',
                        transition: 'border-color 200ms ease, box-shadow 200ms ease',
                      }}
                    />
                    <span style={{ position: 'absolute', left: 12, top: 8, opacity: 0.7 }}>🔎</span>
                  </div>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    aria-label="Filter by category"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 10,
                      border: '1px solid rgba(255,255,255,0.18)',
                      background: 'rgba(0,0,0,0.35)',
                      color: '#fff',
                      outline: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    <option>All</option>
                    <option>Electronics</option>
                    <option>Documents</option>
                    <option>Accessories</option>
                    <option>Others</option>
                  </select>
                </div>
              </section>

              {/* Results */}
              {filtered.length === 0 ? (
                <div
                  style={{
                    background: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: 14,
                    padding: 28,
                    boxShadow: '0 6px 20px rgba(0,0,0,0.20)',
                    backdropFilter: 'blur(8px)',
                    WebkitBackdropFilter: 'blur(8px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'column',
                    minHeight: 220,
                  }}
                >
                  <div style={{ fontSize: 40, opacity: 0.6, marginBottom: 8 }}>🔍</div>
                  <div style={{ fontWeight: 700 }}>No items found</div>
                  <div style={{ opacity: 0.8, marginTop: 6 }}>Try adjusting your search or filters</div>
                </div>
              ) : (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                    gap: 16,
                    paddingBottom: 40,
                  }}
                >
                  {filtered.map((it, idx) => (
                    <article
                      key={it.id}
                      style={{
                        background: 'rgba(255,255,255,0.08)',
                        border: '1px solid rgba(255,255,255,0.12)',
                        borderRadius: 14,
                        padding: 16,
                        boxShadow: '0 6px 18px rgba(0,0,0,0.18)',
                        backdropFilter: 'blur(6px)',
                        WebkitBackdropFilter: 'blur(6px)',
                        transform: 'translateY(0px)',
                        transition: 'transform 300ms ease, box-shadow 300ms ease, background 300ms ease',
                        animation: 'fadeUp 500ms ease both',
                        animationDelay: `${idx * 60}ms`,
                      }}
                      className="lost-card"
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>{it.title}</h3>
                        <span style={{
                          fontSize: 12,
                          padding: '4px 10px',
                          borderRadius: 999,
                          border: '1px solid rgba(255,255,255,0.2)',
                          background: 'rgba(0,0,0,0.35)'
                        }}>{it.category}</span>
                      </div>
                      <div style={{ opacity: 0.9, marginTop: 8 }}>{it.location}</div>
                      <div style={{ opacity: 0.7, fontSize: 12, marginTop: 6 }}>{it.date}</div>
                      <button
                        style={{
                          marginTop: 12,
                          width: '100%',
                          padding: '10px 12px',
                          borderRadius: 10,
                          border: '1px solid rgba(255,255,255,0.22)',
                          background: 'linear-gradient(135deg, rgba(79,70,229,0.8), rgba(168,85,247,0.8))',
                          color: '#fff',
                          cursor: 'pointer',
                          transition: 'filter 200ms ease',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.filter = 'brightness(1.08)')}
                        onMouseLeave={(e) => (e.currentTarget.style.filter = 'brightness(1.0)')}
                      >
                        View details
                      </button>
                    </article>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Local styles for subtle effects */}
        <style>
          {`
            @keyframes fadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
            .hero-banner:hover { box-shadow: 0 14px 40px rgba(0,0,0,0.35); transform: translateY(-1px); }
            .lost-card:hover { transform: translateY(-4px); box-shadow: 0 12px 30px rgba(0,0,0,0.28); }
            @media (max-width: 640px) { .hero-banner { padding: 18px; } }
          `}
        </style>
      </main>
    </div>
  );
}