import React, { useState } from 'react';

export default function ExploreSection({ userItems = [], onViewItem }) {
  const [query, setQuery] = useState('');
  const [modalItem, setModalItem] = useState(null);

  // Sample data with geo coords (approximate)
  const items = [
    { id: 'e1', title: 'Silver Bracelet', description: 'Found near the fountain. Looks like a charm bracelet.', finder: 'Aisha M.', image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?q=80&w=1200&auto=format&fit=crop', location: 'Central Park', lat: 40.785091, lon: -73.968285, date: '2025-09-14', ownerName: 'Priya Sharma', ownerLocation: 'Upper West Side, NYC', ownerPhone: '+1 555-123-7788' },
    { id: 'e2', title: 'Laptop Sleeve', description: 'Grey 13-inch sleeve with a sticker on it.', finder: 'Rahul S.', image: 'https://images.unsplash.com/photo-1457301547460-216da1913dc0?q=80&w=1200&auto=format&fit=crop', location: 'City Library', lat: 40.753182, lon: -73.982253, date: '2025-09-13', ownerName: 'Daniel Kim', ownerLocation: 'Midtown East, NYC', ownerPhone: '+1 555-987-4421' },
    { id: 'e3', title: 'Sports Bottle', description: 'Blue bottle with name initials "KJ".', finder: 'Meera P.', image: 'https://images.unsplash.com/photo-1597481499750-3e6c4b532c9b?q=80&w=1200&auto=format&fit=crop', location: 'Riverside Walk', lat: 40.8, lon: -73.985, date: '2025-09-12', ownerName: 'Karan Joshi', ownerLocation: 'Harlem, NYC', ownerPhone: '+1 555-332-1144' },
    { id: 'e4', title: 'Passport Cover', description: 'Brown leather cover, no passport inside.', finder: 'Liam T.', image: 'https://images.unsplash.com/photo-1544198365-3cdb2dc6b3ef?q=80&w=1200&auto=format&fit=crop', location: 'Airport T3', lat: 28.55616, lon: 77.100281, date: '2025-09-11', ownerName: 'Anita Rao', ownerLocation: 'Dwarka, New Delhi', ownerPhone: '+91 98765 43210' },
  ];

  // Combine sample items with user-submitted items
  const allItems = [...items, ...userItems];

  const filtered = allItems.filter((it) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return (
      it.title.toLowerCase().includes(q) ||
      it.description.toLowerCase().includes(q) ||
      it.location.toLowerCase().includes(q) ||
      (it.finder && it.finder.toLowerCase().includes(q)) ||
      (it.ownerName && it.ownerName.toLowerCase().includes(q))
    );
  }).map(it => ({ ...it, distanceKm: null }));

  return (
    <section style={{ marginTop: 8, paddingBottom: '80px' }}>
      <div style={{ background: 'transparent', borderRadius: 16, padding: '20px 20px', marginBottom: 14 }} className="hero-banner">
        <h2 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800 }}>Explore Found Items</h2>
        <p style={{ marginTop: 6, opacity: 0.95 }}>See items reported by people around you</p>
      </div>

      <div style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 14, padding: 8, marginBottom: 16 }}>
        <div style={{ position: 'relative' }}>
          <input value={query || ''} onChange={(e) => setQuery(e.target.value)} placeholder="Search by title, description, or location" style={{ width: '100%', padding: '12px 16px 12px 44px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.18)', background: 'rgba(0,0,0,0.35)', color: '#fff', outline: 'none', fontSize: '0.95rem' }} />
          <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', opacity: 0.6, fontSize: '1.1rem' }}>🔍</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 18, paddingBottom: 48, alignItems: 'start' }}>
        {filtered.map((it, idx) => (
          <article key={it.id} style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 14, overflow: 'hidden', boxShadow: '0 6px 18px rgba(0,0,0,0.18)', transition: 'transform 300ms ease, box-shadow 300ms ease', animation: 'fadeUp 500ms ease both', animationDelay: `${idx * 60}ms` }} className="lost-card">
            <div style={{ width: '100%', height: 180, overflow: 'hidden', background: '#111' }}>
              <img src={it.image} alt={it.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            </div>
            <div style={{ padding: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>{it.title}</h3>
                <span style={{ fontSize: 12, padding: '4px 10px', borderRadius: 999, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.35)' }}>{it.location}</span>
              </div>
              <p style={{ marginTop: 8, opacity: 0.92, lineHeight: 1.35 }}>{it.description}</p>
              <div style={{ marginTop: 6, fontSize: 12, opacity: 0.9 }}>Owner: <strong>{it.ownerName}</strong> • 📍 {it.ownerLocation}</div>
              <div style={{ marginTop: 6, fontSize: 12, opacity: 0.9 }}>📞 {it.ownerPhone}</div>
              <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                <button onClick={() => onViewItem?.(it) || setModalItem(it)} style={{ flex: 1, padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.22)', background: 'linear-gradient(135deg, rgba(79,70,229,0.85), rgba(168,85,247,0.85))', color: '#fff', cursor: 'pointer' }}>View details</button>
                <button style={{ flex: 1, padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.22)', background: 'rgba(0,0,0,0.35)', color: '#fff', cursor: 'pointer' }}>Save</button>
              </div>
            </div>
          </article>
        ))}
      </div>

      {modalItem && (
        <div aria-modal="true" role="dialog" onClick={() => setModalItem(null)} style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: 'min(720px, 96vw)', background: 'rgba(17,17,17,0.9)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 14, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 0 }}>
              <div style={{ background: '#111', minHeight: 260 }}>
                <img src={modalItem.image} alt={modalItem.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              </div>
              <div style={{ padding: 18 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: 12 }}>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>{modalItem.title}</h3>
                  <button onClick={() => setModalItem(null)} aria-label="Close" style={{ border: '1px solid rgba(255,255,255,0.2)', background: 'transparent', color: '#fff', borderRadius: 8, padding: '6px 10px', cursor: 'pointer' }}>✕</button>
                </div>
                <p style={{ marginTop: 8, opacity: 0.95, lineHeight: 1.5 }}>{modalItem.description}</p>
                <div style={{ marginTop: 10, fontSize: 14, opacity: 0.9 }}>
                  <div>Owner: <strong>{modalItem.ownerName}</strong></div>
                  <div>Owner location: <strong>{modalItem.ownerLocation}</strong></div>
                  <div>Found at: <strong>{modalItem.location}</strong> • {modalItem.date}</div>
                </div>
                <div style={{ marginTop: 14, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <a href={`tel:${modalItem.ownerPhone.replace(/\s/g, '')}`} style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(34,197,94,0.35)', background: 'rgba(34,197,94,0.18)', color: '#bbf7d0', textDecoration: 'none' }}>📞 Call Owner</a>
                  <button onClick={async () => { try { await navigator.clipboard.writeText(modalItem.ownerPhone); alert('Phone number copied'); } catch { alert('Copy failed'); } }} style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(59,130,246,0.35)', background: 'rgba(59,130,246,0.18)', color: '#bfdbfe', cursor: 'pointer' }}>📋 Copy Phone</button>
                  <a href={`https://wa.me/${modalItem.ownerPhone.replace(/[^\d]/g, '')}?text=Hi%2C%20I%20saw%20your%20lost%20item%20on%20FindSync%20and%20would%20like%20to%20connect.`} target="_blank" rel="noreferrer" style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(16,185,129,0.35)', background: 'rgba(16,185,129,0.18)', color: '#d1fae5', textDecoration: 'none' }}>💬 WhatsApp</a>
                </div>
                {modalItem.distanceKm != null && (<div style={{ marginTop: 10, fontSize: 12, opacity: 0.8 }}>Approx. distance from you: ~{modalItem.distanceKm} km</div>)}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
