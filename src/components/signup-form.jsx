import React, { useState, useEffect } from 'react';
import { doCreateUserWithEmailAndPassword, doSignInWithGoogle, doLinkPasswordToGoogleAccount } from '../firebase/auth';
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

function SignupForm({ onShowLogin, onAuthSuccess }) {
  const [formData, setFormData] = useState({ name: '', email: '', password: '', phone: '', mobile: '' });
  const [showPasswordSetup, setShowPasswordSetup] = useState(false);
  const [pwForm, setPwForm] = useState({ password: '', confirm: '', phone: '', mobile: '' });
  const [googleUser, setGoogleUser] = useState(null);
  const [statusMsg, setStatusMsg] = useState('');
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!statusMsg) return;
    const t = setTimeout(() => setStatusMsg(''), 2500);
    return () => clearTimeout(t);
  }, [statusMsg]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Validate required fields
      const newErrors = {};
      if (!formData.phone) {
        newErrors.phone = 'Please enter a phone number';
      }
      if (!formData.mobile) {
        newErrors.mobile = 'Please enter a mobile number';
      }
      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }

      // Create user in Firebase
      const cred = await doCreateUserWithEmailAndPassword(formData.email, formData.password);
      console.log('Firebase user created:', cred.user.uid);
      
      try {
        await logAuthEvent('signup', cred.user);
        
        // Sync user data to SQL database
        const response = await fetch('/api/auth/sync', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            firebase_uid: cred.user.uid,
            name: formData.name,
            email: formData.email,
            password: formData.password, // Note: This is only for SQL auth
            phone: formData.phone,
            mobile: formData.mobile,
            isGoogleAuth: false
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to sync user data with database');
        }

        const data = await response.json();
        console.log('User synced successfully:', data);
        
        if (!data.token) {
          throw new Error('No token received from server');
        }
        
        // Store the token from backend
        localStorage.setItem('token', data.token);
      } catch (error) {
        console.error('Error during user sync:', error);
        throw new Error('Failed to complete signup: ' + error.message);
      }

      setStatusMsg('Account created successfully!');
      if (onAuthSuccess) onAuthSuccess(cred.user);
      if (onShowLogin) onShowLogin();
    } catch (error) {
      alert(error.message);
      console.error('Signup error:', error);
    }
  };

  const handleGoogleSignup = async () => {
    try {
      const result = await doSignInWithGoogle();
      const user = result?.user || result; // backward compatibility if function returns user directly
      const isNewUser = result?.isNewUser ?? true; // assume new if not provided

      if (user) {
        await logAuthEvent('signup', user);
        if (isNewUser) {
          // Store Google user info and show password/phone setup
          setGoogleUser(user);
          setShowPasswordSetup(true);
          setStatusMsg('Almost done! Please set up your password and phone number.');
        } else {
          // Check if user exists in SQL database
          try {
            const response = await fetch('/api/auth/sync', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                firebase_uid: user.uid,
                name: user.displayName,
                email: user.email,
                isGoogleAuth: true
              }),
            });

            if (!response.ok) {
              throw new Error('Failed to sync user data');
            }

            const data = await response.json();
            localStorage.setItem('token', data.token);
          } catch (syncError) {
            console.error('Error syncing user:', syncError);
            // Continue with Firebase auth even if sync fails
          }

          setStatusMsg('Logged in with Google.');
          if (onAuthSuccess) onAuthSuccess(user);
          if (onShowLogin) onShowLogin();
        }
      }
    } catch (error) {
      alert(error.message);
      console.error(error);
    }
  };

  const handleLinkPassword = async (e) => {
    e.preventDefault();
    if (!googleUser) return;
    
    if (!pwForm.password || pwForm.password.length < 6) {
      alert('Password must be at least 6 characters.');
      return;
    }
    if (pwForm.password !== pwForm.confirm) {
      alert('Passwords do not match.');
      return;
    }
    if (!pwForm.phone) {
      alert('Please enter your phone number.');
      return;
    }

    try {
      // Link password to Google account
      await doLinkPasswordToGoogleAccount(googleUser, pwForm.password);

      // Sync user data with SQL database
      const response = await fetch('/api/auth/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firebase_uid: googleUser.uid,
          name: googleUser.displayName,
          email: googleUser.email,
          password: pwForm.password,
          phone: pwForm.phone,
          isGoogleAuth: true
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to sync user data with database');
      }

      const data = await response.json();
      localStorage.setItem('token', data.token);

      setStatusMsg('Account setup completed successfully!');
      setShowPasswordSetup(false);
      if (onAuthSuccess) onAuthSuccess(googleUser);
      if (onShowLogin) onShowLogin();
    } catch (error) {
      alert(error.message);
      console.error(error);
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      {statusMsg && (
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
          <span>{statusMsg}</span>
          <button
            onClick={() => setStatusMsg('')}
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
      <div style={{ background: 'rgba(0,0,0,0.5)', padding: '2rem', borderRadius: '12px', color: 'white', width: '100%', position: 'relative' }}>
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label htmlFor="phone">Phone Number</label>
              <input 
                id="phone" 
                name="phone" 
                type="tel" 
                placeholder="Enter your phone number" 
                required 
                style={{ 
                  padding: '0.75rem', 
                  borderRadius: '6px', 
                  border: errors.phone ? '1px solid #ef4444' : '1px solid #ccc' 
                }} 
                value={formData.phone} 
                onChange={handleChange} 
              />
              {errors.phone && <span style={{ color: '#ef4444', fontSize: '0.875rem' }}>{errors.phone}</span>}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label htmlFor="mobile">Mobile Number</label>
              <input 
                id="mobile" 
                name="mobile" 
                type="tel" 
                placeholder="Enter your mobile number" 
                required 
                style={{ 
                  padding: '0.75rem', 
                  borderRadius: '6px', 
                  border: errors.mobile ? '1px solid #ef4444' : '1px solid #ccc' 
                }} 
                value={formData.mobile} 
                onChange={handleChange} 
              />
              {errors.mobile && <span style={{ color: '#ef4444', fontSize: '0.875rem' }}>{errors.mobile}</span>}
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

        {showPasswordSetup && (
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            padding: '1.5rem',
            borderRadius: '12px',
            boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            color: 'white',
            marginTop: '1rem'
          }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.75rem' }}>Set a password for email login</h3>
            <form onSubmit={handleLinkPassword} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label htmlFor="newPassword">Password</label>
                <input id="newPassword" name="newPassword" type="password" required style={{ padding: '0.75rem', borderRadius: '6px', border: '1px solid #D1D5DB', color: '#101010' }} value={pwForm.password} onChange={(e) => setPwForm({ ...pwForm, password: e.target.value })} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label htmlFor="confirmPassword">Confirm Password</label>
                <input id="confirmPassword" name="confirmPassword" type="password" required style={{ padding: '0.75rem', borderRadius: '6px', border: '1px solid #D1D5DB', color: '#101010' }} value={pwForm.confirm} onChange={(e) => setPwForm({ ...pwForm, confirm: e.target.value })} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label htmlFor="phone">Phone Number</label>
                <input id="phone" name="phone" type="tel" placeholder="Enter your phone number" required style={{ padding: '0.75rem', borderRadius: '6px', border: '1px solid #D1D5DB', color: '#101010' }} value={pwForm.phone} onChange={(e) => setPwForm({ ...pwForm, phone: e.target.value })} />
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button type="submit" style={{ padding: '0.75rem', backgroundColor: '#111827', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.875rem', fontWeight: '500', flex: 1 }}>Save password</button>
                <button type="button" onClick={() => setShowPasswordSetup(false)} style={{ padding: '0.75rem', backgroundColor: 'transparent', color: 'white', border: '1px solid #D1D5DB', borderRadius: '6px', cursor: 'pointer', fontSize: '0.875rem', fontWeight: '500' }}>Cancel</button>
              </div>
            </form>
          </div>
        )}

        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.95rem' }}>
          Already have an account?{' '}
          <a href="#" style={{ color: '#61dafb', textDecoration: 'underline' }} onClick={e => { e.preventDefault(); if (onShowLogin) onShowLogin(); }}>
            Login
          </a>
        </div>
      </div>
    </div>
  );
}

export default SignupForm;
