import { useEffect, useState } from "react";
import { api } from "../api";
import { useNavigate } from "react-router-dom";

const AdminDashboardPage = () => {
  const navigate = useNavigate();

  // ================= STATES =================
  const [stats, setStats] = useState({
    total_users: 0,
    total_predictions: 0,
    flagged_count: 0,
    feedback_count: 0,
  });

  const [logs, setLogs] = useState<any[]>([]);
  const [flagged, setFlagged] = useState<any[]>([]);
  const [trainFile, setTrainFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  // ================= LOAD DATA =================
  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const statsRes = await api.getAdminStats();
        const logsRes = await api.getUserLogs();
        const flaggedRes = await api.getFlaggedPredictions();

        setStats(statsRes);
        setLogs(logsRes);
        setFlagged(flaggedRes);
      } catch (err) {
        console.error("Admin dashboard load failed", err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  // ================= MODEL TRAIN =================
  const handleTrainModel = async () => {
    if (!trainFile) return alert("Please select a CSV file");

    try {
      const res = await api.uploadTrainingData(trainFile);
      setMessage(res.message || "Model trained successfully");
    } catch {
      alert("Training failed");
    }
  };

  // ================= LOGOUT =================
  const handleLogout = () => {
    localStorage.removeItem("admin_access");
    localStorage.removeItem("refresh");
    navigate("/admin/login");
  };

  if (loading) {
    return <p style={{ padding: 40 }}>Loading dashboard...</p>;
  }

  return (
    <div style={styles.page}>
      {/* HEADER */}
      <div style={styles.header}>
        <h1>Admin Dashboard</h1>
        <button onClick={handleLogout} style={styles.logout}>
          Logout
        </button>
      </div>

      {/* STATS */}
      <div style={styles.cards}>
        <StatCard title="Total Users" value={stats.total_users} />
        <StatCard title="Predictions" value={stats.total_predictions} />
        <StatCard title="User Logs" value={logs.length} />
        <StatCard title="Flagged Items" value={flagged.length} />
      </div>

      {/* MODEL TRAINING */}
      <section style={styles.section}>
        <h2>Model Training</h2>
        <input
          type="file"
          accept=".csv"
          onChange={(e) => setTrainFile(e.target.files?.[0] || null)}
        />
        <br /><br />
        <button onClick={handleTrainModel} style={styles.primary}>
          Train Model
        </button>
        {message && <p style={styles.success}>{message}</p>}
      </section>

      {/* USER LOGS */}
      <section style={styles.section}>
        <h2>User Activity Logs</h2>
        {logs.length === 0 ? (
          <p>No logs available</p>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th>User</th>
                <th>Action</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id}>
                  <td>{log.user_email || log.user}</td>
                  <td>{log.action}</td>
                  <td>{new Date(log.timestamp).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* FLAGGED */}
      <section style={styles.section}>
        <h2>Flagged Predictions</h2>
        {flagged.length === 0 ? (
          <p>No flagged items 🎉</p>
        ) : (
          flagged.map((item) => (
            <div key={item.id} style={styles.flag}>
              <b>User:</b> {item.user_email || item.user}
              <br />
              <b>Reason:</b> {item.reason}
            </div>
          ))
        )}
      </section>
    </div>
  );
};

export default AdminDashboardPage;

// ================= COMPONENTS =================
const StatCard = ({ title, value }: any) => (
  <div style={styles.card}>
    <h4>{title}</h4>
    <p style={styles.number}>{value}</p>
  </div>
);

// ================= STYLES =================
const styles: any = {
  page: {
    padding: 30,
    maxWidth: 1200,
    margin: "auto",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  logout: {
    background: "#ef4444",
    color: "#fff",
    border: "none",
    padding: "8px 16px",
    borderRadius: 6,
    cursor: "pointer",
  },
  cards: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: 20,
    marginBottom: 30,
  },
  card: {
    background: "#fff",
    padding: 20,
    borderRadius: 10,
    boxShadow: "0 4px 10px rgba(0,0,0,0.08)",
  },
  number: {
    fontSize: 28,
    fontWeight: "bold",
  },
  section: {
    background: "#fff",
    padding: 20,
    borderRadius: 10,
    marginBottom: 30,
    boxShadow: "0 4px 10px rgba(0,0,0,0.08)",
  },
  primary: {
    background: "#2563eb",
    color: "#fff",
    border: "none",
    padding: "10px 20px",
    borderRadius: 6,
    cursor: "pointer",
  },
  success: {
    color: "green",
    marginTop: 10,
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  flag: {
    padding: 12,
    border: "1px solid #ddd",
    borderRadius: 6,
    marginBottom: 10,
    background: "#fafafa",
  },
};
