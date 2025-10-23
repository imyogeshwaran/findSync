import React, { useState, useRef, useEffect } from 'react';
import Threads from '../components/Prism.jsx';
import { auth } from '../firebase/firebase.js';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile, onAuthStateChanged, signOut } from 'firebase/auth';
import { syncUserToBackend, createMissingItem, getAllMissingItems, setAuthToken } from '../services/api.js';

// Success checkmark animation component
const CheckmarkAnimation = () => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 0',
    textAlign: 'center'
  }}>
    <div style={{
      width: '80px',
      height: '80px',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'rgba(34, 197, 94, 0.15)',
      margin: '0 auto 20px',
      position: 'relative',
      animation: 'scaleIn 0.3s ease-out'
    }}>
      <svg 
        width="48" 
        height="48" 
        viewBox="0 0 48 48" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        style={{
          animation: 'checkmark 0.5s ease-in-out 0.3s both',
          transformOrigin: '50% 50%',
          strokeDasharray: 60,
          strokeDashoffset: 60,
          stroke: '#22c55e',
          strokeWidth: 4
        }}
      >
        <path d="M8 24L20 36L40 12" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </div>
    <h3 style={{
      color: '#22c55e',
      fontSize: '1.5rem',
      margin: '10px 0',
      fontWeight: 600
    }}>Posted!</h3>
    <p style={{
      color: 'rgba(255, 255, 255, 0.8)',
      margin: '5px 0 0',
      fontSize: '0.95rem'
    }}>Your item has been listed successfully.</p>
  </div>
);

// Loading spinner component
const LoadingSpinner = () => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 0',
    textAlign: 'center'
  }}>
    <div style={{
      width: '60px',
      height: '60px',
      border: '5px solid rgba(79, 70, 229, 0.2)',
      borderTopColor: '#4f46e5',
      borderRadius: '50%',
      margin: '0 auto 20px',
      animation: 'spin 1s linear infinite'
    }}></div>
    <h3 style={{
      color: '#fff',
      fontSize: '1.25rem',
      margin: '10px 0',
      fontWeight: 600
    }}>Posting your item...</h3>
    <p style={{
      color: 'rgba(255, 255, 255, 0.6)',
      margin: '5px 0 0',
      fontSize: '0.9rem'
    }}>This will just take a moment.</p>
  </div>
);

