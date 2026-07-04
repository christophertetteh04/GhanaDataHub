import { useMemo } from "react";
import { Lightbulb, X } from "lucide-react";

const CONTENT_ITEMS = [
  {
    title: "Your Data Has Rights",
    category: "Data Privacy",
    content:
      "Personal data includes any information that can identify an individual — names, emails, phone numbers, and even IP addresses. Under Ghana's Data Protection Act 2012, organisations must tell you what data they collect and why.",
    tip: "Always read the privacy policy before sharing personal information on any platform.",
  },
  {
    title: "Consent Matters",
    category: "Data Privacy",
    content:
      "Consent is a core privacy principle: organisations should ask before using your data. If you do not agree, you have the right to refuse or withdraw consent.",
    tip: "Check whether a service explains how your personal information will be used before you agree.",
  },
  {
    title: "Minimal Data Collection",
    category: "Data Privacy",
    content:
      "Only the data needed for a service should be collected, not everything. This reduces risk and gives you better control over what is held about you.",
    tip: "Share only what is necessary for the goal you want to achieve.",
  },
  {
    title: "Secure Storage is Essential",
    category: "Data Privacy",
    content:
      "Trusted services protect your data with security measures like encryption and access controls. If a service cannot explain how they secure data, be cautious.",
    tip: "Use services that explicitly describe how they keep your information safe.",
  },
  {
    title: "Privacy Is a Daily Choice",
    category: "Data Privacy",
    content:
      "Your data rights are not a one-time decision — they apply every time you share information. Being aware of how your data is used helps you stay in control.",
    tip: "Review privacy settings often and update them when needed.",
  },
  {
    title: "Piracy Harms Innovation",
    category: "Data Piracy",
    content:
      "Using protected data without permission is data piracy, and it undermines creators and researchers. Always respect ownership and attribution when you reuse someone else's work.",
    tip: "Never copy or redistribute data unless the licence clearly allows it.",
  },
  {
    title: "Respect Intellectual Property",
    category: "Data Piracy",
    content:
      "Intellectual property covers data, charts, reports, and analysis. When data is owned by someone else, using it without permission can be unlawful and unfair.",
    tip: "Always verify the source and licence before republishing data.",
  },
  {
    title: "Licensed Data Is Reusable",
    category: "Data Piracy",
    content:
      "Some data is shared under licences that permit reuse if you follow the rules. A respectful user checks licence terms and gives credit where required.",
    tip: "Look for licence details before you reuse any official dataset.",
  },
  {
    title: "Ask Before You Share",
    category: "Data Piracy",
    content:
      "Sharing someone else's compiled dataset can expose private or copyrighted information. When in doubt, ask the provider for permission first.",
    tip: "If a dataset looks proprietary, check with the owner before distributing it.",
  },
  {
    title: "Cite the Data Creator",
    category: "Data Piracy",
    content:
      "Credit matters: citing the original data creator respects their labour and helps others trace the source. Good citation builds trust in your own work.",
    tip: "Always include the original dataset source when you publish analysis.",
  },
  {
    title: "CC BY Means Attribution",
    category: "Open Data Licences",
    content:
      "A CC BY licence lets you share and adapt work as long as you credit the original creator. This is a simple and open way to reuse data responsibly.",
    tip: "When using CC BY data, clearly credit the source in your work.",
  },
  {
    title: "CC0 Means Public Domain",
    category: "Open Data Licences",
    content:
      "CC0 releases data into the public domain, allowing anyone to reuse it without asking. Even then, it is good practice to mention the origin of the data.",
    tip: "Treat CC0 data with respect by noting where it came from.",
  },
  {
    title: "ODbL Requires Share-Alike",
    category: "Open Data Licences",
    content:
      "The Open Database License (ODbL) allows reuse as long as you credit the source and share any adapted database under the same licence. It ensures shared resources stay open.",
    tip: "If you change ODbL data, share your improved version under the same licence.",
  },
  {
    title: "Licence Terms Protect Everyone",
    category: "Open Data Licences",
    content:
      "Different licences set different rules for reuse, redistribution and attribution. Learning the basics helps you avoid accidental misuse of open data.",
    tip: "Read the licence summary before using open data in reports or dashboards.",
  },
  {
    title: "Open Data Can Still Have Rules",
    category: "Open Data Licences",
    content:
      "Open data is not always licence-free; many datasets require attribution or share-alike treatment. Respecting those rules keeps the open data ecosystem healthy.",
    tip: "Check whether a dataset is CC BY, CC0, ODbL, or another licence before reuse.",
  },
  {
    title: "Protect Data in Transit",
    category: "Data Security",
    content:
      "Sending data over the internet should use encrypted connections such as HTTPS. Unsecured data can be intercepted and misused before it reaches its destination.",
    tip: "Always use services that show a secure lock icon in your browser address bar.",
  },
  {
    title: "Use Strong Account Controls",
    category: "Data Security",
    content:
      "Strong passwords and two-factor authentication reduce the risk of account takeover. If your account is protected, sensitive data stays safer.",
    tip: "Enable two-factor authentication whenever the platform offers it.",
  },
  {
    title: "Limit Who Sees Sensitive Data",
    category: "Data Security",
    content:
      "Not every colleague or system needs access to every dataset. Access controls help keep sensitive information restricted to the right people.",
    tip: "Share data only with people who need it to do their work.",
  },
  {
    title: "Back Up Important Work Safely",
    category: "Data Security",
    content:
      "Regular backups protect your datasets from loss or corruption. Keep backup copies in a secure location with controlled access.",
    tip: "Make a secure backup of key data before making major changes.",
  },
  {
    title: "Review Access Logs",
    category: "Data Security",
    content:
      "Knowing who accessed a dataset helps spot misuse and improve security. Audit trails are a powerful tool for responsible data stewardship.",
    tip: "Check access logs when you suspect data has been seen by the wrong people.",
  },
  {
    title: "Know Your Rights Under Ghana Law",
    category: "GDPR Act 2012",
    content:
      "The Data Protection Act 2012 gives individuals rights over their personal data, including access and correction. Organisations must be transparent about how they collect and use data.",
    tip: "Ask for a copy of your personal data if you are unsure what a service holds about you.",
  },
  {
    title: "Consent and Purpose",
    category: "GDPR Act 2012",
    content:
      "The Act requires that personal data is collected only for legitimate purposes. Consent should be specific, informed and freely given.",
    tip: "If a service cannot explain why it needs your data, do not share it.",
  },
  {
    title: "Data Accuracy Is a Right",
    category: "GDPR Act 2012",
    content:
      "You have the right to ask for incorrect personal data to be corrected. Accurate data helps protect you from harm caused by wrong information.",
    tip: "Review any personal details you provide and request corrections promptly.",
  },
  {
    title: "Secure Disposal Matters",
    category: "GDPR Act 2012",
    content:
      "Organisations must delete personal data when it is no longer needed for its purpose. Safe disposal reduces the risk of old data being exposed.",
    tip: "Ask how long your data will be kept and whether it will be deleted afterward.",
  },
  {
    title: "Accountability Builds Trust",
    category: "GDPR Act 2012",
    content:
      "Data controllers are responsible for how personal data is handled. If a service is accountable, it is more likely to manage data responsibly.",
    tip: "Choose platforms that clearly explain their data protection practices.",
  },
  {
    title: "Cite Data Sources Clearly",
    category: "Responsible Use",
    content:
      "When you publish insights, always cite the origin of the data. Clear citation helps others verify your findings and gives credit to the original source.",
    tip: "Include the dataset name and provider in your analysis notes.",
  },
  {
    title: "Respect Privacy in Reports",
    category: "Responsible Use",
    content:
      "Aggregated statistics are usually safer than personal records. If your analysis uses sensitive data, keep individual identities confidential.",
    tip: "Avoid publishing names or identifying details unless you have explicit permission.",
  },
  {
    title: "Be Transparent About Methods",
    category: "Responsible Use",
    content:
      "Good data practice means explaining how you collected and analysed information. Transparency makes your work easier to trust and reuse.",
    tip: "Write a short note about your data sources and any limitations.",
  },
  {
    title: "Use Data for Positive Impact",
    category: "Responsible Use",
    content:
      "Responsible data use means choosing projects that benefit communities and respect rights. Data can support development when people are treated fairly.",
    tip: "Focus your analysis on solutions rather than simply exposing problems.",
  },
  {
    title: "Share Insights, Not Raw Data",
    category: "Responsible Use",
    content:
      "Summarising findings rather than sharing raw personal data reduces risk. Good reporting protects individuals while still sharing useful knowledge.",
    tip: "Share charts and summaries instead of original records when possible.",
  },
];

