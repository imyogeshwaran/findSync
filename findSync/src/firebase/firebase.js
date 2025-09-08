import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAcXQnNUvOQIv2fCjG9VWB-rCJUNGs5EHk",
  authDomain: window.location.hostname === "localhost" ? "localhost" : "findsync00.firebaseapp.com",
  projectId: "findsync00",
  storageBucket: "findsync00.firebasestorage.app",
  messagingSenderId: "554331399246",
  appId: "1:554331399246:web:f06bd24177f6f8dbb54f1f",
  measurementId: "G-4KPGC9BHJW"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
export {app, analytics, auth};