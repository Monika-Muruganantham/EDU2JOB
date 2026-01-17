import { useState } from "react";
import { api } from "../api";

const AdminLoginPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    try {
      const res = await api.adminLogin({ username, password });

      // ✅ res already contains access, refresh, is_admin
      if (!res.is_admin) {
        alert("Not an admin");
        return;
      }

      // ✅ redirect to admin dashboard
      window.location.href = "/admin-dashboard";
    } catch (err: any) {
      alert(err.message || "Admin login failed");
    }
  };

  return (
    <div>
      <h2>Admin Login</h2>

      <input
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <button onClick={handleLogin}>Login</button>
    </div>
  );
};

export default AdminLoginPage;
