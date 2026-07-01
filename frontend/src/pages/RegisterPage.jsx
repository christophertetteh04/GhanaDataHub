import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Database, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import AuthLayout from "../components/AuthLayout";
import toast from "react-hot-toast";

export default function RegisterPage() {
  const [form, setForm] = useState({ email: "", username: "", full_name: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState("");
  const { register } = useAuth();
  const navigate = useNavigate();

  const handle = async (e) => {
    e.preventDefault();
    setLoading(true);
    setAuthError("");
    try {
      await register(form);
      toast.success("Account created! Please sign in.");
      navigate("/login");
    } catch (err) {
      const detail = err.response?.data?.detail;
      const message = typeof detail === "string" ? detail : "Registration failed";
      setAuthError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const field = (key, label, type = "text", placeholder = "") => (
    <div className="authx-field">
      <label className="authx-label">{label}</label>
      {type === "password" ? (
        <div className="authx-input-wrap">
          <input
            className="authx-input has-action"
            type={showPassword ? "text" : "password"}
            placeholder={placeholder}
            value={form[key]}
            onChange={(e) => setForm({ ...form, [key]: e.target.value })}
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
      ) : (
        <input
          className="authx-input"
          type={type}
          placeholder={placeholder}
          value={form[key]}
          onChange={(e) => setForm({ ...form, [key]: e.target.value })}
          required
        />
      )}
    </div>
  );

  return (
    <AuthLayout icon={Database} title="Create your account" subtitle="Start managing your data today">
      <form className="authx-form" onSubmit={handle}>
        {field("full_name", "Full name", "text", "Kwame Mensah")}
        {field("email", "Email address", "email", "kwame@org.gh")}
        {field("username", "Username", "text", "kwamem")}
        {field("password", "Password", "password", "Min. 8 characters")}

        {authError ? <div className="authx-error">{authError}</div> : null}

        <button className="authx-submit" disabled={loading}>
          {loading ? (
            <>
              <span className="authx-spinner" />
              Creating account...
            </>
          ) : (
            "Create account"
          )}
        </button>
      </form>

      <div className="authx-divider">OR</div>

      <p className="authx-bottom-link">
        Already have an account? <Link to="/login">Log in</Link>
      </p>
    </AuthLayout>
  );
}
