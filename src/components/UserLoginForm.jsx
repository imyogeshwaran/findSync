import React from 'react';
import { doSignInWithEmailAndPassword, doSignInWithGoogle } from '../firebase/auth';
import { auth } from '../firebase/firebase';
import { getFirestore, collection, addDoc } from 'firebase/firestore';

const db = getFirestore();

async function logAuthEvent(type, user) {
  await addDoc(collection(db, 'authEvents'), {
    uid: user.uid,
    email: user.email,
    type,
    timestamp: new Date()
  });
}

function UserLoginForm({ onShowSignup, onAuthSuccess }) {
  const [formData, setFormData] = React.useState({ email: '', password: '' });
  const [successMsg, setSuccessMsg] = React.useState('');
  const [errorMsg, setErrorMsg] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    if (!successMsg) return;
    const t = setTimeout(() => setSuccessMsg(''), 2500);
    return () => clearTimeout(t);
  }, [successMsg]);

  React.useEffect(() => {
    if (!errorMsg) return;
    const t = setTimeout(() => setErrorMsg(''), 3500);
    return () => clearTimeout(t);
  }, [errorMsg]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

    try {
      // User login with email/password
      const result = await doSignInWithEmailAndPassword(formData.email, formData.password);
      await logAuthEvent('login', result.user);
      setSuccessMsg('Login successful!');
      if (onAuthSuccess) onAuthSuccess(result.user);
    } catch (error) {
      console.error('User login error:', error);
      setErrorMsg(error.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setErrorMsg('');

    try {
      const result = await doSignInWithGoogle();
      const user = result?.user || result;
      if (user) {
        await logAuthEvent('login', user);
        setSuccessMsg('Google login successful!');
        if (onAuthSuccess) onAuthSuccess(user);
      }
    } catch (error) {
      console.error('Google login error:', error);
      setErrorMsg(error.message || 'Google login failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

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

        {errorMsg && (
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
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.25)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              color: '#fecaca',
              fontWeight: 600,
              letterSpacing: '0.2px',
              fontSize: '0.875rem'
            }}
          >
            <span style={{
              display: 'inline-flex',
              width: 22,
              height: 22,
              borderRadius: '50%',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(239, 68, 68, 0.25)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              color: '#fca5a5'
            }}>!</span>
            <span>{errorMsg}</span>
          </div>
        )}

        <div style={{ marginBottom: '1.5rem' }}>
          <h1 style={{ fontSize: '1.875rem', fontWeight: '600', color: 'white', marginBottom: '0.5rem' }}>
            Login to your account
          </h1>
          <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.875rem', margin: 0 }}>
            Enter your email below to login
          </p>
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
              placeholder="your.email@example.com"
              required
              disabled={isLoading}
              style={{ width: '100%', padding: '0.75rem', backgroundColor: 'white', border: '1px solid #D1D5DB', borderRadius: '6px', fontSize: '0.875rem', color: '#000000ff', opacity: isLoading ? 0.6 : 1, cursor: isLoading ? 'not-allowed' : 'auto' }}
            />
          </div>

          <div style={{ position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <label htmlFor="password" style={{ fontSize: '0.875rem', fontWeight: '500', color: '#ffffffff' }}>
                Password
              </label>
              <a href="/forgot-password" style={{ fontSize: '0.875rem', color: '#00ffeaff', textDecoration: 'none' }}>
                Forgot password?
              </a>
            </div>
            <input
              id="password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              required
              disabled={isLoading}
              style={{ width: '100%', padding: '0.75rem', backgroundColor: 'white', border: '1px solid #D1D5DB', borderRadius: '6px', fontSize: '0.875rem', color: '#101010ff', opacity: isLoading ? 0.6 : 1, cursor: isLoading ? 'not-allowed' : 'auto' }}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            style={{ padding: '0.75rem', backgroundColor: isLoading ? '#6b7280' : '#111827', color: 'white', border: 'none', borderRadius: '6px', cursor: isLoading ? 'not-allowed' : 'pointer', fontSize: '0.875rem', fontWeight: '500', width: '100%', transition: 'background-color 0.2s' }}
          >
            {isLoading ? 'Signing in...' : 'Login'}
          </button>

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isLoading}
            style={{ padding: '0.75rem', backgroundColor: 'white', color: '#000000ff', border: '1px solid #D1D5DB', borderRadius: '6px', cursor: isLoading ? 'not-allowed' : 'pointer', fontSize: '0.875rem', fontWeight: '500', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', opacity: isLoading ? 0.6 : 1 }}
          >
            <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"/>
            </svg>
            {isLoading ? 'Signing in...' : 'Login with Google'}
          </button>

          <p style={{ textAlign: 'center', fontSize: '0.875rem', color: '#ffffffff', margin: 0 }}>
            Don't have an account?{' '}
            <a href="#" style={{ color: '#00fff7ff', textDecoration: 'none', fontWeight: '500' }} onClick={e => { e.preventDefault(); if (onShowSignup) onShowSignup(); }}>
              Sign up
            </a>
          </p>

          <div style={{ paddingTop: '0.5rem', borderTop: '1px solid rgba(255, 255, 255, 0.2)' }}>
            <p style={{ textAlign: 'center', fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.6)', margin: 0 }}>
              Are you an admin? <a href="/admin/login" style={{ color: '#00fff7ff', textDecoration: 'none', fontWeight: '500' }}>Go to admin login</a>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

export default UserLoginForm;