export default function DailyPopup({ isVisible, dismiss, neverShow }) {
  const today = new Date();
  const dayIndex = Math.max(0, Math.min(29, today.getDate() - 1));
  const content = useMemo(
    () => CONTENT_ITEMS[dayIndex] || CONTENT_ITEMS[0],
    [dayIndex],
  );
  const formattedDate = useMemo(
    () =>
      today.toLocaleDateString("en-GB", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
    [today],
  );
  const progressIndex = Math.min(4, Math.floor(dayIndex / 6));

  if (!isVisible) {
    return null;
  }

  return (
    <div className="gdh-daily-popup-backdrop">
      <style>{`
        .gdh-daily-popup-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(6px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2000;
          animation: gdhBackdropFade 0.3s ease-out;
        }

        .gdh-daily-popup-panel {
          position: relative;
          width: min(520px, 92vw);
          background: rgba(255, 255, 255, 0.96);
          backdrop-filter: blur(24px);
          border: 1px solid rgba(255, 255, 255, 0.7);
          border-radius: 24px;
          box-shadow: 0 24px 64px rgba(0, 0, 0, 0.2);
          padding: 36px 32px 28px;
          animation: gdhPopupIn 0.35s ease-out;
        }

        @keyframes gdhBackdropFade {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes gdhPopupIn {
          from { opacity: 0; transform: scale(0.92); }
          to { opacity: 1; transform: scale(1); }
        }

        .gdh-popup-top-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .gdh-popup-date {
          font-size: 12px;
          color: #6b7280;
        }

        .gdh-popup-close {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: rgba(0, 0, 0, 0.06);
          border: none;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: #111827;
        }

        .gdh-popup-badge-row {
          margin-top: 20px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .gdh-category-pill {
          display: inline-flex;
          align-items: center;
          background: var(--green-pale);
          color: var(--green);
          font-size: 11px;
          font-weight: 600;
          padding: 3px 10px;
          border-radius: 99px;
        }

        .gdh-popup-label {
          font-size: 11px;
          color: #6b7280;
        }

        .gdh-popup-title {
          margin-top: 10px;
          font-size: 22px;
          font-weight: 700;
          color: #111827;
        }

        .gdh-popup-content {
          margin-top: 12px;
          font-size: 14px;
          line-height: 1.75;
          color: #374151;
        }

        .gdh-tip-box {
          display: flex;
          gap: 10px;
          background: var(--green-pale);
          border-left: 3px solid var(--green);
          border-radius: 10px;
          padding: 12px 16px;
          margin-top: 16px;
        }

        .gdh-tip-icon {
          min-width: 18px;
          min-height: 18px;
          color: var(--green);
          margin-top: 2px;
        }

        .gdh-tip-text {
          font-size: 13px;
          color: var(--green);
          line-height: 1.5;
        }

        .gdh-progress-row {
          margin-top: 18px;
          display: flex;
          justify-content: center;
          gap: 8px;
        }

        .gdh-progress-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: rgba(0, 0, 0, 0.12);
        }

        .gdh-progress-dot.active {
          background: var(--green);
        }

        .gdh-progress-label {
          margin-top: 8px;
          text-align: center;
          font-size: 11px;
          color: #6b7280;
        }

        .gdh-button-row {
          display: flex;
          gap: 12px;
          margin-top: 22px;
        }

        .gdh-button-primary {
          flex: 1;
          height: 42px;
          border-radius: 10px;
          border: none;
          background: var(--green);
          color: #ffffff;
          font-weight: 500;
          cursor: pointer;
        }

        .gdh-button-secondary {
          flex: 1;
          height: 42px;
          border-radius: 10px;
          border: 1px solid var(--gray-300);
          background: transparent;
          color: var(--gray-500);
          font-size: 13px;
          cursor: pointer;
        }

        .gdh-bottom-note {
          margin-top: 8px;
          font-size: 11px;
          color: #6b7280;
          text-align: center;
        }
      `}</style>
      <div className="gdh-daily-popup-panel" role="dialog" aria-modal="true">
        <div className="gdh-popup-top-row">
          <div className="gdh-popup-date">{formattedDate}</div>
          <button
            className="gdh-popup-close"
            type="button"
            onClick={dismiss}
            aria-label="Close daily insight"
          >
            <X size={16} />
          </button>
        </div>
        <div className="gdh-popup-badge-row">
          <span className="gdh-category-pill">{content.category}</span>
          <div className="gdh-popup-label">Daily Data Insight</div>
        </div>
        <h2 className="gdh-popup-title">{content.title}</h2>
        <div className="gdh-popup-content">{content.content}</div>
        <div className="gdh-tip-box">
          <Lightbulb className="gdh-tip-icon" size={14} />
          <div className="gdh-tip-text">{content.tip}</div>
        </div>
        <div className="gdh-progress-row">
          {Array.from({ length: 5 }).map((_, index) => (
            <span
              key={index}
              className={`gdh-progress-dot ${index === progressIndex ? "active" : ""}`}
            />
          ))}
        </div>
        <div className="gdh-progress-label">Insight {dayIndex + 1} of 30</div>
        <div className="gdh-button-row">
          <button
            className="gdh-button-primary"
            type="button"
            onClick={dismiss}
          >
            Got it, close
          </button>
          <button
            className="gdh-button-secondary"
            type="button"
            onClick={neverShow}
          >
            Don't show this again
          </button>
        </div>
        <div className="gdh-bottom-note">
          This insight updates daily. Source: GhanaDataHub Editorial.
        </div>
      </div>
    </div>
  );
}
