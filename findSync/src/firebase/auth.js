import { EmailAuthProvider, linkWithCredential } from 'firebase/auth';
// Link a password to a Google account after Google sign-up
export const doLinkPasswordToGoogleAccount = async (user, password) => {
    const credential = EmailAuthProvider.credential(user.email, password);
    return linkWithCredential(user, credential);
};
import { auth } from "../firebase/firebase";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, sendPasswordResetEmail, updatePassword, sendEmailVerification, getAdditionalUserInfo } from 'firebase/auth';

export const doCreateUserWithEmailAndPassword = async(email, password, name) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    // Call the backend API to sync user data
    try {
        const response = await fetch('/api/users/sync', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                firebase_uid: userCredential.user.uid,
                email: email,
                name: name
            }),
        });
        if (!response.ok) {
            throw new Error('Failed to sync user data');
        }
    } catch (error) {
        console.error('Error syncing user data:', error);
    }
    return userCredential;
};
export const doSignInWithEmailAndPassword = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
};
export const doSignInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        const info = getAdditionalUserInfo(result);
        const isNewUser = !!(info && info.isNewUser);
        console.log('Google sign-in successful:', user.displayName, user.email, 'isNewUser:', isNewUser);
        return { user, isNewUser };
    } catch (error) {
        console.error('Error during Google sign-in:', error.code, error.message, error.customData);
        throw error;
    }
};

export const doSignOut = () => {
    return auth.signOut();
};
export const doPasswordReset = (email) => {
    return sendPasswordResetEmail(auth, email);
};
export const doPasswordChange = (password) => {
    return updatePassword(auth.currentUser, password);
};

export const doSendEmailVerification = () => {
    return sendEmailVerification(auth.currentUser, { url: `${window.location.origin}/home` });
};