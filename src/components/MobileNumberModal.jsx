import React, { useState } from 'react';

export default function MobileNumberModal({ isOpen, onClose, onSubmit }) {
  const [mobileNumber, setMobileNumber] = useState('');
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setMobileNumber(e.target.value);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!mobileNumber || mobileNumber.trim() === '') {
      setError('Please enter a valid mobile number');
      return;
    }

    if (mobileNumber.length < 10) {
      setError('Mobile number must be at least 10 digits');
      return;
    }

    await onSubmit(mobileNumber);
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      backdropFilter: 'blur(5px)',
    }}>
      <div style={{
        backgroundColor: '#1a1a1a',
        padding: '32px',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '420px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
        border: '1px solid rgba(255,255,255,0.1)',
      }} onClick={e => e.stopPropagation()}>
        <h2 style={{ margin: '0 0 24px', fontSize: '1.75rem', fontWeight: 700 }}>Update Your Mobile Number</h2>
        <p style={{ margin: '0 0 24px', opacity: 0.8 }}>Please enter your valid mobile number to complete your profile setup.</p>
        
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontWeight: 500,
              fontSize: '0.9rem',
              opacity: 0.9
            }}>
              Mobile Number
            </label>
            <input
              type="tel"
              value={mobileNumber}
              onChange={handleChange}
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '10px',
                border: error ? '1px solid #ef4444' : '1px solid rgba(255,255,255,0.18)',
                background: 'rgba(0,0,0,0.35)',
                color: '#fff',
                fontSize: '1rem',
                outline: 'none',
                boxSizing: 'border-box',
              }}
              placeholder="Enter your mobile number (10+ digits)"
            />
            {error && (
              <p style={{
                color: '#ef4444',
                fontSize: '0.875rem',
                marginTop: '8px',
                margin: '8px 0 0 0'
              }}>
                {error}
              </p>
            )}
          </div>

          <button
            type="submit"
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: '10px',
              border: 'none',
              background: 'linear-gradient(135deg, #4f46e5 0%, #a855f7 100%)',
              color: 'white',
              fontSize: '1rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              marginBottom: '12px',
            }}
          >
            Save Mobile Number
          </button>

          <button
            type="button"
            onClick={onClose}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: '10px',
              border: '1px solid rgba(255,255,255,0.2)',
              background: 'transparent',
              color: 'white',
              fontSize: '1rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            Cancel
          </button>
        </form>
      </div>
    </div>
  );
}
