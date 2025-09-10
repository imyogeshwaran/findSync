import React, { useState, useEffect } from 'react';
import './App.css';
import { Hyperspeed } from './components/ui/hyperspeed/hyperspeed.jsx';
import SignupForm from './components/signup-form.jsx';
import SigninForm from './components/signin-form.jsx';
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, onAuthStateChanged } from "firebase/auth";
import { auth } from './firebase/firebase';
import Prism from './components/Prism.jsx';

const firebaseConfig = {
  apiKey: "AIzaSyAcXQnNUvOQIv2fCjG9VWB-rCJUNGs5EHk",
  authDomain: window.location.hostname === "localhost" ? "localhost:5173" : "findsync00.firebaseapp.com",
  projectId: "findsync00",
  storageBucket: "findsync00.firebasestorage.app",
  messagingSenderId: "554331399246",
  appId: "1:554331399246:web:f06bd24177f6f8dbb54f1f",
  measurementId: "G-4KPGC9BHJW"
};

function Home() {
  return (
    <div style={{ background: '#ffffff', minHeight: '100vh', color: '#111' }}>
      <header style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        background: 'transparent',
        borderBottom: 'none',
        zIndex: 10
      }}>
        <nav style={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: '0.85rem 1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{
            fontFamily: '"Bodoni Moda", serif',
            fontWeight: 700,
            fontSize: '1.25rem',
            letterSpacing: '0.2px',
            color: '#ffffff',
            textShadow: '0 2px 8px rgba(0,0,0,0.35)'
          }}>
            Find Sync
          </div>
          <ul style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', listStyle: 'none' }}>
            <li><a href="#" style={{ color: '#ffffff', textDecoration: 'none', fontWeight: 500, textShadow: '0 2px 8px rgba(0,0,0,0.35)' }}>Home</a></li>
            <li><a href="#" style={{ color: '#ffffff', textDecoration: 'none', fontWeight: 500, textShadow: '0 2px 8px rgba(0,0,0,0.35)' }}>Explore</a></li>
            <li><a href="#" style={{ color: '#ffffff', textDecoration: 'none', fontWeight: 500, textShadow: '0 2px 8px rgba(0,0,0,0.35)' }}>Find My Product</a></li>
            <li><a href="#" style={{ color: '#ffffff', textDecoration: 'none', fontWeight: 500, textShadow: '0 2px 8px rgba(0,0,0,0.35)' }}>My Account</a></li>
          </ul>
        </nav>
      </header>
      {/* Hero section with Prism background effect (Home page only) */}
      <section style={{ width: '100%', height: '600px', position: 'relative' }}>
        <Prism
          animationType="rotate"
          timeScale={0.5}
          height={3.5}
          baseWidth={5.5}
          scale={3.6}
          hueShift={0}
          colorFrequency={1}
          noise={0.5}
          glow={1}
        />
      </section>
      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '2rem 1rem' }}>
        <h1 style={{ fontFamily: '"Bodoni Moda", serif', fontSize: '2rem', fontWeight: 600, marginBottom: '0.5rem' }}>Welcome to Find Sync</h1>
        <p style={{ color: '#4b5563' }}>Start exploring your products and account using the navigation above.</p>
      </main>
    </div>
  );
}

const provider = new GoogleAuthProvider();

function googleSignUp() {
  const authInst = getAuth();
  const isLocal = window.location.hostname === "localhost";
  const signInMethod = isLocal ? signInWithPopup : signInWithRedirect;

  signInMethod(authInst, provider)
    .then((result) => {
      const user = result.user;

      document.getElementById("nameField").value = user.displayName;
      document.getElementById("emailField").value = user.email;

      console.log("User signed in:", user.displayName, user.email);
    })
    .catch((error) => {
      console.error("Error during sign-in:", error.message);
    });
}

function App() {
  const [showSignup, setShowSignup] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u ?? null);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    document.body.style.background = user ? '#ffffff' : '#000000';
  }, [user]);

  const handleAuthSuccess = (u) => {
    setUser(u);
    setShowSignup(false);
  };

  if (user) {
    return <Home />;
  }

  return (
    <>
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0
      }}>
        <Hyperspeed
          effectOptions={{
            distortion: 'turbulentDistortion',
            length: 400,
            roadWidth: 10,
            islandWidth: 2,
            lanesPerRoad: 4,
            fov: 90,
            fovSpeedUp: 150,
            speedUp: 2,
            carLightsFade: 0.4,
            totalSideLightSticks: 20,
            lightPairsPerRoadWay: 40,
            shoulderLinesWidthPercentage: 0.05,
            brokenLinesWidthPercentage: 0.1,
            brokenLinesLengthPercentage: 0.5,
            lightStickWidth: [0.12, 0.5],
            lightStickHeight: [1.3, 1.7],
            movingAwaySpeed: [60, 80],
            movingCloserSpeed: [-120, -160],
            carLightsLength: [400 * 0.03, 400 * 0.2],
            carLightsRadius: [0.05, 0.14],
            carWidthPercentage: [0.3, 0.5],
            carShiftX: [-0.8, 0.8],
            carFloorSeparation: [0, 5],
            colors: {
              roadColor: 0x080808,
              islandColor: 0x0a0a0a,
              background: 0x000000,
              shoulderLines: 0xFFFFFF,
              brokenLines: 0xFFFFFF,
              leftCars: [0xD856BF, 0x6750A2, 0xC247AC],
              rightCars: [0x03B3C3, 0x0E5EA5, 0x324555],
              sticks: 0x03B3C3
            }
          }}
        />
      </div>
      {!showSignup ? (
        <div style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 1,
        }}>
          <SigninForm onShowSignup={() => setShowSignup(true)} onAuthSuccess={handleAuthSuccess} />
        </div>
      ) : (
        <div style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 1,
          width: '400px',
        }}>
          <SignupForm onShowLogin={() => setShowSignup(false)} onAuthSuccess={handleAuthSuccess} />
          <div style={{ marginTop: '1rem', textAlign: 'center' }}>
            <a
              href="#"
              style={{ color: 'white', fontWeight: '500' }}
              onClick={e => {
                e.preventDefault();
                setShowSignup(false);
              }}
            >
              Back to Login
            </a>
          </div>
        </div>
      )}
    </>
  );
}

export default App
