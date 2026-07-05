import { useMemo } from "react";
import { Lightbulb, X } from "lucide-react";

// ---------------------------------------------------------------------------
// 30-day rotating content. Index = date.getDate() - 1 (0-based).
// Days 1-5:   Data Privacy fundamentals
// Days 6-10:  Data Piracy and intellectual property
// Days 11-15: Open data licences (CC BY, CC0, ODbL)
// Days 16-20: Data security and safe sharing practices
// Days 21-25: Ghana Data Protection Act 2012 key provisions
// Days 26-30: Responsible data use and citation etiquette
// ---------------------------------------------------------------------------
const CONTENT_ITEMS = [
  // Days 1-5: Data Privacy Fundamentals
  {
    title: "Your Data Has Rights",
    category: "Data Privacy",
    content:
      "Personal data includes any information that can identify an individual — names, emails, phone numbers, and even IP addresses. Under Ghana's Data Protection Act 2012, organisations must tell you what data they collect and why.",
    tip: "Always read the privacy policy before sharing personal information on any platform.",
  },
  {
    title: "Consent Is the Cornerstone",
    category: "Data Privacy",
    content:
      "Data controllers must obtain your informed, freely given consent before processing your personal data. Pre-ticked boxes or bundled permissions do not count as valid consent — you should always be able to say no without losing access to a core service.",
    tip: "Review and revoke app permissions regularly in your device settings.",
  },
  {
    title: "The Right to Access Your Data",
    category: "Data Privacy",
    content:
      "You have the right to request a copy of all personal data an organisation holds about you. Most frameworks — including Ghana's DPA 2012 — require responses within 30 days. This empowers you to spot errors and challenge unlawful processing.",
    tip: "Submit a Subject Access Request to any organisation you suspect holds your data without clear justification.",
  },
  {
    title: "Data Minimisation Matters",
    category: "Data Privacy",
    content:
      "Organisations should collect only the data that is strictly necessary for a stated purpose — nothing more. Excess data collection increases breach risk and erodes trust. When designing surveys or forms, question every field you add.",
    tip: "If a sign-up form asks for your date of birth and you cannot see why they need it, consider whether to proceed.",
  },
  {
    title: "Purpose Limitation Principle",
    category: "Data Privacy",
    content:
      "Data collected for one purpose must not be silently repurposed for something else. If a hospital collects your address for appointment reminders, it cannot later sell that address to advertisers without fresh consent.",
    tip: "Check terms of service updates — organisations sometimes expand data uses through policy changes.",
  },
  // Days 6-10: Data Piracy & Intellectual Property
  {
    title: "What Is Data Piracy?",
    category: "Data Piracy & IP",
    content:
      "Data piracy refers to the unauthorised copying, distribution, or use of datasets, databases, and digital content protected by intellectual property law. Just as music piracy harms artists, data piracy harms the researchers and organisations who invested in data collection.",
    tip: "Always check the licence or terms of use of a dataset before downloading or republishing it.",
  },
  {
    title: "Databases Have Legal Protection",
    category: "Data Piracy & IP",
    content:
      "In many jurisdictions, database creators hold a 'sui generis' database right that prevents extraction or re-use of substantial parts without permission, even if the underlying facts are not individually copyrightable. Ghana's Copyright Act 2005 provides similar protections.",
    tip: "Look for an explicit licence statement on any dataset page — absence of a licence does not mean free use.",
  },
  {
    title: "Scraping Is Not Always Legal",
    category: "Data Piracy & IP",
    content:
      "Automated scraping of a website can infringe database rights or breach terms of service, even if the pages are publicly visible. Courts in several countries have ruled against scrapers who re-sold or republished the harvested data commercially.",
    tip: "If you need data from a website at scale, contact the owner and ask for an official data feed or API access.",
  },
  {
    title: "Attribution vs. Plagiarism",
    category: "Data Piracy & IP",
    content:
      "Using someone else's dataset without credit is a form of academic and professional dishonesty. Proper attribution not only respects the creator's work but also allows readers to verify the source and understand data provenance.",
    tip: "Cite datasets in your reports the same way you would cite a journal article — author, title, year, DOI or URL.",
  },
  {
    title: "Commercial vs. Non-Commercial Use",
    category: "Data Piracy & IP",
    content:
      "Many datasets are licensed for non-commercial use only. Using such data in a product you sell — even indirectly — can expose you to legal liability. Always verify whether your intended use falls within the licence's commercial clause.",
    tip: "If your use case is commercial, seek datasets under permissive licences like CC BY or public domain (CC0).",
  },
  // Days 11-15: Open Data Licences
  {
    title: "Creative Commons at a Glance",
    category: "Open Data Licences",
    content:
      "Creative Commons (CC) licences let creators specify how their work may be reused. The spectrum runs from CC0 (no rights reserved) to CC BY-NC-ND (attribution required, no commercial use, no derivatives). Understanding the abbreviations helps you choose the right dataset for your project.",
    tip: "Bookmark creativecommons.org/licenses for a plain-English breakdown of every CC licence variant.",
  },
  {
    title: "CC0 — Public Domain Dedication",
    category: "Open Data Licences",
    content:
      "CC0 is the most permissive option: the creator waives all copyright and related rights worldwide. You can copy, modify, distribute, and use CC0 data for any purpose — commercial or otherwise — without asking permission or providing attribution.",
    tip: "CC0 is ideal when you want your research outputs to have maximum reuse potential globally.",
  },
  {
    title: "CC BY — Attribution Required",
    category: "Open Data Licences",
    content:
      "CC BY allows any reuse — including commercial — as long as you give appropriate credit to the original creator. It is the standard licence for many open-access journals and government open-data portals, encouraging reuse while ensuring recognition.",
    tip: "When using CC BY data, include the creator's name, dataset title, source URL, and the licence type in your output.",
  },
  {
    title: "ODbL — The Open Database Licence",
    category: "Open Data Licences",
    content:
      "The Open Database Licence (ODbL) is designed specifically for databases. It requires attribution and mandates that any public database you produce using ODbL data must itself be released under ODbL ('share-alike'). OpenStreetMap uses ODbL.",
    tip: "If you build a product using ODbL data, check whether your derived database must also be published openly.",
  },
  {
    title: "Choosing the Right Licence for Your Data",
    category: "Open Data Licences",
    content:
      "Publishing data without a licence leaves users uncertain about what is permitted, which can reduce uptake significantly. Choosing the most permissive licence that still meets your requirements encourages wider use, more citations, and greater research impact.",
    tip: "Use the choosealicense.com or CC licence chooser tool to select a licence that matches your sharing goals.",
  },
  // Days 16-20: Data Security & Safe Sharing
  {
    title: "Encrypt Before You Share",
    category: "Data Security",
    content:
      "When transmitting sensitive datasets, encryption ensures only the intended recipient can read them. Use industry-standard protocols such as TLS for web transfers and GPG or AES-256 for file-level encryption before attaching data to emails.",
    tip: "Never send personal or sensitive data as a plain-text email attachment — use an encrypted file or a secure link.",
  },
  {
    title: "Access Controls Protect Data",
    category: "Data Security",
    content:
      "Principle of least privilege means users and systems should access only the data they genuinely need. Overly broad permissions are a leading cause of accidental exposure and insider threats. Review permissions regularly and remove stale accounts.",
    tip: "Audit who has access to each shared dataset at least once a quarter.",
  },
  {
    title: "Anonymisation vs. Pseudonymisation",
    category: "Data Security",
    content:
      "Anonymised data has had all identifiers permanently removed so that re-identification is not reasonably possible. Pseudonymised data replaces identifiers with codes — safer for analysis but still personal data under most laws. Know the difference before sharing.",
    tip: "Use k-anonymity or differential privacy techniques to quantify the re-identification risk of any dataset you publish.",
  },
  {
    title: "Secure Data Storage Basics",
    category: "Data Security",
    content:
      "Storing sensitive data on unencrypted USB drives, personal email accounts, or public cloud folders without access controls is a major security risk. Use dedicated, access-controlled repositories — like GhanaDataHub — that enforce authentication and logging.",
    tip: "Enable two-factor authentication on every platform where you store or access research data.",
  },
  {
    title: "Incident Response for Data Breaches",
    category: "Data Security",
    content:
      "If you suspect a data breach, time matters. Notify your data protection officer or IT security team immediately. Ghana's DPA 2012 requires data controllers to report breaches to the Data Protection Commission promptly to limit harm to data subjects.",
    tip: "Keep an up-to-date contact list for your organisation's data protection officer so you can report incidents fast.",
  },
  // Days 21-25: Ghana Data Protection Act 2012
  {
    title: "Ghana's DPA 2012 — An Overview",
    category: "Ghana DPA 2012",
    content:
      "Ghana's Data Protection Act 843 (2012) established the Data Protection Commission and set out rights for individuals and obligations for organisations that collect and process personal data. It is one of the pioneering data protection laws in Africa.",
    tip: "Visit dataprotection.org.gh to read the full Act and access guidance from the Data Protection Commission.",
  },
  {
    title: "Eight Principles of the Ghana DPA",
    category: "Ghana DPA 2012",
    content:
      "The Act requires that personal data be collected for a specific purpose, accurate, adequate, not excessive, not kept longer than necessary, secured, and transferred only to countries with adequate protection. These eight principles mirror international best practice.",
    tip: "Use the eight principles as a checklist every time you design a new data collection process.",
  },
  {
    title: "Registering as a Data Controller",
    category: "Ghana DPA 2012",
    content:
      "Any individual or organisation that determines the purpose and means of processing personal data in Ghana must register with the Data Protection Commission. Operating without registration can result in fines and prosecution under the Act.",
    tip: "Check whether your organisation or research project qualifies as a data controller and register if required.",
  },
  {
    title: "Individual Rights Under the DPA",
    category: "Ghana DPA 2012",
    content:
      "Ghanaian data subjects have the right to know what data is held about them, request corrections, and object to processing in certain circumstances. Organisations must respond to these requests within 21 days and cannot charge excessive fees.",
    tip: "If a Ghanaian organisation ignores your data request, escalate to the Data Protection Commission at info@dataprotection.org.gh.",
  },
  {
    title: "Cross-Border Data Transfers",
    category: "Ghana DPA 2012",
    content:
      "The Ghana DPA restricts transfers of personal data to countries that do not provide adequate data protection, unless specific safeguards are in place. This mirrors the EU's adequacy framework and protects Ghanaian citizens' data internationally.",
    tip: "Before sending personal data offshore, confirm the destination country's data protection status with your legal team.",
  },
  // Days 26-30: Responsible Data Use & Citation
  {
    title: "Cite Your Data Sources",
    category: "Responsible Data Use",
    content:
      "Citing datasets properly enables other researchers to verify your findings, build on your work, and give credit to the data creators. A standard data citation includes the creator, title, repository name, year, and a persistent identifier such as a DOI.",
    tip: "Use a reference manager like Zotero, which now supports dataset citation types automatically.",
  },
  {
    title: "Data Sharing Builds Science",
    category: "Responsible Data Use",
    content:
      "Open data sharing accelerates discovery by allowing others to replicate, validate, and extend your research. Studies show that papers with openly shared datasets receive significantly more citations than those without public data.",
    tip: "Deposit your research data in a recognised repository like GhanaDataHub, Zenodo, or the Harvard Dataverse.",
  },
  {
    title: "Do No Harm With Data",
    category: "Responsible Data Use",
    content:
      "Before publishing or sharing data, consider whether it could harm the communities or individuals it describes — particularly for sensitive topics like health, ethnicity, or economic status. Responsible data practice includes a harm assessment at every stage.",
    tip: "Conduct a data ethics review with stakeholders from the community represented in your dataset before publishing.",
  },
  {
    title: "Data Provenance and Lineage",
    category: "Responsible Data Use",
    content:
      "Provenance records where data came from, who collected it, how it was transformed, and when. Without clear lineage, errors can propagate invisibly through analyses and policy decisions. Documenting provenance is an act of scientific integrity.",
    tip: "Include a data readme file with every dataset you publish, describing collection methods and any transformations applied.",
  },
  {
    title: "Sustaining Open Data Ecosystems",
    category: "Responsible Data Use",
    content:
      "Open data only remains valuable if communities contribute as well as consume. Uploading your datasets, reporting data errors, and contributing to metadata enrichment helps sustain the ecosystem for everyone — including future researchers across Africa.",
    tip: "Pledge to upload at least one dataset or data improvement to GhanaDataHub each quarter.",
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  // Map day 0-29 → dot 0-4  (every 6 days = new dot)
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
          -webkit-backdrop-filter: blur(6px);
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
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(255, 255, 255, 0.7);
          border-radius: 24px;
          box-shadow: 0 24px 64px rgba(0, 0, 0, 0.2);
          padding: 36px 32px 28px;
          animation: gdhPopupIn 0.35s ease-out;
        }

        @keyframes gdhBackdropFade {
          from { opacity: 0; }
          to   { opacity: 1; }
        }

        @keyframes gdhPopupIn {
          from { opacity: 0; transform: scale(0.92); }
          to   { opacity: 1; transform: scale(1); }
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
          flex-shrink: 0;
          transition: background 0.15s;
        }
        .gdh-popup-close:hover {
          background: rgba(0, 0, 0, 0.12);
        }

        .gdh-popup-badge-row {
          margin-top: 20px;
          display: flex;
          flex-direction: column;
          gap: 4px;
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
          align-self: flex-start;
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
          font-family: "Sora", sans-serif;
          line-height: 1.3;
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
          align-items: flex-start;
          background: var(--green-pale);
          border-left: 3px solid var(--green);
          border-radius: 10px;
          padding: 12px 16px;
          margin-top: 16px;
        }

        .gdh-tip-icon {
          min-width: 14px;
          min-height: 14px;
          color: var(--green);
          margin-top: 2px;
          flex-shrink: 0;
        }

        .gdh-tip-text {
          font-size: 13px;
          color: var(--green);
          line-height: 1.55;
        }

        .gdh-progress-area {
          margin-top: 18px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
        }

        .gdh-progress-row {
          display: flex;
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
          font-size: 14px;
          cursor: pointer;
          transition: background 0.15s;
        }
        .gdh-button-primary:hover {
          background: var(--green-light);
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
          transition: background 0.15s;
        }
        .gdh-button-secondary:hover {
          background: var(--gray-100);
        }

        .gdh-bottom-note {
          margin-top: 8px;
          font-size: 11px;
          color: #6b7280;
          text-align: center;
        }
      `}</style>
      <div className="gdh-daily-popup-panel" role="dialog" aria-modal="true" aria-label="Daily Data Insight">
        {/* Top Row */}
        <div className="gdh-popup-top-row">
          <div className="gdh-popup-date">{formattedDate}</div>
          <button
            id="gdh-popup-close-btn"
            className="gdh-popup-close"
            type="button"
            onClick={dismiss}
            aria-label="Close daily insight"
          >
            <X size={16} />
          </button>
        </div>

        {/* Category Badge */}
        <div className="gdh-popup-badge-row">
          <span className="gdh-category-pill">{content.category}</span>
          <div className="gdh-popup-label">Daily Data Insight</div>
        </div>

        {/* Title */}
        <h2 className="gdh-popup-title">{content.title}</h2>

        {/* Content */}
        <div className="gdh-popup-content">{content.content}</div>

        {/* Tip Box */}
        <div className="gdh-tip-box">
          <Lightbulb className="gdh-tip-icon" size={14} />
          <div className="gdh-tip-text">{content.tip}</div>
        </div>

        {/* Progress Dots */}
        <div className="gdh-progress-area">
          <div className="gdh-progress-row">
            {Array.from({ length: 5 }).map((_, index) => (
              <span
                key={index}
                className={`gdh-progress-dot ${index === progressIndex ? "active" : ""}`}
              />
            ))}
          </div>
          <div className="gdh-progress-label">Insight {dayIndex + 1} of 30</div>
        </div>

        {/* Dismiss Buttons */}
        <div className="gdh-button-row">
          <button
            id="gdh-popup-got-it-btn"
            className="gdh-button-primary"
            type="button"
            onClick={dismiss}
          >
            Got it, close
          </button>
          <button
            id="gdh-popup-never-btn"
            className="gdh-button-secondary"
            type="button"
            onClick={neverShow}
          >
            Don't show this again
          </button>
        </div>

        {/* Bottom Note */}
        <div className="gdh-bottom-note">
          This insight updates daily. Source: GhanaDataHub Editorial.
        </div>
      </div>
    </div>
  );
}
