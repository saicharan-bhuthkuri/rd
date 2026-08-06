import React, { useState } from 'react';
import { ArrowLeft, Cpu, FileText, Database, Search, Award } from 'lucide-react';

interface Publication {
  title: string;
  authors: string;
  source: string;
  year: number;
  domain: string;
  citations: number;
  doi: string;
}

export const ResearchPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDomain, setSelectedDomain] = useState('All');

  const handleBackToHome = () => {
    window.location.hash = '#research';
  };

  const publications: Publication[] = [
    {
      title: "NeuroForge: Efficient Neural Architecture Search via Generative Graph Kernels",
      authors: "Siddharth Sen, Rachel Green",
      source: "IEEE Transactions on Neural Networks & Learning Systems",
      year: 2025,
      domain: "AI & ML",
      citations: 18,
      doi: "10.1109/TNNLS.2025.103984"
    },
    {
      title: "SyncMesh: A Decentralized Consensus Protocol for High-Latency IoT Telemetry",
      authors: "Elena Rostova, Kabir Mehta, Marcus Vance",
      source: "ACM Transactions on Internet of Things",
      year: 2025,
      domain: "Cloud & Distributed Systems",
      citations: 7,
      doi: "10.1145/361093.361102"
    },
    {
      title: "Real-time Path Planning in Unstructured Caves using ROS2 and LiDAR Fusion",
      authors: "Kabir Mehta, Rachel Green",
      source: "IEEE International Conference on Robotics and Automation (ICRA)",
      year: 2024,
      domain: "Robotics & IoT",
      citations: 24,
      doi: "10.1109/ICRA.2024.98034"
    },
    {
      title: "Lattice-based Zero Knowledge Proofs for Distributed Ledger Identity Registries",
      authors: "Ananya Deshmukh, Marcus Vance",
      source: "Journal of Cryptographic Engineering",
      year: 2024,
      domain: "Cybersecurity & Cryptography",
      citations: 15,
      doi: "10.1007/s13389-024-10298"
    },
    {
      title: "Accelerating Genomic Sequencing Pipelines through Multi-Core WebAssembly Clusters",
      authors: "Elena Rostova, Meera Nair",
      source: "Oxford Bioinformatics Journal",
      year: 2023,
      domain: "Biotechnology & Bioinformatics",
      citations: 31,
      doi: "10.1093/bioinformatics/btad109"
    }
  ];

  const domains = ["All", "AI & ML", "Robotics & IoT", "Quantum Computing", "Biotechnology & Bioinformatics", "Cybersecurity & Cryptography", "Cloud & Distributed Systems"];

  const filteredPublications = publications.filter(pub => {
    const matchesSearch = pub.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          pub.authors.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDomain = selectedDomain === 'All' || pub.domain === selectedDomain;
    return matchesSearch && matchesDomain;
  });

  return (
    <div className="subpage-container container">
      {/* Back button */}
      <a href="/" onClick={handleBackToHome} className="back-btn btn btn-secondary btn-sm">
        <ArrowLeft size={16} /> Back to Overview
      </a>

      {/* Main Section */}
      <section className="subpage-hero">
        <span className="badge badge-secondary">Technical Portfolio</span>
        <h1 className="subpage-title">Research & Publications</h1>
        <p className="subpage-lead">
          Explore our published scientific papers, citation matrices, and details of the specialized compute 
          clusters driving our experiments.
        </p>
      </section>

      {/* Hardware Specs Section */}
      <section className="research-specs-section">
        <h2 className="subpage-section-title">Hardware & Lab Assets</h2>
        <div className="specs-grid">
          <div className="spec-card">
            <Cpu className="spec-icon" size={24} />
            <h3>GPU Compute Nodes</h3>
            <p>Our dedicated server rack is equipped for training deep neural architectures.</p>
            <ul>
              <li>4x NVIDIA A100 Tensor Core GPUs (80GB VRAM)</li>
              <li>2x NVIDIA H100 Tensor Core GPUs (80GB VRAM)</li>
              <li>AMD EPYC 9654 (96 Cores, 192 Threads) CPU hosts</li>
              <li>1.5TB DDR5 Server RAM</li>
            </ul>
          </div>

          <div className="spec-card">
            <Database className="spec-icon" size={24} />
            <h3>Storage & Connectivity</h3>
            <p>High-throughput networks designed for fast access to large genomics and vision datasets.</p>
            <ul>
              <li>200TB Ceph Distributed Storage array</li>
              <li>Dual-port 100GbE fiber uplink connectivity</li>
              <li>Local cache servers (24TB NVMe pool)</li>
              <li>Secure distributed database replication</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Publications Repository Section */}
      <section className="publications-section" style={{ marginTop: '4rem' }}>
        <h2 className="subpage-section-title">Publications Catalog</h2>
        
        {/* Search and filter controls */}
        <div className="pub-controls">
          <div className="search-bar-wrapper">
            <Search className="search-icon" size={18} />
            <input
              type="text"
              placeholder="Search papers, authors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="domain-filter-group">
            {domains.map((dom) => (
              <button
                key={dom}
                onClick={() => setSelectedDomain(dom)}
                className={`filter-tag ${selectedDomain === dom ? 'active' : ''}`}
              >
                {dom}
              </button>
            ))}
          </div>
        </div>

        {/* Papers List */}
        <div className="pub-list">
          {filteredPublications.length > 0 ? (
            filteredPublications.map((pub, idx) => (
              <div key={idx} className="pub-card card">
                <div className="pub-card-header">
                  <span className="pub-domain-badge">{pub.domain}</span>
                  <span className="pub-citations">
                    <Award size={14} /> {pub.citations} Citations
                  </span>
                </div>
                <h3 className="pub-title">{pub.title}</h3>
                <p className="pub-authors">Authors: <strong>{pub.authors}</strong></p>
                <p className="pub-source">{pub.source} &middot; {pub.year}</p>
                <div className="pub-actions">
                  <span className="pub-doi">DOI: {pub.doi}</span>
                  <a href="#" className="btn btn-outline-primary btn-sm btn-pdf">
                    <FileText size={14} /> Download PDF
                  </a>
                </div>
              </div>
            ))
          ) : (
            <div className="no-results-card">
              <p>No research publications found matching your search parameters.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
