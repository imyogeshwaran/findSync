

import React, { useState } from 'react';
import { doCreateUserWithEmailAndPassword, doSignInWithGoogle } from '../firebase/auth';


function SignupForm({ onShowLogin }) {
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await doCreateUserWithEmailAndPassword(formData.email, formData.password);
      alert('Sign up successful!');
      if (onShowLogin) onShowLogin();
    } catch (error) {
      alert(error.message);
      console.error(error);
    }
  };

  const handleGoogleSignup = async () => {
    try {
      await doSignInWithGoogle();
    } catch (error) {
      alert(error.message);
      console.error(error);
    }
  };

  return (
    <div style={{ background: 'rgba(0,0,0,0.5)', padding: '2rem', borderRadius: '12px', color: 'white', width: '100%' }}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Create your account</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label htmlFor="name">Name</label>
            <input id="name" name="name" type="text" placeholder="Your Name" required style={{ padding: '0.75rem', borderRadius: '6px', border: '1px solid #ccc' }} value={formData.name} onChange={handleChange} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label htmlFor="email">Email</label>
            <input id="email" name="email" type="email" placeholder="m@example.com" required style={{ padding: '0.75rem', borderRadius: '6px', border: '1px solid #ccc' }} value={formData.email} onChange={handleChange} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label htmlFor="password">Password</label>
            <input id="password" name="password" type="password" required style={{ padding: '0.75rem', borderRadius: '6px', border: '1px solid #ccc' }} value={formData.password} onChange={handleChange} />
          </div>
          <button type="submit" style={{ padding: '0.75rem', borderRadius: '6px', background: '#222', color: 'white', fontWeight: 'bold', border: 'none', marginTop: '0.5rem' }}>Sign up</button>
        </div>
      </form>
      <div style={{ display: 'flex', alignItems: 'center', margin: '1.5rem 0' }}>
        <div style={{ flex: 1, height: 1, background: '#ccc' }} />
        <span style={{ margin: '0 1rem', color: '#ccc', fontWeight: 'bold' }}>or</span>
        <div style={{ flex: 1, height: 1, background: '#ccc' }} />
      </div>
      <button type="button" onClick={handleGoogleSignup} style={{ padding: '0.75rem', borderRadius: '6px', background: 'white', color: '#222', fontWeight: 'bold', border: '1px solid #ccc', width: '100%' }}>Sign up with Google</button>
      <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.95rem' }}>
        Already have an account?{' '}
        <a href="#" style={{ color: '#61dafb', textDecoration: 'underline' }} onClick={e => { e.preventDefault(); if (onShowLogin) onShowLogin(); }}>
          Login
        </a>
      </div>
    </div>
  );
}

export default SignupForm;
