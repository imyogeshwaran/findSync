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

function SigninForm({ onShowSignup }) {
  const [formData, setFormData] = React.useState({ email: '', password: '' });
  const [successMsg, setSuccessMsg] = React.useState('');


  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const result = await doSignInWithEmailAndPassword(formData.email, formData.password);
      await logAuthEvent('login', result.user);
      setSuccessMsg('Login successful!');
      // Redirect or update UI as needed
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

  return (
    <div style={{
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      backdropFilter: 'blur(10px)',
      padding: '2.5rem',
      borderRadius: '12px',
      boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      width: '400px',
      color: 'white',
      position: 'relative'
    }}>
      {successMsg && (
        <div style={{ background: '#22c55e', color: 'white', padding: '0.75rem', borderRadius: '6px', marginBottom: '1rem', textAlign: 'center', position: 'relative' }}>
          {successMsg}
          <button onClick={() => setSuccessMsg('')} style={{ position: 'absolute', right: 10, top: 5, background: 'none', border: 'none', color: 'white', fontWeight: 'bold', fontSize: '1.2rem', cursor: 'pointer' }}>&times;</button>
        </div>
      )}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: '600', color: 'white', marginBottom: '0.5rem' }}>
          Login to your account
        </h1>
        <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.875rem' }}>
          Enter your email below to login to your account
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
            placeholder="xyz@example.com"
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
      </form>
    </div>
  );
}

export default SigninForm;
