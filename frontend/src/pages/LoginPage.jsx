import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Database, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import AuthLayout from "../components/AuthLayout";
import toast from "react-hot-toast";

export default function LoginPage() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const handle = async (e) => {
    e.preventDefault();
    setLoading(true);
    setAuthError("");
    try {
      await login(form.email, form.password);
      toast.success("Welcome back!");
      navigate("/");
    } catch (err) {
      const message = err.response?.data?.detail || "Login failed";
      setAuthError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout icon={Database} title="Welcome back" subtitle="Sign in to access your datasets">
      <form className="authx-form" onSubmit={handle}>
        <div className="authx-field">
          <label className="authx-label">Email address</label>
          <input
            className="authx-input"
            type="email"
            placeholder="you@organization.gh"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
        </div>

        <div className="authx-field">
          <label className="authx-label">Password</label>
          <div className="authx-input-wrap">
            <input
              className="authx-input has-action"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
            <button
              className="authx-password-toggle"
              type="button"
              aria-label={showPassword ? "Hide password" : "Show password"}
              onClick={() => setShowPassword((visible) => !visible)}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <div className="authx-options">
          <label className="authx-checkbox">
            <input type="checkbox" />
            <span>Remember me</span>
          </label>
          <a className="authx-muted-link" href="#forgot-password">
            Forgot password?
          </a>
        </div>

        {authError ? <div className="authx-error">{authError}</div> : null}

        <button className="authx-submit" disabled={loading}>
          {loading ? (
            <>
              <span className="authx-spinner" />
              Signing in...
            </>
          ) : (
            "Sign in"
          )}
        </button>
      </form>

      <div className="authx-divider">OR</div>

      <p className="authx-bottom-link">
        Don't have an account? <Link to="/register">Sign up</Link>
      </p>
    </AuthLayout>
  );
}
