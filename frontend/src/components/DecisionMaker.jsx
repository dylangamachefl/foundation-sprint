import React, { useState, useEffect } from 'react';
import { sprintAPI } from '../services/api';

const DecisionMaker = ({ onNext, sprintId, sprintData, setSprintData }) => {
  const [decisions, setDecisions] = useState({});
  const [agentInsights, setAgentInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Wait for research analysis to complete
    const pollForInsights = async () => {
      try {
        const status = await sprintAPI.getStatus(sprintId);
        if (status.agentProgress.facilitator_updated) {
          setAgentInsights(status.agentProgress);
          setLoading(false);
        } else {
          setTimeout(pollForInsights, 2000);
        }
      } catch (error) {
        console.error('Failed to get insights:', error);
        setLoading(false);
      }
    };

    pollForInsights();
  }, [sprintId]);

  const handleDecisionChange = (key, value) => {
    setDecisions(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSubmitDecisions = async () => {
    setSubmitting(true);
    try {
      const result = await sprintAPI.makeDecisions(sprintId, decisions);
      setSprintData(prev => ({ ...prev, result }));
      onNext('results');
    } catch (error) {
      alert('Failed to submit decisions: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>AI agents are analyzing your research data...</p>
      </div>
    );
  }

  const canSubmit = Object.keys(decisions).length >= 3;

  return (
    <div className="decision-maker">
      <h2>Make Strategic Decisions</h2>
      <p>Based on AI analysis and your research, make key decisions for your product strategy.</p>

      <div className="insights-summary">
        <h3>🧠 Updated AI Insights</h3>
        <div className="insights-grid">
          {agentInsights?.customerResearch_updated && (
            <div className="insight-card">
              <h4>👥 Customer Insights</h4>
              <ul>
                {agentInsights.customerResearch_updated.key_findings?.slice(0, 3).map((finding, i) => (
                  <li key={i}>{finding}</li>
                )) || ['Updated customer analysis available']}
              </ul>
            </div>
          )}
          
          {agentInsights?.productStrategy_updated && (
            <div className="insight-card">
              <h4>🛠️ Strategy Insights</h4>
              <ul>
                {agentInsights.productStrategy_updated.key_recommendations?.slice(0, 3).map((rec, i) => (
                  <li key={i}>{rec}</li>
                )) || ['Updated strategy analysis available']}
              </ul>
            </div>
          )}
        </div>
      </div>

      <div className="decisions-form">
        <h3>Key Decisions</h3>
        
        <div className="decision-group">
          <label>Primary Target Customer</label>
          <textarea
            value={decisions.target_customer || ''}
            onChange={(e) => handleDecisionChange('target_customer', e.target.value)}
            placeholder="Who is your primary target customer? Be specific about demographics, behavior, and needs."
            rows={3}
          />
        </div>

        <div className="decision-group">
          <label>Core Problem to Solve</label>
          <textarea
            value={decisions.core_problem || ''}
            onChange={(e) => handleDecisionChange('core_problem', e.target.value)}
            placeholder="What is the single most important problem you're solving for customers?"
            rows={3}
          />
        </div>

        <div className="decision-group">
          <label>Primary Differentiation</label>
          <textarea
            value={decisions.differentiation || ''}
            onChange={(e) => handleDecisionChange('differentiation', e.target.value)}
            placeholder="How will your product be meaningfully different from alternatives?"
            rows={3}
          />
        </div>

        <div className="decision-group">
          <label>Implementation Approach</label>
          <select
            value={decisions.implementation_approach || ''}
            onChange={(e) => handleDecisionChange('implementation_approach', e.target.value)}
          >
            <option value="">Select approach...</option>
            <option value="web_app">Web Application</option>
            <option value="mobile_app">Mobile App</option>
            <option value="desktop_app">Desktop Application</option>
            <option value="api_platform">API/Platform</option>
            <option value="browser_extension">Browser Extension</option>
            <option value="hybrid">Hybrid Approach</option>
          </select>
        </div>

        <div className="decision-group">
          <label>Go-to-Market Strategy</label>
          <textarea
            value={decisions.gtm_strategy || ''}
            onChange={(e) => handleDecisionChange('gtm_strategy', e.target.value)}
            placeholder="How will you initially reach and acquire customers?"
            rows={3}
          />
        </div>
      </div>

      <div className="decision-actions">
        <button 
          className="btn-primary"
          onClick={handleSubmitDecisions}
          disabled={!canSubmit || submitting}
        >
          {submitting ? 'Generating Hypothesis...' : 'Generate Founding Hypothesis'}
        </button>
      </div>
    </div>
  );
};

export default DecisionMaker;