import { EmailAuthProvider, linkWithCredential } from 'firebase/auth';
// Link a password to a Google account after Google sign-up
export const doLinkPasswordToGoogleAccount = async (user, password) => {
    const credential = EmailAuthProvider.credential(user.email, password);
    return linkWithCredential(user, credential);
};
import { auth } from "../firebase/firebase";
import { 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    GoogleAuthProvider, 
    signInWithPopup, 
    signInWithRedirect, 
    getRedirectResult,
    sendPasswordResetEmail, 
    updatePassword, 
    sendEmailVerification, 
    getAdditionalUserInfo,
    onAuthStateChanged
} from 'firebase/auth';

import { setAuthToken } from '../services/api';

// Add debug helpers
if (typeof window !== 'undefined') {
    window.__FINDSYNC_AUTH__ = {
        auth,
        getAuthToken: async () => {
            try {
                const user = auth.currentUser;
                return user ? await user.getIdToken() : null;
            } catch (error) {
                console.error('Error getting auth token:', error);
                return null;
            }
        },
        getAuthState: () => ({
            currentUser: auth.currentUser,
            isSignedIn: !!auth.currentUser,
            authToken: localStorage.getItem('authToken')
        })
    };
    console.log('[Auth Debug] Debug helpers attached to window.__FINDSYNC_AUTH__');
}

// Initialize Google Auth Provider once
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ 
    prompt: 'select_account',
    // Add additional OAuth 2.0 scopes if needed
    // scope: 'https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile'
});

export const doCreateUserWithEmailAndPassword = async(email, password, name) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    // NOTE: removed automatic backend sync here. The signup form explicitly
    // posts the full payload (including password and mobile) to /api/auth/signup.
    // Leaving this helper returning the Firebase credential only to avoid creating
    // partial DB rows with missing fields.
    return userCredential;
};
export const doSignInWithEmailAndPassword = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
};
export const doSignInWithGoogle = async () => {
    try {
        // First check if we have a redirect result
        const redirectResult = await getRedirectResult(auth);
        if (redirectResult) {
            const user = redirectResult.user;
            const info = getAdditionalUserInfo(redirectResult);
            const isNewUser = !!(info && info.isNewUser);
            const idToken = await user.getIdToken();
            
            // Exchange Firebase token for our backend JWT
            try {
                const response = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        firebase_uid: user.uid,
                        email: user.email,
                        name: user.displayName,
                        id_token: idToken
                    })
                });
                
                if (!response.ok) {
                    throw new Error('Failed to sync with backend');
                }
                
                const data = await response.json();
                if (!data.token) {
                    throw new Error('No token received from backend');
                }
                
                localStorage.setItem('authToken', data.token);
                console.log('Redirect authentication completed successfully');
                return { user, isNewUser };
            } catch (error) {
                console.error('Error syncing with backend after redirect:', error);
                throw error;
            }
        }

        // If no redirect result, try popup first (faster user experience)
        try {
            console.log('Attempting popup sign-in...');
            const result = await signInWithPopup(auth, googleProvider);
            const user = result.user;
            const info = getAdditionalUserInfo(result);
            const isNewUser = !!(info && info.isNewUser);
            const idToken = await user.getIdToken();

            // Exchange Firebase token for our backend JWT
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    firebase_uid: user.uid,
                    email: user.email,
                    name: user.displayName,
                    id_token: idToken
                })
            });

            if (!response.ok) {
                throw new Error('Failed to sync with backend');
            }

            const data = await response.json();
            if (!data.token) {
                throw new Error('No token received from backend');
            }

            localStorage.setItem('authToken', data.token);
            console.log('Popup authentication completed successfully');
            return { user, isNewUser };
        } catch (popupError) {
            console.error('Popup sign-in failed, trying redirect...', popupError);
            // If popup fails, fall back to redirect
            await signInWithRedirect(auth, googleProvider);
            return null; // Page will redirect to Google
        }
    } catch (error) {
        console.error('Google Sign-in error:', error);
        throw error;
    }
};

export const doSignOut = async () => {
    setAuthToken(null); // Clear the token first
    return auth.signOut();
};

// Initialize auth state listener
onAuthStateChanged(auth, async (user) => {
    console.log('[Auth Debug] Auth state changed:', { 
        user: user ? { 
            uid: user.uid, 
            email: user.email, 
            displayName: user.displayName 
        } : null 
    });

    if (user) {
        try {
            // Get the ID token
            const idToken = await user.getIdToken();
            console.log('[Auth Debug] Got Firebase ID token');
            
            // Exchange it for our JWT
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    firebase_uid: user.uid,
                    email: user.email,
                    name: user.displayName,
                    id_token: idToken
                })
            });

            if (!response.ok) {
                throw new Error('Failed to get JWT token');
            }

            const data = await response.json();
            if (data.token) {
                setAuthToken(data.token);
                console.log('[Auth Debug] JWT token exchange successful:', {
                    tokenLength: data.token.length,
                    storage: !!localStorage.getItem('authToken')
                });
            }
        } catch (error) {
            console.error('[Auth Debug] Token exchange failed:', error);
            setAuthToken(null);
        }
    } else {
        setAuthToken(null);
        console.log('[Auth Debug] User signed out, cleared token and storage');
    }
});
export const doPasswordReset = (email) => {
    return sendPasswordResetEmail(auth, email);
};
export const doPasswordChange = (password) => {
    return updatePassword(auth.currentUser, password);
};

export const doSendEmailVerification = () => {
    return sendEmailVerification(auth.currentUser, { url: `${window.location.origin}/home` });
};