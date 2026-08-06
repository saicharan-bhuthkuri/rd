import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Brain, Cpu, Atom, Dna, Shield, Database, ArrowRight, Code, FileText, Wrench } from 'lucide-react';

interface Domain {
  id: string;
  icon: React.ReactNode;
  title: string;
  shortDesc: string;
  longDesc: string;
  projects: string[];
  techStack: string[];
  publicationsCount: number;
}

interface ResearchDomainsProps {
  isOverview?: boolean;
}

export const ResearchDomains: React.FC<ResearchDomainsProps> = ({ isOverview }) => {
  const domains: Domain[] = [
    {
      id: "ai-ml",
      icon: <Brain size={24} />,
      title: "AI & Machine Learning",
      shortDesc: "Exploring deep learning architectures, computer vision, NLP, and generative AI models.",
      longDesc: "Our AI & ML lab focuses on the boundaries of neural architectures. We develop custom models for spatial awareness, multi-modal systems, and low-latency inference on edge devices, aiming to bridge core machine learning research with industrial use-cases.",
      projects: ["NeuroForge: Generative design compiler", "AeroVision: Drone spatial navigation model", "MediAnalyze: Automated tumor segmentation tool"],
      techStack: ["PyTorch", "TensorFlow", "Transformers", "CUDA", "Python"],
      publicationsCount: 14
    },
    {
      id: "robotics-iot",
      icon: <Cpu size={24} />,
      title: "Robotics & IoT",
      shortDesc: "Designing autonomous robots, sensor integration, and smart embedded environments.",
      longDesc: "The Robotics and Embedded Systems laboratory researches cyber-physical interactions. We build physical autonomous rovers, sensor-fusion networks, and low-power IoT telemetry systems designed for extreme environments.",
      projects: ["Rover-X: Subterranean exploration vehicle", "SyncMesh: Decentralized IoT array protocol", "HapticGlove: Gesture mapping interface"],
      techStack: ["ROS2", "C++", "FreeRTOS", "Raspberry Pi", "SolidWorks"],
      publicationsCount: 8
    },
    {
      id: "quantum",
      icon: <Atom size={24} />,
      title: "Quantum Computing",
      shortDesc: "Investigating quantum algorithms, error correction, and post-quantum cryptography.",
      longDesc: "Our quantum division focuses on software-defined quantum simulation and future-proof encryption algorithms. We collaborate with external institutes to model noisy intermediate-scale quantum (NISQ) computers.",
      projects: ["Q-Simulate: Multi-qubit compiler emulator", "Post-Crypto: Lattice-based signature system", "Q-Routing: Optimization network solver"],
      techStack: ["Qiskit", "Cirq", "C++", "Python", "OpenQASM"],
      publicationsCount: 5
    },
    {
      id: "bioinformatics",
      icon: <Dna size={24} />,
      title: "Biotechnology & Bioinformatics",
      shortDesc: "Applying computational methods to genomics, molecular modeling, and system biology.",
      longDesc: "We apply advanced data structures and machine learning algorithms to genetic and protein datasets. We are building systems to predict molecular interactions, accelerate drug discoveries, and analyze genomic sequencing data.",
      projects: ["GeneMap-ML: Computational genome sequencer", "FoldPredict: Protein-folding simulation pipeline", "BioGraph: Cellular metabolic pathway simulator"],
      techStack: ["Python", "BioPython", "R", "AlphaFold API", "Nextflow"],
      publicationsCount: 9
    },
    {
      id: "cybersecurity",
      icon: <Shield size={24} />,
      title: "Cybersecurity & Cryptography",
      shortDesc: "Pioneering secure protocols, zero-knowledge proofs, and vulnerability analysis.",
      longDesc: "The Cybersecurity lab is dedicated to proactive system defense and modern cryptographic primitives. We analyze system vulnerabilities, research trustless networking protocols, and evaluate security in decentralized architectures.",
      projects: ["ZeroTrust-Net: Cryptographic identity registry", "VulnScan: Automated firmware threat detector", "ShieldCrypt: Homomorphic database layer"],
      techStack: ["Rust", "Go", "WebAssembly", "Docker", "Wireshark"],
      publicationsCount: 6
    },
    {
      id: "distributed",
      icon: <Database size={24} />,
      title: "Cloud & Distributed Systems",
      shortDesc: "Optimizing database structures, serverless paradigms, and high-availability systems.",
      longDesc: "This domain investigates data consistency, decentralized consensus mechanisms, and high-performance computing clusters. We create database layouts and storage engines designed for petabyte-scale concurrent queries.",
      projects: ["NexusStore: High-throughput KV engine", "MeshOS: Micro-kernel orchestrator", "EventStream: Lossless real-time event broker"],
      techStack: ["Rust", "Kubernetes", "gRPC", "Apache Kafka", "C++"],
      publicationsCount: 11
    }
  ];

  const [selectedDomainId, setSelectedDomainId] = useState<string>(domains[0].id);
  const activeDomain = domains.find(d => d.id === selectedDomainId) || domains[0];

  return (
    <section id="research" className="section">
      <div className="gradient-blob gradient-blob-1 animate-pulse-slow"></div>
      
      <div className="container">
        <div className="section-header">
          <span className="badge badge-secondary">Research & Innovation</span>
          <h2 className="section-title">Domains of Exploration</h2>
          <p className="section-subtitle">
            Our members operate across diverse technological disciplines, working in labs equipped 
            to turn ambitious hypotheses into proven prototypes.
          </p>
        </div>

        {/* Interactive Domain Interface */}
        <div className="domains-container">
          {/* List of Domains */}
          <div className="domains-grid">
            {domains.map((dom) => {
              const isSelected = dom.id === selectedDomainId;
              return (
                <button
                  key={dom.id}
                  onClick={() => setSelectedDomainId(dom.id)}
                  className={`domain-card-btn ${isSelected ? 'selected' : ''}`}
                  aria-selected={isSelected}
                  role="tab"
                >
                  <div className="domain-card-header-icon">
                    {dom.icon}
                  </div>
                  <div className="domain-card-btn-content">
                    <h3>{dom.title}</h3>
                    <p>{dom.shortDesc}</p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Detailed domain panel details */}
          <div className="domain-details-panel">
            <div className="panel-header">
              <div className="panel-icon-bg">
                {activeDomain.icon}
              </div>
              <div className="panel-title-area">
                <h3>{activeDomain.title} Research Division</h3>
                <span className="panel-pub-badge">
                  <FileText size={14} /> {activeDomain.publicationsCount} Publications
                </span>
              </div>
            </div>
            
            <p className="panel-description">{activeDomain.longDesc}</p>

            <div className="panel-sub-grid">
              {/* Projects */}
              <div className="panel-info-block">
                <h4 className="panel-block-title">
                  <Code size={16} /> Key Active Projects
                </h4>
                <ul className="panel-project-list">
                  {activeDomain.projects.map((proj, idx) => (
                    <li key={idx}>
                      <span className="project-bullet"></span>
                      {proj}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Technologies */}
              <div className="panel-info-block">
                <h4 className="panel-block-title">
                  <Wrench size={16} /> Stack & Tools
                </h4>
                <div className="panel-tech-tags">
                  {activeDomain.techStack.map((tech, idx) => (
                    <span key={idx} className="tech-tag">{tech}</span>
                  ))}
                </div>
              </div>
            </div>

            <div className="panel-action">
              <a href="#contact" className="btn btn-outline-primary btn-sm">
                Inquire about this domain <ArrowRight size={14} />
              </a>
            </div>
          </div>
        </div>

        {isOverview && (
          <div className="section-overview-footer" style={{ marginTop: '3.5rem', textAlign: 'center' }}>
            <Link to="/research" className="btn btn-outline-primary">
              View Publications Catalog & Compute Specs &rarr;
            </Link>
          </div>
        )}
      </div>
    </section>
  );
};
