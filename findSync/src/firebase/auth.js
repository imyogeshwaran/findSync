import { EmailAuthProvider, linkWithCredential } from 'firebase/auth';
// Link a password to a Google account after Google sign-up
export const doLinkPasswordToGoogleAccount = async (user, password) => {
    const credential = EmailAuthProvider.credential(user.email, password);
    return linkWithCredential(user, credential);
};
import { auth } from "../firebase/firebase";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithRedirect, sendPasswordResetEmail, updatePassword, sendEmailVerification, getRedirectResult } from 'firebase/auth';

export const doCreateUserWithEmailAndPassword = async(email, password) => {
    return createUserWithEmailAndPassword(auth, email, password);
};
export const doSignInWithEmailAndPassword = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
};
export const doSignInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
        // Start the sign-in process
        await signInWithRedirect(auth, provider);

        // Handle the redirect result
        const result = await getRedirectResult(auth);
        if (result) {
            const user = result.user;
            console.log('Google sign-in successful:', user.displayName, user.email);
            return user;
        } else {
            console.log('No redirect result available.');
        }
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