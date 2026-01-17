import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../api";
import "./AuthPage.css";

interface RegisterForm {
  name: string;
  email: string;
  password: string;
  admin_code: string;
}

const RegisterPage = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState<RegisterForm>({
    name: "",
    email: "",
    password: "",
    admin_code: "",
  });

  const [isAdmin, setIsAdmin] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (form.password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      setLoading(true);

      if (isAdmin) {
        // Admin registration (auto-login)
        await api.adminRegister({
          username: form.email,
          email: form.email,
          password: form.password,
          admin_code: form.admin_code,
        });

        navigate("/admin/dashboard");
      } else {
        // Normal user registration
        await api.register({
          name: form.name,
          email: form.email,
          password: form.password,
        });

        navigate("/dashboard");
      }
    } catch (err: any) {
      if (err.response?.data) {
        const resp = err.response.data;
        const msg =
          resp.admin_code?.[0] ||
          resp.email?.[0] ||
          resp.name?.[0] ||
          resp.error ||
          "Registration failed";
        setError(msg);
      } else {
        setError(err.message || "Registration failed");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2>{isAdmin ? "Admin Register" : "User Register"}</h2>

        {error && <p className="error-text">{error}</p>}

        <form onSubmit={handleSubmit}>
          {!isAdmin && (
            <>
              <label>Name</label>
              <input
                name="name"
                placeholder="Enter your name"
                value={form.name}
                onChange={handleChange}
                required
              />
            </>
          )}

          <label>Email</label>
          <input
            name="email"
            type="email"
            placeholder="Enter your email"
            value={form.email}
            onChange={handleChange}
            required
          />

          <label>Password</label>
          <input
            name="password"
            type="password"
            placeholder="Enter password"
            value={form.password}
            onChange={handleChange}
            required
          />

          <label>Confirm Password</label>
          <input
            type="password"
            placeholder="Confirm password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />

          <div className="admin-checkbox">
            <input
              type="checkbox"
              checked={isAdmin}
              onChange={(e) => setIsAdmin(e.target.checked)}
            />
            <span> Register as Admin</span>
          </div>

          {isAdmin && (
            <input
              type="password"
              name="admin_code"
              placeholder="Enter admin secret code"
              value={form.admin_code}
              onChange={handleChange}
              required
            />
          )}

          <button type="submit" disabled={loading}>
            {loading ? "Registering..." : "Register"}
          </button>
        </form>

        <p className="switch-text">
          Already have an account? <Link to="/login">Login here</Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
