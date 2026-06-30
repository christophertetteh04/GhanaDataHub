import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

export default function RegisterPage() {
  const [form, setForm] = useState({ email: "", username: "", full_name: "", password: "" });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handle = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(form);
      toast.success("Account created! Please sign in.");
      navigate("/login");
    } catch (err) {
      const detail = err.response?.data?.detail;
      toast.error(typeof detail === "string" ? detail : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const field = (key, label, type = "text", placeholder = "") => (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <input
        className="form-input"
        type={type}
        placeholder={placeholder}
        value={form[key]}
        onChange={e => setForm({ ...form, [key]: e.target.value })}
        required
      />
    </div>
  );

  return (
    <div className="auth-page">
      <div className="auth-panel">
        <div className="auth-form-title">Create account</div>
        <div className="auth-form-sub">Join GhanaDataHub today</div>

        <form onSubmit={handle}>
          {field("full_name", "Full name", "text", "Kwame Mensah")}
          {field("email", "Email address", "email", "kwame@org.gh")}
          {field("username", "Username", "text", "kwamem")}
          {field("password", "Password", "password", "Min. 8 characters")}
          <button
            className="btn btn-primary"
            style={{ width: "100%", justifyContent: "center", marginTop: 4, padding: "11px" }}
            disabled={loading}
          >
            {loading ? <span className="spinner" /> : "Create account"}
          </button>
        </form>

        <p style={{ marginTop: 20, fontSize: 13, textAlign: "center", color: "var(--gray-500)" }}>
          Already have an account?{" "}
          <Link to="/login" className="auth-link">Sign in</Link>
        </p>
      </div>

      <div className="auth-hero">
        <div className="auth-logo">
          <div className="logo-mark" style={{ width: 48, height: 48, fontSize: 18 }}>GD</div>
          <div>
            <div style={{ fontFamily: "Sora, sans-serif", fontWeight: 700, fontSize: 18, color: "white" }}>GhanaDataHub</div>
          </div>
        </div>
        <h1 className="auth-headline">Start managing your data better</h1>
        <p className="auth-subtext">
          The first user to register becomes Super Admin. Set up your organization and invite your team.
        </p>
      </div>
    </div>
  );
}
