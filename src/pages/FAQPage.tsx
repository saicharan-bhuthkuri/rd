import React, { useState } from 'react';
import { ArrowLeft, HelpCircle, ChevronDown, UserCheck, Cpu, Banknote } from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string;
  category: 'Recruitment' | 'Infrastructure' | 'Funding';
}

export const FAQPage: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<'All' | 'Recruitment' | 'Infrastructure' | 'Funding'>('All');
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const handleBackToHome = () => {
    window.location.hash = '#faqs';
  };

  const faqs: FAQItem[] = [
    {
      category: "Recruitment",
      question: "Who is eligible to apply for the R&D Club?",
      answer: "Applications are open to all undergraduate and postgraduate students, regardless of their major or department. We welcome anyone with a strong curiosity, logical problem-solving aptitude, and basic technical/mathematical literacy."
    },
    {
      category: "Recruitment",
      question: "What is the recruitment process and how are members selected?",
      answer: "Recruitment starts with filling out the application form on this website. Our committee reviews all profiles. Shortlisted candidates are invited for a 20-minute conversational interview where we discuss your interests, project ideas, and past code/prototypes (if any)."
    },
    {
      category: "Infrastructure",
      question: "What GPU and Compute server systems are available?",
      answer: "Our labs host a dedicated HPC rack containing four NVIDIA A100 Tensor Core nodes and two H100 GPU nodes. Compute time is scheduled through a local Slurm partition cluster to allocate runtime quotas fairly."
    },
    {
      category: "Infrastructure",
      question: "Are members allowed to access the physical lab at any hour?",
      answer: "Yes, Core Domain Researchers are issued RFID security keycards allowing 24/7 access to the main labs in the Computing Block. Associate members have clearance from 9:00 AM to 9:00 PM."
    },
    {
      category: "Funding",
      question: "Does the club sponsor registration fees for international conferences?",
      answer: "Yes, absolutely. For manuscripts accepted at reputable indexed venues (IEEE, ACM, Springer, NeurIPS, CVPR), the club sponsors up to 100% of the conference registration fees and travel expenses."
    },
    {
      category: "Funding",
      question: "Is there seed funding for student hardware prototypes?",
      answer: "Yes. Approved research proposals are allocated Tier-1 funding up to ₹15,000 to purchase sensors, microcontrollers, communication shields, or mechanical hardware needed for physical testing."
    }
  ];

  const filteredFaqs = faqs.filter(faq => activeCategory === 'All' || faq.category === activeCategory);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="subpage-container container">
      {/* Back button */}
      <a href="/" onClick={handleBackToHome} className="back-btn btn btn-secondary btn-sm">
        <ArrowLeft size={16} /> Back to Overview
      </a>

      {/* Main Section */}
      <section className="subpage-hero">
        <span className="badge">Knowledge Hub</span>
        <h1 className="subpage-title">Support & FAQs</h1>
        <p className="subpage-lead">
          Find deep answers to operational policies, computational allocations, travel subsidies, and 
          admissions queries.
        </p>
      </section>

      {/* Category selector */}
      <div className="faq-page-tabs">
        <button
          onClick={() => { setActiveCategory('All'); setOpenIndex(null); }}
          className={`faq-tab-btn ${activeCategory === 'All' ? 'active' : ''}`}
        >
          All Categories
        </button>
        <button
          onClick={() => { setActiveCategory('Recruitment'); setOpenIndex(null); }}
          className={`faq-tab-btn ${activeCategory === 'Recruitment' ? 'active' : ''}`}
        >
          <UserCheck size={14} style={{ marginRight: '0.375rem' }} /> Recruitment
        </button>
        <button
          onClick={() => { setActiveCategory('Infrastructure'); setOpenIndex(null); }}
          className={`faq-tab-btn ${activeCategory === 'Infrastructure' ? 'active' : ''}`}
        >
          <Cpu size={14} style={{ marginRight: '0.375rem' }} /> Infrastructure
        </button>
        <button
          onClick={() => { setActiveCategory('Funding'); setOpenIndex(null); }}
          className={`faq-tab-btn ${activeCategory === 'Funding' ? 'active' : ''}`}
        >
          <Banknote size={14} style={{ marginRight: '0.375rem' }} /> Funding & Grants
        </button>
      </div>

      {/* Accordion container */}
      <div className="faq-page-list" style={{ marginTop: '2.5rem' }}>
        {filteredFaqs.map((faq, idx) => {
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
    </div>
  );
};
