import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import type { UserProfile } from '../types';
import { api } from '../api';
import { useAuth } from '../auth/AuthContext';
import './ProfileForm.css';

interface ProfileFormProps {
  initialProfile: UserProfile | null;
  onSave?: () => void;
}

export function ProfileForm({ initialProfile, onSave }: ProfileFormProps) {
  const { updateUser } = useAuth();

  // ---------------- PROFILE STATE ----------------
  const [profile, setProfile] = useState<UserProfile>({
    degree: '',
    specialization: '',
    cgpa: 0,
    graduation_year: 0,
    university: '',
    skills: [],
    ...initialProfile,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [skillInput, setSkillInput] = useState('');

  // ---------------- CERTIFICATE STATE ----------------
  const [certTitle, setCertTitle] = useState('');
  const [issuedBy, setIssuedBy] = useState('');
  const [certificateFile, setCertificateFile] = useState<File | null>(null);
  const [certLoading, setCertLoading] = useState(false);
  const [certError, setCertError] = useState('');
  const [certSuccess, setCertSuccess] = useState(false);
  const [year] = useState<number | ''>('');

  // ---------------- LOAD PROFILE ----------------
  useEffect(() => {
    if (initialProfile) {
      setProfile({
        degree: initialProfile.degree || '',
        specialization: initialProfile.specialization || '',
        cgpa: initialProfile.cgpa || 0,
        graduation_year: initialProfile.graduation_year || 0,
        university: initialProfile.university || '',
        skills: initialProfile.skills || [],
      });
    }
  }, [initialProfile]);

  // ---------------- VALIDATION ----------------
  const validateEducation = () => {
    const degrees = ['B.Tech', 'B.Sc', 'M.Sc', 'MCA', 'MBA'];
    const specs = ['CSE', 'ECE', 'IT', 'Data Science', 'AI', 'Mechanical'];

    if (!degrees.includes(profile.degree))
      return 'Invalid degree selection';

    if (!specs.includes(profile.specialization))
      return 'Invalid specialization';

    if (profile.cgpa < 0 || profile.cgpa > 10)
      return 'CGPA must be between 0 and 10';

    const year = new Date().getFullYear();
    if (profile.graduation_year < 2000 || profile.graduation_year > year + 6)
      return 'Invalid graduation year';

    if (!profile.university.trim())
      return 'University / College is required';

    return null;
  };

  // ---------------- PROFILE SUBMIT ----------------
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    const validationError = validateEducation();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      const updatedUser = await api.updateProfile(profile);
      updateUser(updatedUser);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      onSave?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  // ---------------- CERTIFICATE SUBMIT ----------------
  const handleCertificateSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setCertError('');
    setCertSuccess(false);

    if (!certificateFile) {
      setCertError('Please select a PDF file');
      return;
    }

    setCertLoading(true);
    try {
      const formData = new FormData();
      formData.append('certification_name', certTitle);
      formData.append('issued_by', issuedBy);
      formData.append('certificate_file', certificateFile);
      formData.append('year', String(year));


      const token = localStorage.getItem('access');

      const response = await fetch(
        'http://localhost:8000/api/auth/add-certification/',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error('Certificate upload failed');
      }

      setCertSuccess(true);
      setCertTitle('');
      setIssuedBy('');
      setCertificateFile(null);
    } catch (err) {
      setCertError(
        err instanceof Error ? err.message : 'Failed to upload certificate'
      );
    } finally {
      setCertLoading(false);
    }
  };

  // ---------------- SKILLS ----------------
  const addSkill = () => {
    const skill = skillInput.trim();
    if (skill && !profile.skills.includes(skill)) {
      setProfile({ ...profile, skills: [...profile.skills, skill] });
    }
    setSkillInput('');
  };

  const removeSkill = (skill: string) => {
    setProfile({
      ...profile,
      skills: profile.skills.filter((s) => s !== skill),
    });
  };

  // ---------------- UI ----------------
  return (
    <>
      {/* ================= PROFILE FORM ================= */}
      <form onSubmit={handleSubmit} className="profile-form">
        <h2>Education Details </h2>

        {error && <div className="error-message">{error}</div>}
        {success && (
          <div className="success-message">Profile updated successfully!</div>
        )}

        <div className="form-row">
          <div className="form-group">
            <label>Degree</label>
            <select
              value={profile.degree}
              onChange={(e) =>
                setProfile({ ...profile, degree: e.target.value })
              }
              required
            >
              <option value="">Select Degree</option>
              {['B.Tech', 'B.Sc', 'M.Sc', 'MCA', 'MBA',"BBA","B.COM","M.TECH","BCA","BA","MA"].map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Specialization</label>
            <select
              value={profile.specialization}
              onChange={(e) =>
                setProfile({ ...profile, specialization: e.target.value })
              }
              required
            >
              <option value="">Select Specialization</option>
              {['CSE', 'ECE', 'IT', 'Data Science', 'AI', 'Mechanical',"Physics","Chemistry","EEE","Statistics","Geography","cyber security","Maths","English","Civil"].map(
                (s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                )
              )}
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>CGPA</label>
            <input
              type="number"
              step="0.1"
              min="0"
              max="10"
              value={profile.cgpa}
              onChange={(e) =>
                setProfile({ ...profile, cgpa: Number(e.target.value) })
              }
              required
            />
          </div>

          <div className="form-group">
            <label>Graduation Year</label>
            <input
              type="number"
              value={profile.graduation_year}
              onChange={(e) =>
                setProfile({
                  ...profile,
                  graduation_year: Number(e.target.value),
                })
              }
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label>University / College</label>
          <input
            type="text"
            value={profile.university}
            onChange={(e) =>
              setProfile({ ...profile, university: e.target.value })
            }
            required
          />
        </div>

        <div className="form-group">
          <label>Skills</label>
          <div className="skills-input">
            <input
              type="text"
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addSkill();
                }
              }}
            />
            <button type="button" onClick={addSkill}>
              Add
            </button>
          </div>

          <div className="skills-list">
            {profile.skills.map((skill, index) => (
              <span key={index} className="skill-tag">
                {skill}
                <button type="button" onClick={() => removeSkill(skill)}>
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>

        <button type="submit" disabled={loading}>
          {loading ? 'Saving...' : 'Save Profile'}
        </button>
      </form>

      {/* ================= CERTIFICATION FORM ================= */}
      <hr style={{ margin: '2rem 0' }} />

      <form onSubmit={handleCertificateSubmit} className="profile-form">
        <h2>Certifications</h2>

        {certError && <div className="error-message">{certError}</div>}
        {certSuccess && (
          <div className="success-message">
            Certificate uploaded successfully!
          </div>
        )}

        <div className="form-group">
          <label>Certificate Title</label>
          <input
            type="text"
            value={certTitle}
            onChange={(e) => setCertTitle(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label>Issued By</label>
          <input
            type="text"
            value={issuedBy}
            onChange={(e) => setIssuedBy(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label>Upload Certificate (PDF)</label>
          <input
            type="file"
            accept="application/pdf"
            onChange={(e) =>
              setCertificateFile(e.target.files?.[0] || null)
            }
            required
          />
        </div>

        <button type="submit" disabled={certLoading}>
          {certLoading ? 'Uploading...' : 'Upload Certificate'}
        </button>
      </form>
    </>
  );
}
