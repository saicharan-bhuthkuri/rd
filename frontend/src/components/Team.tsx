import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, BookOpen } from 'lucide-react';

const GithubIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
  </svg>
);

const LinkedinIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
    <rect x="2" y="9" width="4" height="12"></rect>
    <circle cx="4" cy="4" r="2"></circle>
  </svg>
);

const TwitterIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path>
  </svg>
);

interface Member {
  name: string;
  role: string;
  category: 'Faculty Advisory' | 'Student Committee';
  initials: string;
  avatarBg: string;
  focus: string;
  github?: string;
  linkedin?: string;
  twitter?: string;
  mail: string;
}

interface TeamProps {
  isOverview?: boolean;
}

export const Team: React.FC<TeamProps> = ({ isOverview }) => {
  const team: Member[] = [
    {
      name: "Dr. Ashok Kumar Vootla",
      role: "Chief Coordinator",
      category: "Faculty Advisory",
      initials: "AV",
      avatarBg: "linear-gradient(135deg, hsl(210, 100%, 90%) 0%, hsl(210, 100%, 75%) 100%)",
      focus: "Institutional R&D & Strategy Coordination",
      mail: "ashok.vootla@rdclub.edu"
    },
    {
      name: "Kasarapu Ashok",
      role: "Coordinator",
      category: "Faculty Advisory",
      initials: "KA",
      avatarBg: "linear-gradient(135deg, hsl(140, 70%, 90%) 0%, hsl(140, 70%, 75%) 100%)",
      focus: "Program Management & Operations",
      mail: "kasarapu.ashok@rdclub.edu"
    },
    {
      name: "Gaddam Lakshmi",
      role: "Faculty & Head of AIML",
      category: "Faculty Advisory",
      initials: "GL",
      avatarBg: "linear-gradient(135deg, hsl(340, 80%, 90%) 0%, hsl(340, 80%, 75%) 100%)",
      focus: "Machine Learning & Neural Networks",
      mail: "gaddam.lakshmi@rdclub.edu"
    },
    {
      name: "Syed Khaja Pasha",
      role: "Faculty",
      category: "Faculty Advisory",
      initials: "SP",
      avatarBg: "linear-gradient(135deg, hsl(280, 80%, 90%) 0%, hsl(280, 80%, 75%) 100%)",
      focus: "Data Engineering & Systems Architecture",
      mail: "khaja.pasha@rdclub.edu"
    },
    {
      name: "Prabhakar Parlapalli",
      role: "HOD of ECE",
      category: "Faculty Advisory",
      initials: "PP",
      avatarBg: "linear-gradient(135deg, hsl(25, 95%, 90%) 0%, hsl(25, 95%, 75%) 100%)",
      focus: "Embedded Systems & Signal Processing",
      mail: "prabhakar.p@rdclub.edu"
    },
    {
      name: "Ayhya",
      role: "Student Coordinator",
      category: "Student Committee",
      initials: "AY",
      avatarBg: "linear-gradient(135deg, hsl(271, 91%, 90%) 0%, hsl(271, 91%, 75%) 100%)",
      focus: "Research & Operations Coordination",
      mail: "ayhya@rdclub.edu"
    }
  ];

  const faculty = team.filter(m => m.category === 'Faculty Advisory');
  const students = team.filter(m => m.category === 'Student Committee');

  return (
    <section id="team" className="section section-bg-alt">
      <div className="gradient-blob gradient-blob-3 animate-pulse-slow"></div>
      
      <div className="container">
        <div className="section-header">
          <span className="badge badge-secondary">Our Board & Core Committee</span>
          <h2 className="section-title">The Innovators Behind the Club</h2>
          <p className="section-subtitle">
            Meet the researchers, developers, and advisors driving our research projects and leading 
            technical efforts.
          </p>
        </div>

        {/* Faculty Advisors */}
        <div className="team-category-container">
          <h3 className="team-category-title">Faculty Advisory Board</h3>
          <div className="team-grid">
            {faculty.map((member, idx) => (
              <div key={idx} className="team-card card">
                <div className="team-card-avatar-wrapper">
                  <div className="team-avatar" style={{ background: member.avatarBg }}>
                    {member.initials}
                  </div>
                </div>
                <h4 className="team-member-name">{member.name}</h4>
                <p className="team-member-role">{member.role}</p>
                
                <div className="team-member-focus">
                  <BookOpen size={14} className="focus-icon" />
                  <span>{member.focus}</span>
                </div>

                <div className="team-member-socials">
                  {member.linkedin && (
                    <a href={member.linkedin} aria-label="LinkedIn profile" className="social-icon-link">
                      <LinkedinIcon />
                    </a>
                  )}
                  {member.twitter && (
                    <a href={member.twitter} aria-label="Twitter profile" className="social-icon-link">
                      <TwitterIcon />
                    </a>
                  )}
                  <a href={`mailto:${member.mail}`} aria-label="Send email" className="social-icon-link">
                    <Mail size={18} />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Student Committee */}
        <div className="team-category-container" style={{ marginTop: '4rem' }}>
          <h3 className="team-category-title">Student Executive Committee</h3>
          <div className="team-grid">
            {students.map((member, idx) => (
              <div key={idx} className="team-card card">
                <div className="team-card-avatar-wrapper">
                  <div className="team-avatar" style={{ background: member.avatarBg }}>
                    {member.initials}
                  </div>
                </div>
                <h4 className="team-member-name">{member.name}</h4>
                <p className="team-member-role">{member.role}</p>
                
                <div className="team-member-focus">
                  <BookOpen size={14} className="focus-icon" />
                  <span>{member.focus}</span>
                </div>

                <div className="team-member-socials">
                  {member.github && (
                    <a href={member.github} aria-label="GitHub profile" className="social-icon-link">
                      <GithubIcon />
                    </a>
                  )}
                  {member.linkedin && (
                    <a href={member.linkedin} aria-label="LinkedIn profile" className="social-icon-link">
                      <LinkedinIcon />
                    </a>
                  )}
                  {member.twitter && (
                    <a href={member.twitter} aria-label="Twitter profile" className="social-icon-link">
                      <TwitterIcon />
                    </a>
                  )}
                  <a href={`mailto:${member.mail}`} aria-label="Send email" className="social-icon-link">
                    <Mail size={18} />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>

        {isOverview && (
          <div className="section-overview-footer" style={{ marginTop: '3.5rem', textAlign: 'center' }}>
            <Link to="/team" className="btn btn-outline-primary">
              Meet Our Student Committee & Alumni Registry &rarr;
            </Link>
          </div>
        )}
      </div>
    </section>
  );
};
