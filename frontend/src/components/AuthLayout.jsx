import { Check, Database } from "lucide-react";

export default function AuthLayout({ icon: Icon = Database, title, subtitle, children }) {
  return (
    <div className="authx-page">
      <style>{`
        .authx-page {
          min-height: 100vh;
          display: grid;
          grid-template-columns: 45% 55%;
          background: var(--white);
          color: var(--gray-900);
          position: relative;
          overflow: hidden;
        }

        .authx-form-panel {
          background: var(--white);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 64px;
          position: relative;
          z-index: 2;
        }

        .authx-form-card {
          width: 100%;
          max-width: 400px;
        }

        .authx-icon-badge {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          background: var(--green-pale);
          color: var(--green);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 22px;
        }

        .authx-title {
          font-family: 'Sora', sans-serif;
          font-size: 30px;
          line-height: 1.15;
          font-weight: 700;
          letter-spacing: 0;
          margin-bottom: 9px;
        }

        .authx-subtitle {
          color: var(--gray-500);
          font-size: 14px;
          line-height: 1.6;
          margin-bottom: 32px;
        }

        .authx-form {
          display: grid;
          gap: 17px;
        }

        .authx-field {
          display: grid;
          gap: 7px;
        }

        .authx-label {
          color: var(--gray-700);
          font-size: 13px;
          font-weight: 600;
        }

        .authx-input-wrap {
          position: relative;
        }

        .authx-input {
          width: 100%;
          min-height: 46px;
          padding: 11px 13px;
          border: 1px solid var(--gray-300);
          border-radius: 10px;
          background: var(--white);
          color: var(--gray-900);
          outline: none;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }

        .authx-input.has-action {
          padding-right: 46px;
        }

        .authx-input:focus {
          border-color: var(--green);
          box-shadow: 0 0 0 3px rgba(0,107,63,0.1);
        }

        .authx-password-toggle {
          position: absolute;
          right: 9px;
          top: 50%;
          transform: translateY(-50%);
          width: 34px;
          height: 34px;
          border: 0;
          border-radius: 8px;
          background: transparent;
          color: var(--gray-500);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition: color 0.2s ease, background 0.2s ease;
        }

        .authx-password-toggle:hover {
          color: var(--green);
          background: var(--green-pale);
        }

        .authx-options {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          min-height: 44px;
          font-size: 13px;
          color: var(--gray-500);
        }

        .authx-checkbox {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          min-height: 44px;
          cursor: pointer;
        }

        .authx-checkbox input {
          width: 16px;
          height: 16px;
          accent-color: var(--green);
        }

        .authx-muted-link,
        .authx-bottom-link a {
          color: var(--green);
          font-weight: 700;
        }

        .authx-muted-link:hover,
        .authx-bottom-link a:hover {
          text-decoration: underline;
        }

        .authx-error {
          border-radius: 10px;
          background: #FEE2E2;
          color: var(--red);
          padding: 11px 13px;
          font-size: 13px;
          font-weight: 600;
          line-height: 1.45;
        }

        .authx-submit {
          width: 100%;
          min-height: 48px;
          border: 0;
          border-radius: 10px;
          background: var(--green);
          color: var(--white);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          font-weight: 700;
          transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease, opacity 0.2s ease;
          box-shadow: 0 12px 24px rgba(0, 107, 63, 0.18);
        }

        .authx-submit:hover:not(:disabled) {
          background: var(--green-light);
          transform: translateY(-2px);
          box-shadow: 0 16px 30px rgba(0, 107, 63, 0.24);
        }

        .authx-submit:disabled {
          cursor: not-allowed;
          opacity: 0.78;
        }

        .authx-spinner {
          width: 17px;
          height: 17px;
          border-radius: 50%;
          border: 2px solid rgba(255,255,255,0.36);
          border-top-color: var(--white);
          animation: authx-spin 0.75s linear infinite;
        }

        .authx-divider {
          display: flex;
          align-items: center;
          gap: 12px;
          color: var(--gray-500);
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.12em;
          margin: 22px 0 0;
        }

        .authx-divider::before,
        .authx-divider::after {
          content: "";
          height: 1px;
          flex: 1;
          background: var(--gray-300);
        }

        .authx-bottom-link {
          margin-top: 20px;
          color: var(--gray-500);
          font-size: 13px;
          text-align: center;
        }

        .authx-visual-panel {
          background: linear-gradient(135deg, var(--green-pale) 0%, var(--white) 78%);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 72px;
          position: relative;
          overflow: hidden;
        }

        .authx-floating-pill {
          position: absolute;
          z-index: 4;
          display: inline-flex;
          align-items: center;
          gap: 9px;
          min-height: 38px;
          border-radius: 999px;
          background: var(--white);
          color: var(--gray-700);
          padding: 8px 13px;
          font-size: 13px;
          font-weight: 700;
          box-shadow: 0 12px 34px rgba(17, 24, 39, 0.12);
        }

        .authx-floating-pill.left {
          top: 28px;
          left: calc(45% - 58px);
        }

        .authx-floating-pill.right {
          top: 28px;
          right: 28px;
        }

        .authx-avatar {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: var(--green);
          color: var(--white);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-family: 'Sora', sans-serif;
          font-size: 10px;
          font-weight: 700;
        }

        .authx-visual-content {
          width: min(560px, 100%);
          position: relative;
          z-index: 2;
        }

        .authx-visual-title {
          font-family: 'Sora', sans-serif;
          font-size: clamp(42px, 5vw, 62px);
          line-height: 1.05;
          letter-spacing: 0;
          font-weight: 400;
          color: var(--gray-900);
          margin-bottom: 20px;
        }

        .authx-visual-title strong {
          display: block;
          color: var(--green);
          font-weight: 700;
        }

        .authx-visual-copy {
          max-width: 470px;
          color: var(--gray-500);
          font-size: 16px;
          line-height: 1.75;
          margin-bottom: 34px;
        }

        .authx-preview-wrap {
          position: relative;
          width: min(460px, 100%);
        }

        .authx-preview-card {
          border: 1px solid rgba(209, 213, 219, 0.9);
          border-radius: 16px;
          background: var(--white);
          padding: 18px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.06), 0 24px 60px rgba(17, 24, 39, 0.12);
        }

        .authx-preview-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 14px;
          margin-bottom: 16px;
        }

        .authx-preview-title {
          font-family: 'Sora', sans-serif;
          font-weight: 700;
        }

        .authx-status {
          border-radius: 999px;
          background: var(--green-pale);
          color: var(--green);
          padding: 5px 9px;
          font-size: 11px;
          font-weight: 800;
        }

        .authx-preview-row {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 16px;
          align-items: center;
          border-top: 1px solid var(--gray-100);
          padding: 14px 0;
        }

        .authx-preview-row:last-child {
          padding-bottom: 0;
        }

        .authx-row-title {
          font-weight: 700;
          color: var(--gray-900);
          margin-bottom: 3px;
        }

        .authx-row-meta {
          color: var(--gray-500);
          font-size: 12px;
        }

        .authx-row-value {
          color: var(--green);
          font-family: 'Sora', sans-serif;
          font-weight: 700;
        }

        .authx-float-card {
          position: absolute;
          z-index: 3;
          border-radius: 14px;
          background: var(--white);
          box-shadow: 0 16px 36px rgba(17, 24, 39, 0.13);
          padding: 12px 14px;
          animation: authx-float 5s ease-in-out infinite;
        }

        .authx-float-card.synced {
          top: -18px;
          right: -28px;
          display: flex;
          align-items: center;
          gap: 8px;
          color: var(--gray-700);
          font-weight: 800;
          font-size: 13px;
        }

        .authx-float-card.stat {
          left: -24px;
          bottom: -22px;
          min-width: 96px;
          animation-delay: 1.1s;
        }

        .authx-check {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: var(--green-pale);
          color: var(--green);
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .authx-stat-value {
          display: block;
          font-family: 'Sora', sans-serif;
          color: var(--green);
          font-size: 20px;
          font-weight: 700;
          line-height: 1;
        }

        .authx-stat-label {
          display: block;
          color: var(--gray-500);
          font-size: 11px;
          font-weight: 700;
          margin-top: 5px;
        }

        @keyframes authx-spin {
          to { transform: rotate(360deg); }
        }

        @keyframes authx-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }

        @media (max-width: 768px) {
          .authx-page {
            display: block;
            min-height: 100vh;
            overflow-y: auto;
          }

          .authx-form-panel {
            min-height: 100vh;
            padding: 24px;
          }

          .authx-form-card {
            max-width: 420px;
          }

          .authx-title {
            font-size: 27px;
          }

          .authx-visual-panel,
          .authx-floating-pill {
            display: none;
          }
        }
      `}</style>

      <div className="authx-floating-pill left">
        <span className="authx-avatar">GD</span>
        GhanaDataHub
      </div>
      <div className="authx-floating-pill right">@yourorg</div>

      <section className="authx-form-panel" aria-label={title}>
        <div className="authx-form-card">
          <div className="authx-icon-badge">
            <Icon size={20} />
          </div>
          <h1 className="authx-title">{title}</h1>
          <p className="authx-subtitle">{subtitle}</p>
          {children}
        </div>
      </section>

      <aside className="authx-visual-panel" aria-hidden="true">
        <div className="authx-visual-content">
          <h2 className="authx-visual-title">
            Manage Your
            <strong>Data With Confidence</strong>
          </h2>
          <p className="authx-visual-copy">
            Govern datasets, permissions, search, and institutional reporting from one calm workspace built for serious data teams.
          </p>

          <div className="authx-preview-wrap">
            <div className="authx-preview-card">
              <div className="authx-preview-header">
                <div className="authx-preview-title">Dataset workspace</div>
                <span className="authx-status">Secure</span>
              </div>
              {[
                ["Health survey records", "Updated today", "2.4GB"],
                ["District indicators", "Verified", "184"],
                ["Research catalogue", "Synced", "92%"],
              ].map(([name, meta, value]) => (
                <div className="authx-preview-row" key={name}>
                  <div>
                    <div className="authx-row-title">{name}</div>
                    <div className="authx-row-meta">{meta}</div>
                  </div>
                  <div className="authx-row-value">{value}</div>
                </div>
              ))}
            </div>

            <div className="authx-float-card synced">
              <span className="authx-check">
                <Check size={15} />
              </span>
              Synced
            </div>
            <div className="authx-float-card stat">
              <span className="authx-stat-value">99.9%</span>
              <span className="authx-stat-label">uptime</span>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
