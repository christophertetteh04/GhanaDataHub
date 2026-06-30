import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

export default function LoginPage() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handle = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success("Welcome back!");
      navigate("/");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-panel">
        <div className="auth-form-title">Sign in</div>
        <div className="auth-form-sub">Access your GhanaDataHub account</div>

        <form onSubmit={handle}>
          <div className="form-group">
            <label className="form-label">Email address</label>
            <input
              className="form-input"
              type="email"
              placeholder="you@organization.gh"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              className="form-input"
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>
          <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center", marginTop: 4, padding: "11px" }} disabled={loading}>
            {loading ? <span className="spinner" /> : "Sign in"}
          </button>
        </form>

        <p style={{ marginTop: 20, fontSize: 13, textAlign: "center", color: "var(--gray-500)" }}>
          No account?{" "}
          <Link to="/register" className="auth-link">Create one</Link>
        </p>
      </div>

      <div className="auth-hero">
        <div className="auth-logo">
          <div className="logo-mark" style={{ width: 48, height: 48, fontSize: 18 }}>GD</div>
          <div>
            <div style={{ fontFamily: "Sora, sans-serif", fontWeight: 700, fontSize: 18, color: "white" }}>GhanaDataHub</div>
          </div>
        </div>
        <h1 className="auth-headline">
          One platform for all your organization's data
        </h1>
        <p className="auth-subtext">
          Upload, manage, analyze, and securely share datasets across your organization and beyond.
          Built for modern African data teams.
        </p>

        <div style={{ marginTop: 40, display: "flex", flexDirection: "column", gap: 12 }}>
          {["Role-based access control", "Dataset versioning & history", "Rich search & filtering", "Analytics dashboard"].map(f => (
            <div key={f} style={{ display: "flex", alignItems: "center", gap: 10, color: "rgba(255,255,255,0.8)", fontSize: 14 }}>
              <span style={{ width: 20, height: 20, background: "rgba(252,209,22,0.2)", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", color: "#FCD116", fontSize: 12 }}>✓</span>
              {f}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
