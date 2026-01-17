import React from 'react';
import { doSignInWithEmailAndPassword, doSignInWithGoogle } from '../firebase/auth';
import { auth } from '../firebase/firebase';
import { getFirestore, collection, addDoc } from 'firebase/firestore';
import {useAuth} from '../firebase/Acindex.jsx';

const db = getFirestore();

async function logAuthEvent(type, user) {
  await addDoc(collection(db, 'authEvents'), {
    uid: user.uid,
    email: user.email,
    type,
    timestamp: new Date()
  });
}

function SigninForm({ onShowSignup, onAuthSuccess, onAdminLogin }) {
  const [formData, setFormData] = React.useState({ email: '', password: '' });
  const [successMsg, setSuccessMsg] = React.useState('');
  const [isAdminLogin, setIsAdminLogin] = React.useState(false);

  React.useEffect(() => {
    if (!successMsg) return;
    const t = setTimeout(() => setSuccessMsg(''), 2500);
    return () => clearTimeout(t);
  }, [successMsg]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isAdminLogin) {
        // Admin login
        const response = await fetch('http://localhost:3005/api/admin/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Admin login failed');
        }

        const data = await response.json();
        localStorage.setItem('adminToken', data.token);
        localStorage.setItem('adminEmail', data.admin.email);
        setSuccessMsg('Admin login successful!');
        if (onAdminLogin) onAdminLogin(data.admin);
      } else {
        // Regular user login
        const result = await doSignInWithEmailAndPassword(formData.email, formData.password);
        await logAuthEvent('login', result.user);
        setSuccessMsg('Login successful!');
        if (onAuthSuccess) onAuthSuccess(result.user);
      }
    } catch (error) {
      alert(error.message);
      console.error(error);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const result = await doSignInWithGoogle();
      const user = result?.user || result;
      if (user) {
        await logAuthEvent('login', user);
        setSuccessMsg('Google login successful!');
        if (onAuthSuccess) onAuthSuccess(user);
      }
    } catch (error) {
      alert(error.message);
      console.error(error);
    }
  };

  // Removed redirect-based logging to avoid duplicate logs when using popup
  // React.useEffect(() => {
  //   const unsub = auth.onAuthStateChanged(async (user) => {
  //     if (user && user.providerData.some(p => p.providerId === 'google.com')) {
  //       await logAuthEvent('login', user);
  //     }
  //   });
  //   return () => unsub();
  // }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // scrollable outer wrapper (keeps logo fixed and allows card to scroll on small viewports)
  return (
    <div className="signup-scroll-container" style={{ position: 'relative', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '4rem 1.5rem' }}>
      {/* Top-left site title */}
      <div style={{ position: 'absolute', top: 24, left: 24, zIndex: 50 }}>
        <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, background: 'linear-gradient(90deg, #a78bfa, #f472b6)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>FindSync</h1>
      </div>

      <div style={{
        position: 'relative',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px)',
        padding: '2.5rem',
        borderRadius: '12px',
        boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        width: '100%',
        maxWidth: '400px',
        color: 'white'
      }}>
      {successMsg && (
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: 0,
            transform: 'translate(-50%, -120%)',
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.85rem 1rem',
            borderRadius: '12px',
            background: 'rgba(34, 197, 94, 0.12)',
            border: '1px solid rgba(34, 197, 94, 0.35)',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.25)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            color: '#d1fae5',
            fontWeight: 600,
            letterSpacing: '0.2px'
          }}
        >
          <span style={{
            display: 'inline-flex',
            width: 22,
            height: 22,
            borderRadius: '50%',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(34, 197, 94, 0.25)',
            border: '1px solid rgba(34, 197, 94, 0.4)',
            color: '#86efac'
          }}>✓</span>
          <span>{successMsg}</span>
          <button
            onClick={() => setSuccessMsg('')}
            aria-label="Close"
            style={{
              marginLeft: '0.5rem',
              background: 'transparent',
              border: 'none',
              color: '#a7f3d0',
              cursor: 'pointer',
              fontSize: '1rem',
              lineHeight: 1
            }}
          >
            ×
          </button>
        </div>
      )}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: '600', color: 'white', marginBottom: '0.5rem' }}>
          {isAdminLogin ? 'Admin Login' : 'Login to your account'}
        </h1>
        <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.875rem' }}>
          {isAdminLogin ? 'Enter your admin credentials' : 'Enter your email below to login to your account'}
        </p>
      </div>
      
      {/* Admin Login Toggle */}
      <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <input
          type="checkbox"
          id="adminToggle"
          checked={isAdminLogin}
          onChange={(e) => setIsAdminLogin(e.target.checked)}
          style={{ cursor: 'pointer', width: '18px', height: '18px' }}
        />
        <label htmlFor="adminToggle" style={{ color: 'rgba(255, 255, 255, 0.8)', cursor: 'pointer', fontSize: '0.875rem' }}>
          Admin Login
        </label>
      </div>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div>
          <label htmlFor="email" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500', color: '#ffffffff' }}>
            Email
          </label>
          <input
            id="email"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Your email"
            style={{ width: '100%', padding: '0.75rem', backgroundColor: 'white', border: '1px solid #D1D5DB', borderRadius: '6px', fontSize: '0.875rem', color: '#000000ff' }}
          />
        </div>
        <div style={{ position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <label htmlFor="password" style={{ fontSize: '0.875rem', fontWeight: '500', color: '#ffffffff' }}>
              Password
            </label>
            <a href="#" style={{ fontSize: '0.875rem', color: '#00ffeaff', textDecoration: 'none' }}>
              Forgot your password?
            </a>
          </div>
          <input
            id="password"
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            style={{ width: '100%', padding: '0.75rem', backgroundColor: 'white', border: '1px solid #D1D5DB', borderRadius: '6px', fontSize: '0.875rem', color: '#101010ff' }}
          />
        </div>
        <button
          type="submit"
          style={{ padding: '0.75rem', backgroundColor: '#111827', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.875rem', fontWeight: '500', width: '100%' }}
        >
          Login
        </button>
        {!isAdminLogin && (
          <>
            <button
              type="button"
              onClick={handleGoogleLogin}
              style={{ padding: '0.75rem', backgroundColor: 'white', color: '#000000ff', border: '1px solid #D1D5DB', borderRadius: '6px', cursor: 'pointer', fontSize: '0.875rem', fontWeight: '500', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
            >
              <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"/>
              </svg>
              Login with Google
            </button>
            <p style={{ textAlign: 'center', fontSize: '0.875rem', color: '#ffffffff' }}>
              Don't have an account?{' '}
              <a href="#" style={{ color: '#00fff7ff', textDecoration: 'none', fontWeight: '500' }} onClick={e => { e.preventDefault(); if (onShowSignup) onShowSignup(); }}>
                Sign up
              </a>
            </p>
          </>
        )}
      </form>
    </div>
  </div>
  );
}

export default SigninForm;
