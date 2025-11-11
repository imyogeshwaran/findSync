import React from 'react';

export default function FindView({ onPostClick, onBrowseClick }) {
  return (
    <div style={{ padding: '20px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={{ fontSize: '2rem', margin: 0 }}>Find Missing Item</h1>
        <button onClick={onPostClick} style={{ padding: '12px 24px', borderRadius: '10px', background: 'linear-gradient(135deg, #4f46e5 0%, #a855f7 100%)', border: 'none', color: 'white', fontSize: '1rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }} onMouseOver={(e) => { e.currentTarget.style.opacity = '0.9'; e.currentTarget.style.transform = 'scale(1.05)'; }} onMouseOut={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'scale(1)'; }}>
          <span style={{ fontSize: '1.2rem' }}>+</span> Post Missing Product
        </button>
      </div>
      <div style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '14px', padding: '24px', marginBottom: '24px' }}>
        <h2 style={{ marginTop: 0 }}>Search for your lost item</h2>
        <p>If you've lost an item, please check the items listed in the Explore section or report a missing item using the "Post Missing Product" button above.</p>
        <div style={{ marginTop: '20px' }}>
          <button onClick={onBrowseClick} style={{ padding: '12px 24px', borderRadius: '10px', background: 'linear-gradient(135deg, #4f46e5 0%, #a855f7 100%)', border: 'none', color: 'white', fontSize: '1rem', fontWeight: 600, cursor: 'pointer' }} onMouseOver={(e) => e.currentTarget.style.opacity = '0.9'} onMouseOut={(e) => e.currentTarget.style.opacity = '1'}>
            Browse Found Items
          </button>
        </div>
      </div>

      <div style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '14px', padding: '24px' }}>
        <h3>Can't find your item?</h3>
        <p>If you can't find your item in the found items list, you can:</p>
        <ul style={{ paddingLeft: '20px' }}>
          <li>Check back later as new items are added regularly</li>
          <li>Use the search function to look for specific items</li>
          <li>Report your lost item using the + button</li>
        </ul>
      </div>
    </div>
  );
}
