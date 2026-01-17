import React, { useState, useEffect } from 'react';
import './App.css';
import { Hyperspeed } from './components/ui/hyperspeed/hyperspeed.jsx';
import SignupForm from './components/signup-form.jsx';
import UserLoginForm from './components/UserLoginForm.jsx';
import AdminLoginForm from './components/AdminLoginForm.jsx';
import AdminDashboard from './components/AdminDashboard.jsx';
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, onAuthStateChanged } from "firebase/auth";
import { auth } from './firebase/firebase';
// Threads is used on Home page only

import Home from './components/Home.jsx';

const firebaseConfig = {
  apiKey: "AIzaSyAcXQnNUvOQIv2fCjG9VWB-rCJUNGs5EHk",
  authDomain: window.location.hostname === "localhost" ? "localhost:5173" : "findsync00.firebaseapp.com",
  projectId: "findsync00",
  storageBucket: "findsync00.firebasestorage.app",
  messagingSenderId: "554331399246",
  appId: "1:554331399246:web:f06bd24177f6f8dbb54f1f",
  measurementId: "G-4KPGC9BHJW"
};



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
  const [adminUser, setAdminUser] = useState(null);
  const [currentPage, setCurrentPage] = useState(window.location.pathname === '/admin/login' ? 'adminLogin' : 'userLogin');

  useEffect(() => {
    // Listen for URL changes and update current page
    const handlePopState = () => {
      const path = window.location.pathname;
      if (path === '/admin/login') {
        setCurrentPage('adminLogin');
      } else if (path === '/login' || path === '/') {
        setCurrentPage('userLogin');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u ?? null);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    // Check if admin is logged in
    const adminToken = localStorage.getItem('adminToken');
    if (adminToken) {
      setAdminUser({ token: adminToken });
    }
  }, []);

  useEffect(() => {
    document.body.style.background = user || adminUser ? '#ffffff' : '#000000';
  }, [user, adminUser]);

  const handleAuthSuccess = (u) => {
    setUser(u);
    setShowSignup(false);
    window.history.pushState({}, '', '/');
  };

  const handleAdminLogin = (admin, token) => {
    setAdminUser(admin);
    window.history.pushState({}, '', '/admin/dashboard');
  };

  const handleAdminLogout = () => {
    setAdminUser(null);
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminEmail');
    localStorage.removeItem('adminId');
    localStorage.removeItem('userRole');
    window.history.pushState({}, '', '/admin/login');
    setCurrentPage('adminLogin');
  };

  // Admin dashboard
  if (adminUser) {
    return <AdminDashboard onLogout={handleAdminLogout} />;
  }

  // User home page
  if (user) {
    return <Home />;
  }

  // Signup page
  if (showSignup) {
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
                window.history.pushState({}, '', '/login');
                setCurrentPage('userLogin');
              }}
            >
              Back to Login
            </a>
          </div>
        </div>
      </>
    );
  }

  // Admin login page
  if (currentPage === 'adminLogin') {
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
        <div style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 1,
        }}>
          <AdminLoginForm onAdminLogin={handleAdminLogin} />
        </div>
      </>
    );
  }

  // Default user login page
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
      <div style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 1,
      }}>
        <UserLoginForm 
          onShowSignup={() => {
            setShowSignup(true);
            window.history.pushState({}, '', '/signup');
          }} 
          onAuthSuccess={handleAuthSuccess}
        />
      </div>
    </>
  );
}

export default App
