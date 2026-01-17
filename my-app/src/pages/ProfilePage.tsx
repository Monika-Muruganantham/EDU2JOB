import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { ProfileForm } from '../components/ProfileForm';
import './ProfilePage.css';

export function ProfilePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    return null;
  }

  return (
    <div className="profile-page">
      {/* Header */}
      <header className="profile-header">
        <div>
          <h1>Profile Management</h1>
          <p>Update your academic information & certifications</p>
        </div>

        <div className="header-actions">
          <button
            onClick={() => navigate('/dashboard')}
            className="secondary-button"
          >
            Back to Dashboard
          </button>

          <button onClick={logout} className="secondary-button">
            Logout
          </button>
        </div>
      </header>

      {/* Content */}
      <div className="profile-content">
        {/* User Info */}
        <div className="profile-info">
          <div className="user-card">
            {user.picture && (
              <img
                src={user.picture}
                alt={user.name}
                className="user-avatar"
              />
            )}
            <h2>{user.name}</h2>
            <p>{user.email}</p>
          </div>
        </div>

        {/* Forms */}
        <div className="profile-form-container">
          {/* Academic Profile */}
          <ProfileForm
            initialProfile={user.profile}
            onSave={() => {
              // profile saved
            }}
          />

        </div>
      </div>
    </div>
  );
}
