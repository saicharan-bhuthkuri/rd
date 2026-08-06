import React from 'react';
import { ArrowLeft, Server, Banknote, ShieldAlert } from 'lucide-react';

export const BenefitsPage: React.FC = () => {
  const handleBackToHome = () => {
    window.location.hash = '#benefits';
  };

  const fundingTiers = [
    {
      level: "Tier 1: Core Research Proposal",
      amount: "Up to ₹15,000",
      description: "Applies to local hardware procurement, sensor purchases, and basic fabrication costs for prototype building.",
      criteria: "Requires an approved internal research abstract submitted to the Student Committee."
    },
    {
      level: "Tier 2: National Presentation",
      amount: "Up to ₹35,000",
      description: "Covers conference entry registration, flight travel, and basic accommodation for presenting accepted work.",
      criteria: "Accepted paper or abstract at a recognized national journal or IEEE/ACM national conference."
    },
    {
      level: "Tier 3: International Presentation",
      amount: "Up to ₹1,00,000",
      description: "Fully funds travel, registration fees, and accommodation to present papers globally at peer-reviewed symposia.",
      criteria: "Fully accepted manuscript at a Tier-1 international index conference (e.g., NeurIPS, CVPR, SIGGRAPH)."
    }
  ];

  const quotas = [
    { role: "Core Domain Researcher", gpu: "48 Hours continuous runtime / week", storage: "500 GB dedicated NAS space", lab: "24/7 RFID Keycard access" },
    { role: "Associate Member / Contributor", gpu: "12 Hours runtime / week", storage: "100 GB dedicated space", lab: "Hours: 9 AM - 9 PM access" },
    { role: "Faculty / Senior Mentor Advisor", gpu: "Priority preemptive scheduling", storage: "2 TB dedicated storage", lab: "24/7 Master access key" }
  ];

  return (
    <div className="subpage-container container">
      {/* Back button */}
      <a href="/" onClick={handleBackToHome} className="back-btn btn btn-secondary btn-sm">
        <ArrowLeft size={16} /> Back to Overview
      </a>

      {/* Main Section */}
      <section className="subpage-hero">
        <span className="badge">Funding & Resources</span>
        <h1 className="subpage-title">Member Benefits & Allocation</h1>
        <p className="subpage-lead">
          Find detailed breakdowns of institutional hardware quotas, travel sponsorships, and research 
          allowance tiers allocated to active members.
        </p>
      </section>

      {/* Resource Quotas Grid */}
      <section className="benefits-resources-section">
        <h2 className="subpage-section-title">Compute & Lab Allocation Quotas</h2>
        <div className="quotas-table-wrapper">
          <table className="quotas-table">
            <thead>
              <tr>
                <th>Membership Tier</th>
                <th>
                  <div className="table-header-cell"><Server size={14} /> GPU Priority Quota</div>
                </th>
                <th>Storage Volume Limit</th>
                <th>Physical Lab Clearance</th>
              </tr>
            </thead>
            <tbody>
              {quotas.map((q, idx) => (
                <tr key={idx}>
                  <td><strong>{q.role}</strong></td>
                  <td>{q.gpu}</td>
                  <td>{q.storage}</td>
                  <td>{q.lab}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Funding Tiers Section */}
      <section className="benefits-funding-section" style={{ marginTop: '4rem' }}>
        <h2 className="subpage-section-title">Research Funding Allocations</h2>
        <div className="funding-tiers-list">
          {fundingTiers.map((tier, idx) => (
            <div key={idx} className="funding-tier-card card">
              <div className="funding-card-header">
                <h3>{tier.level}</h3>
                <span className="funding-amount-badge">
                  <Banknote size={16} /> {tier.amount}
                </span>
              </div>
              <p className="funding-description">{tier.description}</p>
              <div className="funding-criteria">
                <span className="criteria-label">Allocation Criteria:</span>
                <p>{tier.criteria}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Operational Disclaimer */}
      <div className="benefits-disclaimer-card" style={{ marginTop: '3rem' }}>
        <ShieldAlert size={20} className="disclaimer-icon" />
        <div className="disclaimer-text">
          <h4>Policy Compliance Notice</h4>
          <p>
            All computations and travel budgets must follow the club's code of academic integrity. 
            Computing allocations are audited monthly to ensure optimal resource utilization and prevent idle runs.
          </p>
        </div>
      </div>
    </div>
  );
};
