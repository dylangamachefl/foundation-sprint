import React, { useState } from 'react';
import { sprintAPI } from '../services/api';

const ResearchPanel = ({ onNext, sprintId, sprintData }) => {
  const [researchData, setResearchData] = useState({});
  const [activeRequest, setActiveRequest] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const researchRequests = sprintData?.researchRequests || [];

  const handleResearchInput = (requestId, data) => {
    setResearchData(prev => ({
      ...prev,
      [requestId]: data
    }));
  };

  const handleSubmitResearch = async () => {
    setSubmitting(true);
    try {
      await sprintAPI.submitResearch(sprintId, researchData);
      onNext('decisions');
    } catch (error) {
      alert('Failed to submit research: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const canSubmit = researchRequests.length > 0 && 
    Object.keys(researchData).length >= Math.min(3, researchRequests.length);

  return (
    <div className="research-panel">
      <h2>Research Requests from AI Agents</h2>
      <p>Your AI agents have identified key research areas. Complete at least 3 to continue.</p>

      <div className="research-progress">
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{width: `${(Object.keys(researchData).length / researchRequests.length) * 100}%`}}
          />
        </div>
        <span>{Object.keys(researchData).length} of {researchRequests.length} completed</span>
      </div>

      <div className="research-interface">
        <div className="research-sidebar">
          <h3>Research Requests</h3>
          {researchRequests.map((request, index) => (
            <div 
              key={request.id}
              className={`research-request-item ${activeRequest === index ? 'active' : ''} ${researchData[request.id] ? 'completed' : ''}`}
              onClick={() => setActiveRequest(index)}
            >
              <div className="request-header">
                <span className="agent-badge">{request.agent}</span>
                {researchData[request.id] && <span className="completed-badge">✓</span>}
              </div>
              <div className="request-preview">
                {request.question.substring(0, 60)}...
              </div>
            </div>
          ))}
        </div>

        <div className="research-detail">
          {researchRequests[activeRequest] && (
            <ResearchRequestDetail
              request={researchRequests[activeRequest]}
              value={researchData[researchRequests[activeRequest].id] || ''}
              onChange={(data) => handleResearchInput(researchRequests[activeRequest].id, data)}
            />
          )}
        </div>
      </div>

      <div className="research-actions">
        <button 
          className="btn-secondary"
          onClick={() => setActiveRequest((activeRequest + 1) % researchRequests.length)}
        >
          Skip This Request
        </button>
        
        <button 
          className="btn-primary"
          onClick={handleSubmitResearch}
          disabled={!canSubmit || submitting}
        >
          {submitting ? 'Submitting Research...' : `Continue with ${Object.keys(researchData).length} Research Items`}
        </button>
      </div>
    </div>
  );
};

const ResearchRequestDetail = ({ request, value, onChange }) => {
  return (
    <div className="research-request-detail">
      <div className="request-header">
        <h3>{request.question}</h3>
        <span className={`urgency-badge ${request.urgency}`}>{request.urgency} priority</span>
      </div>

      <div className="research-guidance">
        <h4>Research Guidance:</h4>
        <p>{request.guidance}</p>
        
        <div className="suggested-sources">
          <h5>Suggested Research Methods:</h5>
          <ul>
            <li>🔍 Google search for market research and reports</li>
            <li>💬 Quick customer interviews or surveys</li>
            <li>📊 Check industry databases and reports</li>
            <li>🏢 Research competitor websites and materials</li>
            <li>📱 Browse app stores and review sites</li>
          </ul>
        </div>
      </div>

      <div className="research-input">
        <h4>Your Research Findings:</h4>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Paste your research findings here... Include sources and key insights."
          rows={8}
        />
        <small>Include sources, key findings, and your confidence level in this research.</small>
      </div>
    </div>
  );
};

export default ResearchPanel;