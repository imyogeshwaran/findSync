import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";  
import { getAuth } from "firebase/auth";
import { getFirestore, collection, addDoc } from 'firebase/firestore';
import { auth} from '../firebase/firebase';
const firebaseConfig = {
  apiKey: "AIzaSyAcXQnNUvOQIv2fCjG9VWB-rCJUNGs5EHk",
  authDomain: "findsync00.firebaseapp.com",
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
export { app, analytics, auth };