// Keyframes for animations
const styles = document.createElement('style');
styles.textContent = `
  @keyframes scaleIn {
    from { transform: scale(0.9); opacity: 0; }
    to { transform: scale(1); opacity: 1; }
  }
  @keyframes checkmark {
    to { stroke-dashoffset: 0; }
  }
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;
document.head.appendChild(styles);

// Modal component for adding a missing item
function AddItemModal({ isOpen, onClose, onSubmit, isSubmitting, showSuccess }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    location: '',
    mobile: '',
    image: null,
    preview: null
  });
  const fileInputRef = useRef(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          image: file,
          preview: reader.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    let payload;
    if (formData.image) {
      // If image is present, use FormData
      payload = new FormData();
      payload.append('name', formData.name);
      payload.append('description', formData.description);
      payload.append('location', formData.location);
      payload.append('mobile', formData.mobile);
      payload.append('image', formData.image);
      payload.append('category', 'Others');
    } else {
      // Otherwise, use JSON
      payload = {
        name: formData.name,
        description: formData.description,
        location: formData.location,
        mobile: formData.mobile,
        category: 'Others'
      };
    }
    await onSubmit(payload);
    // Reset form
    setFormData({
      name: '',
      description: '',
      location: '',
      mobile: '',
      image: null,
      preview: null
    });
    onClose();
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
    }} onClick={onClose}>
      <div style={{
        backgroundColor: 'transparent',
        padding: '24px',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '500px',
        maxHeight: '90vh',
        overflowY: 'auto',
        overflowX: 'hidden',
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>Report Missing Item</h2>
          <button 
            onClick={onClose}
            style={{
              background: 'none',
              backgroundColor: 'transparent',
              border: 'none',
              outline: 'none',
              boxShadow: 'none',
              color: '#fff',
              fontSize: '3rem',
              cursor: 'pointer',
              opacity: 0.9,
              lineHeight: 1,
              padding: 0,
              margin: 0,
              width: '48px',
              height: '48px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'opacity 0.2s ease, transform 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '1';
              e.currentTarget.style.transform = 'scale(1.1)';
              e.currentTarget.style.background = 'none';
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '0.9';
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.background = 'none';
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            &times;
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontWeight: 500,
              fontSize: '0.9rem',
              opacity: 0.9
            }}>
              Item Name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '10px',
                border: '1px solid rgba(255,255,255,0.18)',
                background: 'rgba(0,0,0,0.35)',
                color: '#fff',
                fontSize: '1rem',
                outline: 'none',
              }}
              placeholder="Enter item name"
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontWeight: 500,
              fontSize: '0.9rem',
              opacity: 0.9
            }}>
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              rows="4"
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '10px',
                border: '1px solid rgba(255,255,255,0.18)',
                background: 'rgba(0,0,0,0.35)',
                color: '#fff',
                fontSize: '1rem',
                resize: 'vertical',
                minHeight: '100px',
                outline: 'none',
              }}
              placeholder="Describe the item in detail (color, brand, unique features)"
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontWeight: 500,
              fontSize: '0.9rem',
              opacity: 0.9
            }}>
              Location Where Lost
            </label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '10px',
                border: '1px solid rgba(255,255,255,0.18)',
                background: 'rgba(0,0,0,0.35)',
                color: '#fff',
                fontSize: '1rem',
                outline: 'none',
              }}
              placeholder="Where did you last see this item?"
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
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
              name="mobile"
              value={formData.mobile}
              onChange={handleChange}
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '10px',
                border: '1px solid rgba(255,255,255,0.18)',
                background: 'rgba(0,0,0,0.35)',
                color: '#fff',
                fontSize: '1rem',
                outline: 'none',
              }}
              placeholder="Your contact number"
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontWeight: 500,
              fontSize: '0.9rem',
              opacity: 0.9
            }}>
              Upload Image
            </label>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleImageChange}
              style={{ display: 'none' }}
            />
            <div 
              onClick={() => fileInputRef.current.click()}
              style={{
                border: '2px dashed rgba(255,255,255,0.2)',
                borderRadius: '10px',
                padding: '20px',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                background: formData.preview ? `url(${formData.preview}) center/cover` : 'rgba(0,0,0,0.2)',
                height: formData.preview ? '200px' : 'auto',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {!formData.preview && (
                <>
                  <div style={{ fontSize: '2rem', marginBottom: '10px' }}>📷</div>
                  <div>Click to upload an image</div>
                  <div style={{ fontSize: '0.8rem', opacity: 0.7, marginTop: '4px' }}>JPG, PNG (max 5MB)</div>
                </>
              )}
            </div>
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
            }}
            onMouseOver={(e) => e.currentTarget.style.opacity = '0.9'}
            onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
          >
            Submit Report
          </button>
        </form>
      </div>
    </div>
  );
}

// Authentication Modal Component
function AuthModal({ isOpen, onClose, onAuthSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let firebaseUser;
      
      if (isLogin) {
        // Sign in existing user
        const userCredential = await signInWithEmailAndPassword(auth, formData.email, formData.password);
        firebaseUser = userCredential.user;
      } else {
        // Create new user
        const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
        // Update profile with display name
        await updateProfile(userCredential.user, {
          displayName: formData.name
        });
        firebaseUser = userCredential.user;
      }
      
      // Sync user to MySQL backend
      try {
        await syncUserToBackend(firebaseUser);
        console.log('✅ User synced to backend successfully');
      } catch (syncError) {
        console.error('Failed to sync user to backend:', syncError);
        // Continue even if backend sync fails
      }
      
      onAuthSuccess();
      onClose();
      setFormData({ name: '', email: '', password: '' });
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
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
    }} onClick={onClose}>
      <div style={{
        backgroundColor: '#1a1a1a',
        padding: '32px',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '420px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
        border: '1px solid rgba(255,255,255,0.1)',
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 700 }}>
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h2>
          <button 
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#fff',
              fontSize: '1.5rem',
              cursor: 'pointer',
              opacity: 0.7,
            }}
          >
            &times;
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: 500,
                fontSize: '0.9rem',
                opacity: 0.9
              }}>
                Full Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '10px',
                  border: '1px solid rgba(255,255,255,0.18)',
                  background: 'rgba(0,0,0,0.35)',
                  color: '#fff',
                  fontSize: '1rem',
                  outline: 'none',
                }}
                placeholder="Enter your full name"
              />
            </div>
          )}

          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontWeight: 500,
              fontSize: '0.9rem',
              opacity: 0.9
            }}>
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '10px',
                border: '1px solid rgba(255,255,255,0.18)',
                background: 'rgba(0,0,0,0.35)',
                color: '#fff',
                fontSize: '1rem',
                outline: 'none',
              }}
              placeholder="Enter your email"
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontWeight: 500,
              fontSize: '0.9rem',
              opacity: 0.9
            }}>
              Password
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              minLength="6"
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '10px',
                border: '1px solid rgba(255,255,255,0.18)',
                background: 'rgba(0,0,0,0.35)',
                color: '#fff',
                fontSize: '1rem',
                outline: 'none',
              }}
              placeholder="Enter your password"
            />
          </div>

          {error && (
            <div style={{
              padding: '12px',
              borderRadius: '8px',
              background: 'rgba(239,68,68,0.15)',
              border: '1px solid rgba(239,68,68,0.3)',
              color: '#fca5a5',
              fontSize: '0.9rem',
              marginBottom: '16px'
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: '10px',
              border: 'none',
              background: loading ? 'rgba(79,70,229,0.5)' : 'linear-gradient(135deg, #4f46e5 0%, #a855f7 100%)',
              color: 'white',
              fontSize: '1rem',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Sign Up')}
          </button>
        </form>

        <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '0.9rem', opacity: 0.8 }}>
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
              setFormData({ name: '', email: '', password: '' });
            }}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#a855f7',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.9rem',
              textDecoration: 'underline'
            }}
          >
            {isLogin ? 'Sign Up' : 'Sign In'}
          </button>
        </div>
      </div>
    </div>
  );
}

function Navbar({ onNavigate = () => {}, user, onAuthClick, onLogout }) {
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
          <li><a href="#" style={linkStyle} onClick={(e) => { e.preventDefault(); onNavigate('find'); }}>Find</a></li>
          {user ? (
            <li style={{ position: 'relative' }}
                onMouseEnter={() => setAccountOpen(true)}
                onMouseLeave={() => setAccountOpen(false)}>
              <a href="#" style={linkStyle}>{user.displayName || 'Account'} ▾</a>
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
                      <a href="#" onClick={(e) => { e.preventDefault(); onNavigate('profile'); }} style={{ ...linkStyle, display: 'block', padding: '8px 10px', borderRadius: 8 }}>My Profile</a>
                    </li>
                    <li>
                      <a href="#" onClick={(e) => { e.preventDefault(); onLogout(); }} style={{ ...linkStyle, display: 'block', padding: '8px 10px', borderRadius: 8, color: '#f87171' }}>Logout</a>
                    </li>
                  </ul>
                </div>
              )}
            </li>
          ) : (
            <li>
              <button onClick={onAuthClick} style={btnPrimary}>Sign In</button>
            </li>
          )}
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
            <a href="#" style={linkStyle} onClick={(e) => { e.preventDefault(); onNavigate('find'); setMobileOpen(false); }}>Find</a>
            {user ? (
              <details>
                <summary style={{ cursor: 'pointer' }}>{user.displayName || 'Account'}</summary>
                <ul style={{ listStyle: 'none', margin: '8px 0 0', padding: 0, display: 'grid', gap: 8 }}>
                  <li>
                    <a href="#" onClick={(e) => { e.preventDefault(); onNavigate('profile'); setMobileOpen(false); }} style={{ ...linkStyle, display: 'block' }}>My Profile</a>
                  </li>
                  <li>
                    <a href="#" onClick={(e) => { e.preventDefault(); onLogout(); setMobileOpen(false); }} style={{ ...linkStyle, display: 'block', color: '#f87171' }}>Logout</a>
                  </li>
                </ul>
              </details>
            ) : (
              <button onClick={() => { onAuthClick(); setMobileOpen(false); }} style={{ ...btnPrimary, width: '100%' }}>Sign In</button>
            )}
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
function ExploreSection({ userItems = [] }) {
  const [query, setQuery] = useState('');
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
  }).map(it => ({
    ...it,
    distanceKm: null // Keep the property but always set to null
  }));

  return (
    <section style={{ marginTop: 8, paddingBottom: '80px' }}>
      <div
        style={{
          background: 'transparent',
          borderRadius: 16,
          padding: '20px 20px',
          marginBottom: 14,
          transition: 'transform 400ms ease, box-shadow 400ms ease',
        }}
        className="hero-banner"
      >
        <h2 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800 }}>Explore Found Items</h2>
        <p style={{ marginTop: 6, opacity: 0.95 }}>See items reported by people around you</p>
      </div>

      {/* Search Bar */}
      <div
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
        <div style={{ position: 'relative' }}>
          <input
            value={query || ''}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by title, description, or location"
            style={{
              width: '100%',
              padding: '12px 16px 12px 44px',
              borderRadius: 10,
              border: '1px solid rgba(255,255,255,0.18)',
              background: 'rgba(0,0,0,0.35)',
              color: '#fff',
              outline: 'none',
              fontSize: '0.95rem',
            }}
          />
          <span style={{
            position: 'absolute',
            left: 14,
            top: '50%',
            transform: 'translateY(-50%)',
            opacity: 0.6,
            fontSize: '1.1rem'
          }}>🔍</span>
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
              {it.finder && it.finder !== 'Missing Item' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10 }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                    {it.finder.charAt(0)}
                  </div>
                  <div style={{ fontSize: 13, opacity: 0.95 }}>
                    Found by <strong>{it.finder}</strong>
                  </div>
                </div>
              )}
              {it.finder === 'Missing Item' && (
                <div style={{ marginTop: 10, padding: '8px 12px', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', fontSize: 13 }}>
                  🔍 <strong>Missing Item</strong> - Owner looking for this
                </div>
              )}
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

// Profile Page Component
function ProfilePage({ user }) {
  if (!user) {
    return (
      <div style={{ padding: '40px 20px', textAlign: 'center' }}>
        <h2>Please sign in to view your profile</h2>
      </div>
    );
  }

  return (
    <div style={{ padding: '40px 20px', maxWidth: '600px', margin: '0 auto' }}>
      <div style={{
        background: 'rgba(255,255,255,0.08)',
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: '16px',
        padding: '32px',
        boxShadow: '0 6px 20px rgba(0,0,0,0.20)',
        backdropFilter: 'blur(8px)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '100px',
            height: '100px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #4f46e5 0%, #a855f7 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2.5rem',
            fontWeight: 700,
            margin: '0 auto 16px',
            color: '#fff'
          }}>
            {user.displayName ? user.displayName.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
          </div>
          <h1 style={{ margin: '0 0 8px', fontSize: '2rem', fontWeight: 700 }}>My Profile</h1>
          <p style={{ margin: 0, opacity: 0.8 }}>Your account information</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{
            padding: '16px',
            background: 'rgba(0,0,0,0.3)',
            borderRadius: '12px',
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            <div style={{ fontSize: '0.85rem', opacity: 0.7, marginBottom: '4px' }}>Full Name</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>{user.displayName || 'Not provided'}</div>
          </div>

          <div style={{
            padding: '16px',
            background: 'rgba(0,0,0,0.3)',
            borderRadius: '12px',
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            <div style={{ fontSize: '0.85rem', opacity: 0.7, marginBottom: '4px' }}>Email Address</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>{user.email}</div>
          </div>

          <div style={{
            padding: '16px',
            background: 'rgba(0,0,0,0.3)',
            borderRadius: '12px',
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            <div style={{ fontSize: '0.85rem', opacity: 0.7, marginBottom: '4px' }}>Account Status</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 600, color: '#10b981' }}>✓ Active</div>
          </div>

          <div style={{
            padding: '16px',
            background: 'rgba(0,0,0,0.3)',
            borderRadius: '12px',
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            <div style={{ fontSize: '0.85rem', opacity: 0.7, marginBottom: '4px' }}>Member Since</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>
              {user.metadata?.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              }) : 'N/A'}
            </div>
          </div>
        </div>

        <div style={{ marginTop: '32px', padding: '16px', background: 'rgba(79,70,229,0.15)', borderRadius: '12px', border: '1px solid rgba(79,70,229,0.3)' }}>
          <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>
            💡 <strong>Tip:</strong> Keep your account information up to date to help others contact you about found items.
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [view, setView] = useState('explore'); // 'explore', 'find', or 'profile'
  const [userItems, setUserItems] = useState([]); // User-submitted missing items (offline/local only)
  const [missingItems, setMissingItems] = useState([]); // Items fetched from backend
  const [showAddModal, setShowAddModal] = useState(false); // Control modal visibility
  const [showAuthModal, setShowAuthModal] = useState(false); // Control auth modal visibility
  const [modalItem, setModalItem] = useState(null); // Currently selected item for details modal
  const [user, setUser] = useState(null); // Current authenticated user
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Fetch missing items from backend
  const fetchMissingItems = async () => {
    try {
      const res = await getAllMissingItems();
      if (res && res.items) {
        setMissingItems(res.items.map(it => ({
          id: it.id,
          title: it.name,
          description: it.description,
          location: it.location,
          date: new Date(it.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' }),
          image: it.image_url || 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=400',
          ownerName: it.owner_name || 'Unknown',
          ownerPhone: it.mobile,
          ownerLocation: it.location,
          finder: 'Missing Item',
          category: it.category || 'Others'
        })));
      }
    } catch (err) {
      console.error('Failed to fetch missing items:', err);
    }
  };

  // Listen for authentication state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      // Fetch items whenever auth state changes so we always have latest
      fetchMissingItems();
      
      // Sync user to backend when logged in
      if (currentUser) {
        try {
          await syncUserToBackend(currentUser);
          console.log('✅ User synced on auth state change');
        } catch (error) {
          console.error('Failed to sync user:', error);
        }
      } else {
        // Clear auth token when logged out
        setAuthToken(null);
      }
    });
    return () => unsubscribe();
  }, []);

  // Initial fetch of missing items
  useEffect(() => {
    fetchMissingItems();
  }, []);

  // Handle logout
  const handleLogout = async () => {
    try {
      await signOut(auth);
      setView('explore');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Placeholder items for browsing; replace with real data later
  const items = [
    { id: 1, title: 'Black Wallet', category: 'Accessories', location: 'Central Park', date: '2025-09-10' },
    { id: 2, title: 'iPhone 13', category: 'Electronics', location: 'City Library', date: '2025-09-12' },
    { id: 3, title: 'Blue Backpack', category: 'Accessories', location: 'Bus Station', date: '2025-09-13' },
    { id: 4, title: 'Passport', category: 'Documents', location: 'Airport T3', date: '2025-09-14' },
  ];

  // Combine items with user-submitted items for home page display
  const allDisplayItems = [...items, ...userItems.map(item => ({
    id: item.id,
    title: item.name,
    category: item.category || 'Others',
    location: item.location,
    date: item.date
  }))];

  const filtered = allDisplayItems.filter((it) => {
    const matchesCategory = category === 'All' || it.category === category;
    const q = query.trim().toLowerCase();
    const matchesQuery = !q || it.title.toLowerCase().includes(q) || it.location.toLowerCase().includes(q);
    return matchesCategory && matchesQuery;
  });

  // Handle submission of new missing item
  const handleAddItem = async (formData) => {
    setIsSubmitting(true);

    // Validation: Ensure name and location are provided
    if (!formData.name || !formData.location) {
      alert('Please provide both the item name and location.');
      setIsSubmitting(false);
      return;
    }

    try {
      await createMissingItem({
        name: formData.name,
        description: formData.description,
        location: formData.location,
        mobile: formData.mobile,
        image_url: formData.preview,
        category: formData.category || 'Others'
      });
      // Show success animation
      setShowSuccess(true);
      // Refresh list from backend
      await fetchMissingItems();
      // Hide success after 2 seconds and close modal
      setTimeout(() => {
        setShowSuccess(false);
        setShowAddModal(false);
      }, 2000);
    } catch (err) {
      console.error('Failed to create missing item:', err);
      // Fallback to local state so user still sees it
      const newItem = {
        id: `temp-${Date.now()}`,
        title: formData.name,
        description: formData.description,
        location: formData.location,
        image: formData.preview || 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=400',
        date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' }),
        ownerName: 'You',
        ownerLocation: formData.location,
        ownerPhone: formData.mobile,
        finder: 'Missing Item',
        category: formData.category || 'Others'
      };
      setUserItems(prev => [newItem, ...prev]);
      setShowAddModal(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ background: '#0b0b0b', minHeight: '100vh', color: '#ffffff', position: 'relative', overflowX: 'hidden', overflowY: 'auto' }}>
      <Navbar 
        onNavigate={setView} 
        user={user} 
        onAuthClick={() => setShowAuthModal(true)}
        onLogout={handleLogout}
      />

      {/* Threads full-screen animated background */}
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0, pointerEvents: 'none' }}>
        <div style={{ width: '100%', height: '100%', position: 'relative' }}>
          <Threads amplitude={1} distance={0.2} enableMouseInteraction={false} />
        </div>
      </div>

      {/* Foreground content above background */}
      <main style={{ position: 'relative', zIndex: 1, paddingTop: 96, minHeight: 'calc(100vh - 96px)', paddingBottom: 40 }}>
        <div style={{ maxWidth: 1024, margin: '0 auto', padding: '0 16px', width: '100%' }}>
          {view === 'explore' ? (
            <ExploreSection userItems={[...missingItems, ...userItems]} />
          ) : view === 'find' ? (
            <div style={{ padding: '20px 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h1 style={{ fontSize: '2rem', margin: 0 }}>Find Missing Item</h1>
                <button 
                  onClick={() => setShowAddModal(true)}
                  style={{
                    padding: '12px 24px',
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, #4f46e5 0%, #a855f7 100%)',
                    border: 'none',
                    color: 'white',
                    fontSize: '1rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'transform 0.2s, opacity 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.opacity = '0.9';
                    e.currentTarget.style.transform = 'scale(1.05)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.opacity = '1';
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  <span style={{ fontSize: '1.2rem' }}>+</span> Post Missing Product
                </button>
              </div>
              <div style={{
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: '14px',
                padding: '24px',
                marginBottom: '24px'
              }}>
                <h2 style={{ marginTop: 0 }}>Search for your lost item</h2>
                <p>If you've lost an item, please check the items listed in the Explore section or report a missing item using the "Post Missing Product" button above.</p>
                <div style={{ marginTop: '20px' }}>
                  <button 
                    onClick={() => setView('explore')}
                    style={{
                      padding: '12px 24px',
                      borderRadius: '10px',
                      background: 'linear-gradient(135deg, #4f46e5 0%, #a855f7 100%)',
                      border: 'none',
                      color: 'white',
                      fontSize: '1rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'opacity 0.2s',
                    }}
                    onMouseOver={(e) => e.currentTarget.style.opacity = '0.9'}
                    onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
                  >
                    Browse Found Items
                  </button>
                </div>
              </div>
              <div style={{
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: '14px',
                padding: '24px',
              }}>
                <h3>Can't find your item?</h3>
                <p>If you can't find your item in the found items list, you can:</p>
                <ul style={{ paddingLeft: '20px' }}>
                  <li>Check back later as new items are added regularly</li>
                  <li>Use the search function to look for specific items</li>
                  <li>Report your lost item using the + button</li>
                </ul>
              </div>
            </div>
          ) : view === 'profile' ? (
            <ProfilePage user={user} />
          ) : (
            <div>
              {/* Hero banner */}
              <section
                style={{
                  background: 'transparent',
                  borderRadius: 18,
                  padding: '24px 24px',
                  color: '#ffffff',
                  marginBottom: 16,
                  transition: 'transform 400ms ease, box-shadow 400ms ease',
                }}
                className="hero-banner"
              >
                <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 800, letterSpacing: 0.3 }}>Find Lost Items</h1>
                <p style={{ marginTop: 6, opacity: 0.95 }}>Help reunite people with their lost belongings</p>
              </section>

              {/* Filter card */}
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
                        onClick={() => setModalItem(it)}
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
            </div>
          )}
        </div>
      </main>

      {/* Item Details Modal */}
      {modalItem && (
        <div aria-modal="true" role="dialog" onClick={() => setModalItem(null)}
          style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: 'min(720px, 96vw)', background: 'rgba(17,17,17,0.9)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 14, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 0 }}>
              <div style={{ background: '#111', minHeight: 260 }}>
                <img 
                  src={modalItem.image || 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=400'} 
                  alt={modalItem.title} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} 
                />
              </div>
              <div style={{ padding: 18 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: 12 }}>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>{modalItem.title}</h3>
                  <button 
                    onClick={() => setModalItem(null)} 
                    aria-label="Close"
                    style={{ 
                      border: '1px solid rgba(255,255,255,0.2)', 
                      background: 'transparent', 
                      color: '#fff', 
                      borderRadius: 8, 
                      padding: '6px 10px', 
                      cursor: 'pointer' 
                    }}
                  >
                    ✕
                  </button>
                </div>
                <p style={{ marginTop: 8, opacity: 0.95, lineHeight: 1.5 }}>
                  {modalItem.description || 'No description available.'}
                </p>
                <div style={{ marginTop: 10, fontSize: 14, opacity: 0.9 }}>
                  <div>Category: <strong>{modalItem.category || 'Not specified'}</strong></div>
                  <div>Location: <strong>{modalItem.location || 'Not specified'}</strong></div>
                  <div>Date: <strong>{modalItem.date || 'Not specified'}</strong></div>
                  {modalItem.ownerName && (
                    <div>Owner: <strong>{modalItem.ownerName}</strong></div>
                  )}
                  {modalItem.ownerPhone && (
                    <div>Contact: <strong>{modalItem.ownerPhone}</strong></div>
                  )}
                </div>

                {(modalItem.ownerPhone && modalItem.ownerName) && (
                  <div style={{ marginTop: 14, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <a 
                      href={`tel:${modalItem.ownerPhone.replace(/\s/g, '')}`}
                      style={{ 
                        padding: '10px 12px', 
                        borderRadius: 10, 
                        border: '1px solid rgba(34,197,94,0.35)', 
                        background: 'rgba(34,197,94,0.18)', 
                        color: '#bbf7d0', 
                        textDecoration: 'none',
                        fontSize: '0.9rem'
                      }}
                    >
                      📞 Call Owner
                    </a>
                    <button
                      onClick={async () => { 
                        try { 
                          await navigator.clipboard.writeText(modalItem.ownerPhone); 
                          alert('Phone number copied to clipboard'); 
                        } catch (err) { 
                          console.error('Failed to copy:', err);
                          alert('Failed to copy phone number'); 
                        } 
                      }}
                      style={{ 
                        padding: '10px 12px', 
                        borderRadius: 10, 
                        border: '1px solid rgba(59,130,246,0.35)', 
                        background: 'rgba(59,130,246,0.18)', 
                        color: '#bfdbfe', 
                        cursor: 'pointer',
                        fontSize: '0.9rem'
                      }}
                    >
                      📋 Copy Phone
                    </button>
                    <a 
                      href={`https://wa.me/${modalItem.ownerPhone.replace(/[^\d]/g, '')}?text=Hi%2C%20I%20saw%20your%20item%20on%20FindSync%20and%20would%20like%20to%20connect.`} 
                      target="_blank" 
                      rel="noreferrer"
                      style={{ 
                        padding: '10px 12px', 
                        borderRadius: 10, 
                        border: '1px solid rgba(16,185,129,0.35)', 
                        background: 'rgba(16,185,129,0.18)', 
                        color: '#d1fae5', 
                        textDecoration: 'none',
                        fontSize: '0.9rem'
                      }}
                    >
                      💬 WhatsApp
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Item Modal */}
      <AddItemModal 
        isOpen={showAddModal} 
        onClose={() => setShowAddModal(false)} 
        onSubmit={handleAddItem}
        isSubmitting={isSubmitting}
        showSuccess={showSuccess}
      />

      {/* Auth Modal */}
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
        onAuthSuccess={() => setShowAuthModal(false)} 
      />

      {/* Floating Action Button - Show on all pages except Find */}
      {view !== 'find' && (
        <>
          <style>
            {`
              @keyframes fabGlow {
                0%, 100% {
                  opacity: 0.5;
                  transform: scale(1);
                }
                50% {
                  opacity: 0.8;
                  transform: scale(1.2);
                }
              }
              
              .fab-glow {
                position: absolute;
                width: 100%;
                height: 100%;
                border-radius: 50%;
                background: radial-gradient(circle, rgba(168,85,247,0.5) 0%, transparent 70%);
                animation: fabGlow 2s ease-in-out infinite;
                pointer-events: none;
              }
              
              .fab-container {
                position: fixed;
                bottom: 24px;
                right: 24px;
                display: flex;
                align-items: center;
                gap: 12px;
                z-index: 100;
              }
              
              .fab-text {
                opacity: 0;
                transform: translateX(20px);
                transition: opacity 0.3s ease, transform 0.3s ease;
                white-space: nowrap;
                background: rgba(0, 0, 0, 0.8);
                padding: 10px 16px;
                border-radius: 8px;
                border: 1px solid rgba(255,255,255,0.2);
                color: white;
                font-size: 0.9rem;
                font-weight: 500;
                pointer-events: none;
                backdrop-filter: blur(10px);
              }
              
              .fab-container:hover .fab-text {
                opacity: 1;
                transform: translateX(0);
              }
              
              .fab-button {
                width: 64px;
                height: 64px;
                border-radius: 50%;
                flex-shrink: 0;
              }
            `}
          </style>
          
          <div className="fab-container">
            <span className="fab-text">Find the missing product</span>
            <button
              onClick={() => setShowAddModal(true)}
              className="fab-button"
              style={{
                background: 'linear-gradient(135deg, #4f46e5 0%, #a855f7 100%)',
                border: 'none',
                color: 'white',
                fontSize: '2rem',
                fontWeight: 300,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'transform 0.2s ease',
                position: 'relative',
                boxShadow: '0 4px 20px rgba(79,70,229,0.4), 0 8px 40px rgba(168,85,247,0.3)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
              title="Post Missing Product"
            >
              <div className="fab-glow"></div>
              <span style={{ position: 'relative', zIndex: 2 }}>+</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
