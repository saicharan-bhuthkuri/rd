import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { HelpCircle, ChevronDown } from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQProps {
  isOverview?: boolean;
}

export const FAQ: React.FC<FAQProps> = ({ isOverview }) => {
  const faqs: FAQItem[] = [
    {
      question: "Who is eligible to apply for the R&D Club?",
      answer: "Applications are open to all undergraduate and postgraduate students, regardless of their major or department. We welcome anyone with a strong curiosity, logical problem-solving aptitude, and basic technical/mathematical literacy."
    },
    {
      question: "Do I need prior academic research experience to join?",
      answer: "Absolutely not. One of our core missions is to teach research methodology. We will guide you through reading scientific literature, writing structured LaTeX drafts, formatting abstracts, and designing clean benchmark experiments."
    },
    {
      question: "What is the recruitment process and how are members selected?",
      answer: "Recruitment starts with filling out the application form on this website. Our committee reviews all profiles. Shortlisted candidates are invited for a 20-minute conversational interview where we discuss your interests, project ideas, and past code/prototypes (if any)."
    },
    {
      question: "What is the expected weekly time commitment?",
      answer: "We expect members to dedicate approximately 6 to 10 hours per week. This includes attending bi-weekly lab progress synopses, working on your assigned project tasks, and collaborating with fellow researchers."
    },
    {
      question: "Can I pitch and lead my own research project?",
      answer: "Yes! In fact, we actively encourage it. Members can submit project proposals to the Advisory Board at any time. Once approved, the club will assign co-researchers, designate a mentor, and provide funding for hardware/publishing."
    },
    {
      question: "How are research domains assigned to new recruits?",
      answer: "During recruitment, you can express interest in up to two domains (e.g. AI/ML and Robotics). Accepted members are matched based on their expertise, developmental capacity, and project availability, though cross-domain collaboration is highly encouraged."
    }
  ];

  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faqs" className="section">
      <div className="gradient-blob gradient-blob-1 animate-pulse-slow"></div>
      
      <div className="container faq-container">
        <div className="section-header">
          <span className="badge">FAQ Section</span>
          <h2 className="section-title">Frequently Asked Questions</h2>
          <p className="section-subtitle">
            Find answers to common queries regarding recruitment, project structures, and club resources.
          </p>
        </div>

        <div className="faq-list">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div key={idx} className={`faq-card ${isOpen ? 'open' : ''}`}>
                <button
                  className="faq-question-btn"
                  onClick={() => toggleFAQ(idx)}
                  aria-expanded={isOpen}
                >
                  <div className="faq-question-title">
                    <HelpCircle size={18} className="faq-help-icon" />
                    <span>{faq.question}</span>
                  </div>
                  <ChevronDown size={18} className={`faq-arrow-icon ${isOpen ? 'rotate' : ''}`} />
                </button>
                <div className={`faq-answer-wrapper ${isOpen ? 'expanded' : ''}`}>
                  <div className="faq-answer-content">
                    <p>{faq.answer}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {isOverview && (
          <div className="section-overview-footer" style={{ marginTop: '3.5rem', textAlign: 'center' }}>
            <Link to="/faqs" className="btn btn-outline-primary">
              Access Full Categorized FAQ Portal &rarr;
            </Link>
          </div>
        )}
      </div>
    </section>
  );
};
