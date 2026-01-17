import { GoogleLogin } from '@react-oauth/google';
import { LoginForm } from '../components/LoginForm';
import { useAuth } from '../auth/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import './AuthPage.css';

export function LoginPage() {
  const { googleLogin, user } = useAuth();
  const navigate = useNavigate();

  const handleGoogleSuccess = async (
    credentialResponse: { credential?: string | null }
  ) => {
    try {
      if (!credentialResponse.credential) return;

      await googleLogin(credentialResponse.credential);
     
    } catch (error) {
      console.error('Google login failed:', error);
    }
  };

  // ✅ AUTO REDIRECT WHEN USER STATE IS SET
  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  return (
    <div className="auth-page">
      <div className="auth-container">
        <h1 className="auth-title">Job Prediction Platform</h1>

        <LoginForm />

        <div className="divider">
          <span>OR</span>
        </div>

        <GoogleLogin
          onSuccess={handleGoogleSuccess}
          onError={() => console.error('Google login failed')}
          useOneTap
        />
      </div>
    </div>
  );
}
