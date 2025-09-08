import React, { useState } from 'react';
import './App.css';
import { Hyperspeed } from './components/ui/hyperspeed/hyperspeed.jsx';
import SignupForm from './components/signup-form.jsx';
import SigninForm from './components/signin-form.jsx';
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect } from "firebase/auth";


const firebaseConfig = {
  apiKey: "AIzaSyAcXQnNUvOQIv2fCjG9VWB-rCJUNGs5EHk",
  authDomain: window.location.hostname === "localhost" ? "localhost:5173" : "findsync00.firebaseapp.com",
  projectId: "findsync00",
  storageBucket: "findsync00.firebasestorage.app",
  messagingSenderId: "554331399246",
  appId: "1:554331399246:web:f06bd24177f6f8dbb54f1f",
  measurementId: "G-4KPGC9BHJW"
};


const auth = getAuth();
const provider = new GoogleAuthProvider();

function googleSignUp() {
  const isLocal = window.location.hostname === "localhost";
  const signInMethod = isLocal ? signInWithPopup : signInWithRedirect;

  signInMethod(auth, provider)
    .then((result) => {
      const user = result.user;

      // Populate your signup form fields
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
  const [isLogin, setIsLogin] = useState(true); // Added isLogin state
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Form submitted', formData);
  };

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
          <SigninForm onShowSignup={() => setShowSignup(true)} />
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
          <SignupForm onShowLogin={() => setShowSignup(false)} />
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
