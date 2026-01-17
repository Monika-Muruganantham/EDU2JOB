import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import "./DashboardPage.css";

type UIPrediction = {
  role: string;
  confidence: number;
};

type UIHistoryItem = {
  role: string;
  confidence: number;
  createdAt: string;
};

export default function DashboardPage() {
  const navigate = useNavigate();

  // ----------------- FORM STATE -----------------
  const [degree, setDegree] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [university, setUniversity] = useState("");
  const [graduationYear, setGraduationYear] = useState("");
  const [cgpa, setCgpa] = useState("");

  // ----------------- PREDICTION STATE -----------------
  const [predictions, setPredictions] = useState<UIPrediction[]>([]);
  const [history, setHistory] = useState<UIHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ----------------- FEEDBACK STATE -----------------
  const [feedbackRole, setFeedbackRole] = useState(""); 
  const [feedbackRating, setFeedbackRating] = useState(5); 
  const [feedbackComment, setFeedbackComment] = useState(""); 
  const [feedbackSuccess, setFeedbackSuccess] = useState(""); 
  const [feedbackError, setFeedbackError] = useState(""); 

  // ----------------- LOGOUT -----------------
  const handleLogout = () => {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    navigate("/login");
  };

  // ----------------- EDIT PROFILE -----------------
  const handleEditProfile = () => {
    navigate("/profile");
  };

  // ----------------- LOAD HISTORY -----------------
  const loadHistory = async () => {
    try {
      const res = await api.getPredictionHistory();
      if (Array.isArray(res)) {
        setHistory(
          res.map((h: any) => ({
            role: h.role,
            confidence: Number(h.confidence),
            createdAt: h.created_at || h.createdAt,
          }))
        );
      } else {
        setHistory([]);
      }
    } catch (err) {
      console.error("History load failed:", err);
      setHistory([]);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  // ----------------- PREDICT -----------------
  const handlePredict = async () => {
    setLoading(true);
    setError("");
    setPredictions([]);

    if (!degree || !specialization || !university || !graduationYear || !cgpa) {
      setError("Please fill all fields");
      setLoading(false);
      return;
    }

    try {
      const payload = {
        degree,
        specialization,
        university,
        graduation_year: Number(graduationYear),
        cgpa: Number(cgpa),
        skills: [specialization],
      };

      const res: any = await api.predictJob(payload);

      const roles = Array.isArray(res?.top_roles) ? res.top_roles : [];

      setPredictions(
        roles.map((r: any) => ({
          role: r.role,
          confidence: Number(r.confidence),
        }))
      );

      loadHistory();
    } catch (err) {
      console.error(err);
      setError("Prediction failed");
    } finally {
      setLoading(false);
    }
  };

  // ----------------- SUBMIT FEEDBACK -----------------
  const handleFeedbackSubmit = async () => {
    if (!feedbackRole || !feedbackComment) {
      setFeedbackError("Please select a role and write a comment");
      return;
    }

    setFeedbackError("");
    setFeedbackSuccess("");

    try {
      await api.submitFeedback({
        role: feedbackRole,
        rating: feedbackRating,
        comment: feedbackComment,
      });

      setFeedbackSuccess("Feedback submitted successfully!");
      setFeedbackRole("");
      setFeedbackRating(5);
      setFeedbackComment("");
    } catch (err) {
      console.error(err);
      setFeedbackError("Failed to submit feedback");
    }
  };

  // ----------------- EDUCATION → JOB CHART -----------------
  const eduJobData = predictions.reduce<{ [key: string]: number }>((acc, p) => {
    const key = `${degree} - ${specialization}`;
    acc[key] = (acc[key] || 0) + p.confidence;
    return acc;
  }, {});

  const eduJobChart = Object.entries(eduJobData).map(([edu, count]) => ({
    edu,
    count,
  }));

  // ----------------- CAREER TREND CHART -----------------
  const careerTrendData: { [key: string]: { [role: string]: number } } = {};
  history.forEach((_h) => {
    const year = new Date(_h.createdAt).getFullYear().toString();
    if (!careerTrendData[year]) careerTrendData[year] = {};
    careerTrendData[year][_h.role] = (careerTrendData[year][_h.role] || 0) + 1;
  });

  const careerTrendChart = Object.entries(careerTrendData).map(([year, roles]) => ({
    year,
    ...roles,
  }));

  const allJobs = Array.from(new Set(history.map((_h) => _h.role)));

  const topRoles = Object.entries(
    history.reduce<{ [role: string]: number }>((acc, _h) => {
      acc[_h.role] = (acc[_h.role] || 0) + 1;
      return acc;
    }, {})
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map((e) => e[0]);

  const mostRecentYear = history.length > 0 ? Math.max(...history.map((_h) => new Date(_h.createdAt).getFullYear())) : null;

  const latestYearTrend = history
    .filter((_h) => new Date(_h.createdAt).getFullYear() === mostRecentYear)
    .reduce<{ [role: string]: number }>((acc, _h) => {
      acc[_h.role] = (acc[_h.role] || 0) + 1;
      return acc;
    }, {});

  // ----------------- RENDER -----------------
  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div>
          <h1>🎓 Career Prediction Dashboard</h1>
          <p>Check your top career matches and prediction history</p>
        </div>

        <div className="header-actions">
          <button className="btn-outline" onClick={handleEditProfile}>
            ✏️ Edit Profile
          </button>
          <button className="btn-danger" onClick={handleLogout}>
            🔐 Logout
          </button>
        </div>
      </header>

      <div className="dashboard-grid">
        {/* ---------- FORM ---------- */}
        <div className="dashboard-box form-box">
          <h2>Enter Your Details</h2>
          <div className="form-grid">
            <select value={degree} onChange={(e) => setDegree(e.target.value)}>
              <option value="">Degree</option>
              <option value="B.Tech">B.Tech</option>
              <option value="B.Sc">B.Sc</option>
              <option value="M.Tech">M.Tech</option>
              <option value="B.Com">B.Com</option>
              <option value="MBA">MBA</option>
              <option value="BA">BA</option>
              <option value="M.Sc">M.Sc</option>
              <option value="MA">MA</option>
              <option value="BCA">BCA</option>
              <option value="BBA">BBA</option>
              <option value="PhD">PhD</option>
            </select>

            <select value={specialization} onChange={(e) => setSpecialization(e.target.value)}>
              <option value="">Specialization</option>
              <option value="Computer Science">Computer Science</option>
              <option value="Data Science">Data Science</option>
              <option value="AI">AI</option>
              <option value="IT">IT</option>
              <option value="HR">HR</option>
              <option value="Finance">Finance</option>
              <option value="Mechanical">Mechanical</option>
              <option value="Civil">Civil</option>
              <option value="ECE">ECE</option>
            </select>

            <input placeholder="University" value={university} onChange={(e) => setUniversity(e.target.value)} />
            <input type="number" placeholder="Graduation Year" value={graduationYear} onChange={(e) => setGraduationYear(e.target.value)} />
            <input type="number" step="0.1" placeholder="CGPA" value={cgpa} onChange={(e) => setCgpa(e.target.value)} />
          </div>

          <button onClick={handlePredict} disabled={loading}>
            {loading ? "Predicting..." : "Predict Career"}
          </button>

          {error && <p className="error">{error}</p>}
        </div>

        {/* ---------- PREDICTIONS ---------- */}
        <div className="dashboard-box predictions-box">
          <h2>Top Career Matches</h2>
          {predictions.length === 0 && <p>No predictions yet</p>}

          {predictions.map((_p, i) => (
            <div key={i} className="prediction">
              <div className="prediction-header">
                <span>{_p.role}</span>
                <span>{_p.confidence.toFixed(1)}%</span>
              </div>
              <div className="bar">
                <div className="bar-fill" style={{ width: `${_p.confidence}%` }} />
              </div>
            </div>
          ))}
        </div>

        {/* ---------- HISTORY (SCROLLABLE CARD) ---------- */}
        <div className="dashboard-box history-box">
          <h2 className="mb-2 text-lg font-semibold">Prediction History</h2>
          {history.length === 0 ? (
            <p>No history yet</p>
          ) : (
            <div
              style={{
                maxHeight: "300px",
                overflowY: "auto",
                padding: "8px",
                backgroundColor: "#f9fafb",
                borderRadius: "12px",
              }}
            >
              {history.map((_h, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "8px",
                    borderBottom: "1px solid #e5e7eb",
                  }}
                >
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <span style={{ fontWeight: 500 }}>{_h.role}</span>
                    <small style={{ color: "#6b7280" }}>
                      {new Date(_h.createdAt).toLocaleString()}
                    </small>
                  </div>
                  <span style={{ fontWeight: 600, color: "#10b981" }}>
                    {_h.confidence.toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ---------- EDUCATION → JOB ---------- */}
        <div className="dashboard-box">
          <h2>Education → Job Mapping</h2>
          {eduJobChart.length === 0 ? (
            <p>No data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={eduJobChart}>
                <XAxis dataKey="edu" interval={0} angle={-45} textAnchor="end" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* ---------- CAREER TRANSITION TRENDS ---------- */}
        <div className="dashboard-box">
          <h2>Career Transition Trends</h2>
          {careerTrendChart.length === 0 ? (
            <p>No data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={careerTrendChart}>
                <XAxis dataKey="year" />
                <YAxis />
                <Tooltip />
                {allJobs.map((job, idx) => (
                  <Bar
                    key={job}
                    dataKey={job}
                    stackId="a"
                    fill={["#f59e0b", "#10b981", "#3b82f6", "#8b5cf6"][idx % 4]}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* ---------- INSIGHTS ---------- */}
        <div className="dashboard-box">
          <h2>Insights</h2>
          <div className="insights">
            <p><strong>Top 3 Roles:</strong> {topRoles.join(", ")}</p>
            <p><strong>Latest Graduation Year Trend ({mostRecentYear}):</strong> {JSON.stringify(latestYearTrend)}</p>
          </div>
        </div>

        {/* ---------- FEEDBACK FORM ---------- */}
        <div className="dashboard-box">
          <h2>Submit Feedback</h2>
          <div className="feedback-form">
            <select value={feedbackRole} onChange={(e) => setFeedbackRole(e.target.value)}>
              <option value="">Select Role</option>
              <option value="DATA SCIENTIST">DATA SCIENTIST</option>
              <option value="SOFTWARE ENGINEER">SOFTWARE ENGINEER</option>
              <option value="BUSINESS ANALYST">BUSINESS ANALYST</option>
              {predictions.map((_p, i) => (
                <option key={i} value={_p.role}>{_p.role}</option>
              ))}
            </select>

            <label>
              Rating:
              <select
                value={feedbackRating}
                onChange={(e) => setFeedbackRating(Number(e.target.value))}
              >
                {[1,2,3,4,5].map(n => <option key={n} value={n}>{n} ⭐</option>)}
              </select>
            </label>

            <textarea
              placeholder="Write your comment..."
              value={feedbackComment}
              onChange={(e) => setFeedbackComment(e.target.value)}
            />

            <button onClick={handleFeedbackSubmit}>Submit Feedback</button>

            {feedbackError && <p className="error">{feedbackError}</p>}
            {feedbackSuccess && <p className="success">{feedbackSuccess}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
