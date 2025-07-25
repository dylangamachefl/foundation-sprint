import React, { useState, useEffect } from 'react';
import { sprintAPI } from '../services/api';

const SprintDashboard = ({ onNext, sprintId, setSprintData }) => {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const pollStatus = async () => {
      try {
        const statusData = await sprintAPI.getStatus(sprintId);
        setStatus(statusData);
        setSprintData(statusData);

        if (statusData.phase === 'research_collection') {
          setTimeout(() => onNext('research'), 1000);
        }
      } catch (error) {
        console.error('Failed to get status:', error);
      } finally {
        setLoading(false);
      }
    };

    if (sprintId) {
      pollStatus();
      const interval = setInterval(pollStatus, 3000); // Poll every 3 seconds
      
      return () => clearInterval(interval);
    }
  }, [sprintId, onNext, setSprintData]);

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Initializing AI agents...</p>
      </div>
    );
  }

  const agentStatus = {
    facilitator: status?.agentProgress?.facilitator ? 'completed' : 'running',
    customerResearch: status?.agentProgress?.customerResearch ? 'completed' : 'running',
    productStrategy: status?.agentProgress?.productStrategy ? 'completed' : 'running'
  };

  const allAgentsComplete = Object.values(agentStatus).every(s => s === 'completed');

  return (
    <div className="sprint-dashboard">
      <h2>AI Agents Analyzing Your Product</h2>
      <p>Our expert AI agents are analyzing your product idea from multiple perspectives.</p>

      <div className="agents-grid">
        <div className={`agent-card ${agentStatus.facilitator}`}>
          <div className="agent-icon">🎯</div>
          <h3>Facilitator</h3>
          <p>Structuring the sprint and identifying key questions</p>
          <div className="status">{agentStatus.facilitator === 'completed' ? '✅ Complete' : '⏳ Analyzing...'}</div>
        </div>

        <div className={`agent-card ${agentStatus.customerResearch}`}>
          <div className="agent-icon">👥</div>
          <h3>Customer Research</h3>
          <p>Analyzing target customers and market opportunity</p>
          <div className="status">{agentStatus.customerResearch === 'completed' ? '✅ Complete' : '⏳ Analyzing...'}</div>
        </div>

        <div className={`agent-card ${agentStatus.productStrategy}`}>
          <div className="agent-icon">🛠️</div>
          <h3>Product Strategy</h3>
          <p>Evaluating technical feasibility and implementation</p>
          <div className="status">{agentStatus.productStrategy === 'completed' ? '✅ Complete' : '⏳ Analyzing...'}</div>
        </div>
      </div>

      {allAgentsComplete && (
        <div className="completion-message">
          <h3>🎉 AI Analysis Complete!</h3>
          <p>Your agents have generated {status?.researchRequests?.length || 0} research requests to validate their insights.</p>
          <button 
            className="btn-primary"
            onClick={() => onNext('research')}
          >
            Review Research Requests
          </button>
        </div>
      )}

      {status?.phase === 'research_collection' && (
        <div className="auto-advance">
          <p>Automatically advancing to research phase...</p>
        </div>
      )}
    </div>
  );
};

export default SprintDashboard;