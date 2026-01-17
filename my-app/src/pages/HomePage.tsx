import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import './HomePage.css';

export function HomePage() {
  const { user } = useAuth();

  return (
    <div className="home-page">
      <header className="home-header">
        <div className="container">
          <h1 className="logo">Job Prediction Platform</h1>
          <nav className="nav-links">
            {user ? (
              <>
                <Link to="/dashboard" className="nav-link">Dashboard</Link>
                <Link to="/profile" className="nav-link">Profile</Link>
              </>
            ) : (
              <>
                <Link to="/login" className="nav-link">Login</Link>
                <Link to="/register" className="nav-link primary">Sign Up</Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="home-main">
        <div className="container">
          <section className="hero">
            <h1 className="hero-title">Predict Your Career Path</h1>
            <p className="hero-subtitle">
              Get AI-powered job predictions based on your education and academic achievements
            </p>
            {!user && (
              <div className="hero-actions">
                <Link to="/register" className="btn btn-primary">
                  Get Started
                </Link>
                <Link to="/login" className="btn btn-secondary">
                  Sign In
                </Link>
              </div>
            )}
            {user && (
              <div className="hero-actions">
                <Link to="/dashboard" className="btn btn-primary">
                  Go to Dashboard
                </Link>
              </div>
            )}
          </section>

          <section className="features">
            <div className="feature-card">
              <div className="feature-icon">🎓</div>
              <h3>Education-Based Prediction</h3>
              <p>Get job recommendations based on your degree, field of study, GPA, and experience</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📊</div>
              <h3>Prediction History</h3>
              <p>Track all your predictions and see how your career path evolves over time</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">👤</div>
              <h3>Profile Management</h3>
              <p>Keep your academic information up to date for accurate predictions</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🔐</div>
              <h3>Secure Authentication</h3>
              <p>JWT-based security with Google OAuth integration for easy login</p>
            </div>
          </section>
        </div>
      </main>

      <footer className="home-footer">
        <div className="container">
          <p>&copy; 2025 Job Prediction Platform.</p>
        </div>
      </footer>
    </div>
  );
}













