import React, { useState, useEffect } from 'react';
import { sprintAPI } from '../services/api';

const ResultsView = ({ sprintId, sprintData }) => {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const resultsData = await sprintAPI.getResults(sprintId);
        setResults(resultsData);
      } catch (error) {
        console.error('Failed to get results:', error);
      } finally {
        setLoading(false);
      }
    };

    if (sprintId) {
      fetchResults();
    }
  }, [sprintId]);

  const exportResults = () => {
    const exportData = {
      timestamp: new Date().toISOString(),
      productIdea: results.productIdea,
      foundingHypothesis: results.foundingHypothesis,
      agentInsights: results.agentInsights,
      recommendations: results.recommendations,
      duration: results.duration
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `foundation-sprint-${results.productIdea.name.replace(/\s+/g, '-').toLowerCase()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Generating your founding hypothesis...</p>
      </div>
    );
  }

  return (
    <div className="results-view">
      <div className="results-header">
        <h2>🎯 Your Founding Hypothesis</h2>
        <p>Based on AI analysis and your research, here's your validated product strategy.</p>
      </div>

      <div className="hypothesis-card">
        <h3>Founding Hypothesis</h3>
        <div className="hypothesis-statement">
          "{results?.foundingHypothesis?.founding_hypothesis || 'Hypothesis generation failed'}"
        </div>
        
        {results?.foundingHypothesis?.confidence_level && (
          <div className="confidence-indicator">
            <span className={`confidence-badge ${results.foundingHypothesis.confidence_level}`}>
              {results.foundingHypothesis.confidence_level.toUpperCase()} CONFIDENCE
            </span>
          </div>
        )}
      </div>

      <div className="hypothesis-breakdown">
        <h3>Hypothesis Components</h3>
        <div className="components-grid">
          {results?.foundingHypothesis?.components && Object.entries(results.foundingHypothesis.components).map(([key, value]) => (
            <div key={key} className="component-card">
              <h4>{key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</h4>
              <p>{value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="key-assumptions">
        <h3>🔍 Key Assumptions to Test</h3>
        <ul>
          {results?.foundingHypothesis?.key_assumptions?.map((assumption, i) => (
            <li key={i}>{assumption}</li>
          )) || ['No assumptions identified']}
        </ul>
      </div>

      <div className="next-steps">
        <h3>📋 Recommended Next Steps</h3>
        <div className="next-steps-grid">
          {results?.recommendations?.immediate_actions && (
            <div className="steps-column">
              <h4>Immediate Actions (1-2 weeks)</h4>
              <ul>
                {results.recommendations.immediate_actions.map((action, i) => (
                  <li key={i}>{action}</li>
                ))}
              </ul>
            </div>
          )}
          
          {results?.recommendations?.validation_experiments && (
            <div className="steps-column">
              <h4>Validation Experiments</h4>
              <ul>
                {results.recommendations.validation_experiments.map((experiment, i) => (
                  <li key={i}>{experiment}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      <div className="sprint-summary">
        <h3>Sprint Summary</h3>
        <div className="summary-stats">
          <div className="stat">
            <span className="stat-value">{Math.round(results?.duration / 1000 / 60)} min</span>
            <span className="stat-label">Total Duration</span>
          </div>
          <div className="stat">
            <span className="stat-value">{Object.keys(results?.researchSummary || {}).length}</span>
            <span className="stat-label">Research Items</span>
          </div>
          <div className="stat">
            <span className="stat-value">3</span>
            <span className="stat-label">AI Agents</span>
          </div>
        </div>
      </div>

      <div className="export-actions">
        <button className="btn-secondary" onClick={exportResults}>
          📄 Export Results (JSON)
        </button>
        <button className="btn-primary" onClick={() => window.location.reload()}>
          🚀 Start New Sprint
        </button>
      </div>
    </div>
  );
};

export default ResultsView;