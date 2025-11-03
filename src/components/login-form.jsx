import { useState } from 'react';
import { cn } from '../lib/utils';
import { Button } from '../components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect } from 'firebase/auth';
import GoogleAuthModal from './GoogleAuthModal';

const auth = getAuth();
const provider = new GoogleAuthProvider();

export function LoginForm({
  className,
  ...props
}) {
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [googleUser, setGoogleUser] = useState(null);

  const handleGoogleAuth = async () => {
    try {
      const isLocal = window.location.hostname === 'localhost';
      const signInMethod = isLocal ? signInWithPopup : signInWithRedirect;
      const result = await signInMethod(auth, provider);
      const user = result.user;
      
      // Store Google user data temporarily
      setGoogleUser(user);
      // Show modal to collect phone and password
      setShowGoogleModal(true);
    } catch (error) {
      console.error('Error during Google sign-in:', error);
      alert('Failed to sign in with Google: ' + error.message);
    }
  };

  const handleGoogleModalSubmit = async (additionalData) => {
    try {
      const { phone, password } = additionalData;
      
      // Send all user data to backend
      const response = await fetch('/api/auth/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firebase_uid: googleUser.uid,
          name: googleUser.displayName,
          email: googleUser.email,
          phone,
          password,
          isGoogleAuth: true
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to sync user data');
      }

      // Close modal and proceed with login
      setShowGoogleModal(false);
      // Handle successful login (redirect or update UI)
      window.location.href = '/home';
    } catch (error) {
      console.error('Error completing Google signup:', error);
      alert('Failed to complete signup: ' + error.message);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    try {
      const formData = new FormData(event.target);
      const email = formData.get('email');
      const password = formData.get('password');
      const phone = formData.get('phone');

      // Validate inputs
      if (!email || !password || !phone) {
        alert('Please fill in all fields');
        return;
      }

      // Send login request to backend
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          phone
        }),
      });

      if (!response.ok) {
        throw new Error('Login failed');
      }

      const data = await response.json();
      
      // Store the token
      localStorage.setItem('token', data.token);
      
      // Redirect to home page
      window.location.href = '/home';
    } catch (error) {
      console.error('Login error:', error);
      alert('Login failed: ' + error.message);
    }
  };

  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle>Login to your account</CardTitle>
          <CardDescription>
            Enter your email below to login to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-3">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="m@example.com"
                  autoComplete="email"
                  required
                />
              </div>
              <div className="grid gap-3">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="Your phone number"
                  autoComplete="tel"
                  required
                />
              </div>
              <div className="grid gap-3">
                <div className="flex items-center">
                  <Label htmlFor="password">Password</Label>
                  <a
                    href="/forgot-password"
                    className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                  >
                    Forgot your password?
                  </a>
                </div>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autocomplete="current-password"
                  required
                />
              </div>
              <div className="flex flex-col gap-3">
                <Button type="submit" className="w-full">
                  Login
                </Button>
                <Button variant="outline" className="w-full" onClick={handleGoogleAuth}>
                  Login with Google
                </Button>
              </div>

              {/* Google Auth Modal */}
              {showGoogleModal && (
                <GoogleAuthModal
                  isOpen={showGoogleModal}
                  onClose={() => setShowGoogleModal(false)}
                  onSubmit={handleGoogleModalSubmit}
                />
              )}
            </div>
            <div className="mt-4 text-center text-sm">
              Don&apos;t have an account?{' '}
              <a href="/signup" className="underline underline-offset-4">
                Sign up
              </a>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
export default LoginForm;