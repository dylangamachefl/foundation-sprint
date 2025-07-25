// ===== BACKEND (Node.js/Express) =====

// server.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { FoundationSprintAPI } = require('./services/sprintAPI');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

const sprintAPI = new FoundationSprintAPI();

// Start a new Foundation Sprint
app.post('/api/sprint/start', async (req, res) => {
  try {
    const { productIdea } = req.body;
    const sprintId = await sprintAPI.initializeSprint(productIdea);
    res.json({ sprintId, status: 'initialized' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get sprint status and agent progress
app.get('/api/sprint/:id/status', async (req, res) => {
  try {
    const status = await sprintAPI.getSprintStatus(req.params.id);
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Submit research data
app.post('/api/sprint/:id/research', async (req, res) => {
  try {
    const { researchData } = req.body;
    await sprintAPI.submitResearch(req.params.id, researchData);
    res.json({ status: 'research_submitted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Make decisions
app.post('/api/sprint/:id/decisions', async (req, res) => {
  try {
    const { decisions } = req.body;
    const results = await sprintAPI.makeDecisions(req.params.id, decisions);
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get final results
app.get('/api/sprint/:id/results', async (req, res) => {
  try {
    const results = await sprintAPI.getResults(req.params.id);
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Foundation Sprint API running on port ${PORT}`);
});

// services/geminiProvider.js
const { GoogleGenerativeAI } = require('@google/generative-ai');

class GeminiProvider {
  constructor() {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY environment variable is required');
    }
    
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
  }

  async generateResponse(prompt, systemPrompt = '', maxTokens = 1000) {
    try {
      const fullPrompt = systemPrompt ? `${systemPrompt}\n\n${prompt}` : prompt;
      
      const result = await this.model.generateContent({
        contents: [{ role: 'user', parts: [{ text: fullPrompt }] }],
        generationConfig: {
          maxOutputTokens: maxTokens,
          temperature: 0.7,
        },
      });

      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Gemini API error:', error);
      throw new Error(`Failed to generate response: ${error.message}`);
    }
  }

  parseJsonResponse(response) {
    try {
      // Try to find JSON in the response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      // Fallback: create simple structure
      return { response: response, reasoning: 'Could not parse structured response' };
    } catch (error) {
      return { response: response, reasoning: 'JSON parsing failed' };
    }
  }
}

module.exports = GeminiProvider;

// services/sprintAPI.js
const GeminiProvider = require('./geminiProvider');
const crypto = require('crypto');

class FoundationSprintAPI {
  constructor() {
    this.gemini = new GeminiProvider();
    this.activeSprints = new Map(); // In-memory storage for MVP
  }

  async initializeSprint(productIdea) {
    const sprintId = crypto.randomUUID();
    
    const sprint = {
      id: sprintId,
      productIdea,
      phase: 'initialization',
      agents: {},
      researchRequests: [],
      researchData: {},
      decisions: {},
      startTime: Date.now(),
      status: 'running'
    };

    this.activeSprints.set(sprintId, sprint);

    // Start agent analysis
    this._runAgentAnalysis(sprintId);

    return sprintId;
  }

  async getSprintStatus(sprintId) {
    const sprint = this.activeSprints.get(sprintId);
    if (!sprint) throw new Error('Sprint not found');

    return {
      phase: sprint.phase,
      agentProgress: sprint.agents,
      researchRequests: sprint.researchRequests,
      status: sprint.status
    };
  }

  async submitResearch(sprintId, researchData) {
    const sprint = this.activeSprints.get(sprintId);
    if (!sprint) throw new Error('Sprint not found');

    sprint.researchData = { ...sprint.researchData, ...researchData };
    
    // Continue with research-informed analysis
    if (sprint.phase === 'research_collection') {
      sprint.phase = 'research_analysis';
      this._runResearchAnalysis(sprintId);
    }
  }

  async makeDecisions(sprintId, decisions) {
    const sprint = this.activeSprints.get(sprintId);
    if (!sprint) throw new Error('Sprint not found');

    sprint.decisions = { ...sprint.decisions, ...decisions };
    sprint.phase = 'hypothesis_generation';

    // Generate founding hypothesis
    const hypothesis = await this._generateFoundingHypothesis(sprintId);
    
    sprint.foundingHypothesis = hypothesis;
    sprint.status = 'completed';
    sprint.endTime = Date.now();

    return { hypothesis, status: 'completed' };
  }

  async getResults(sprintId) {
    const sprint = this.activeSprints.get(sprintId);
    if (!sprint) throw new Error('Sprint not found');

    return {
      productIdea: sprint.productIdea,
      foundingHypothesis: sprint.foundingHypothesis,
      decisions: sprint.decisions,
      agentInsights: sprint.agents,
      researchSummary: sprint.researchData,
      duration: sprint.endTime - sprint.startTime,
      recommendations: await this._generateRecommendations(sprintId)
    };
  }

  async _runAgentAnalysis(sprintId) {
    const sprint = this.activeSprints.get(sprintId);
    
    try {
      sprint.phase = 'agent_analysis';
      
      // Run all agents in parallel
      const [facilitatorAnalysis, customerAnalysis, strategyAnalysis] = await Promise.all([
        this._runFacilitatorAgent(sprint.productIdea),
        this._runCustomerResearchAgent(sprint.productIdea),
        this._runProductStrategyAgent(sprint.productIdea)
      ]);

      sprint.agents = {
        facilitator: facilitatorAnalysis,
        customerResearch: customerAnalysis,
        productStrategy: strategyAnalysis
      };

      // Generate research requests
      sprint.researchRequests = this._extractResearchRequests([
        facilitatorAnalysis,
        customerAnalysis,
        strategyAnalysis
      ]);

      sprint.phase = 'research_collection';

    } catch (error) {
      console.error('Agent analysis failed:', error);
      sprint.status = 'error';
      sprint.error = error.message;
    }
  }

  async _runFacilitatorAgent(productIdea) {
    const systemPrompt = `You are an expert Foundation Sprint facilitator. Analyze the product idea and provide structured guidance for the sprint process.

Your role is to:
1. Assess the product idea's readiness for Foundation Sprint
2. Identify key questions that need to be answered
3. Suggest areas requiring additional research
4. Provide process guidance

Always respond in JSON format.`;

    const prompt = `Analyze this product idea for Foundation Sprint:

Product: ${productIdea.name}
Description: ${productIdea.description}
Target Market: ${productIdea.targetMarket || 'Not specified'}
Problem: ${productIdea.problemStatement || 'Not specified'}

Provide analysis in this JSON format:
{
  "readiness_assessment": "assessment of sprint readiness",
  "key_questions": ["critical questions to answer"],
  "focus_areas": ["areas to emphasize in sprint"],
  "process_recommendations": ["specific guidance for this product"],
  "research_priorities": ["what research is most critical"]
}`;

    const response = await this.gemini.generateResponse(prompt, systemPrompt);
    return this.gemini.parseJsonResponse(response);
  }

  async _runCustomerResearchAgent(productIdea) {
    const systemPrompt = `You are a customer research expert. Analyze the product idea from a customer and market perspective.

Focus on:
1. Customer segmentation and personas
2. Market opportunity assessment
3. Customer pain points and needs
4. Adoption patterns and behavior
5. Market validation requirements

Always respond in JSON format.`;

    const prompt = `Analyze this product from a customer research perspective:

Product: ${productIdea.name}
Description: ${productIdea.description}
Target Market: ${productIdea.targetMarket || 'Not specified'}

Provide analysis in this JSON format:
{
  "target_customers": {
    "primary_segment": "description of primary customers",
    "characteristics": ["key customer traits"],
    "pain_points": ["specific customer problems"],
    "current_solutions": "how they solve this today"
  },
  "market_opportunity": {
    "market_size": "estimated market size",
    "growth_trends": "relevant market trends",
    "timing_assessment": "is the market ready?"
  },
  "customer_validation": {
    "research_questions": ["key questions to validate"],
    "validation_methods": ["recommended research approaches"],
    "success_metrics": ["what to measure"]
  },
  "adoption_insights": {
    "adoption_barriers": ["potential barriers"],
    "motivation_factors": ["what would drive adoption"],
    "decision_criteria": ["how customers would evaluate this"]
  }
}`;

    const response = await this.gemini.generateResponse(prompt, systemPrompt);
    return this.gemini.parseJsonResponse(response);
  }

  async _runProductStrategyAgent(productIdea) {
    const systemPrompt = `You are a product strategy and technical feasibility expert. Analyze the product idea from implementation and strategic perspectives.

Focus on:
1. Technical feasibility and complexity
2. Implementation approaches and timelines
3. Resource requirements
4. Strategic positioning
5. Competitive considerations

Always respond in JSON format.`;

    const prompt = `Analyze this product from a strategy and implementation perspective:

Product: ${productIdea.name}
Description: ${productIdea.description}
Initial Solution: ${productIdea.initialSolution || 'Not specified'}

Provide analysis in this JSON format:
{
  "technical_feasibility": {
    "complexity_level": "low/medium/high",
    "key_challenges": ["main technical hurdles"],
    "technology_requirements": ["required technologies"],
    "development_timeline": "estimated development time"
  },
  "implementation_approaches": [
    {
      "approach": "implementation option",
      "pros": ["advantages"],
      "cons": ["disadvantages"],
      "timeline": "estimated timeline",
      "resources_needed": ["required resources"]
    }
  ],
  "strategic_positioning": {
    "differentiation_opportunities": ["ways to differentiate"],
    "competitive_advantages": ["potential advantages"],
    "market_positioning": "suggested market position"
  },
  "resource_planning": {
    "team_requirements": ["key roles needed"],
    "budget_considerations": ["major cost factors"],
    "timeline_milestones": ["key development milestones"]
  }
}`;

    const response = await this.gemini.generateResponse(prompt, systemPrompt);
    return this.gemini.parseJsonResponse(response);
  }

  _extractResearchRequests(agentAnalyses) {
    const requests = [];
    
    // Extract research needs from each agent
    agentAnalyses.forEach((analysis, index) => {
      const agentNames = ['facilitator', 'customerResearch', 'productStrategy'];
      const agentName = agentNames[index];
      
      // Look for research-related fields in the analysis
      if (analysis.research_priorities) {
        analysis.research_priorities.forEach((priority, i) => {
          requests.push({
            id: `${agentName}_${i}`,
            agent: agentName,
            type: 'priority_research',
            question: priority,
            urgency: 'high',
            guidance: `Research this priority area identified by ${agentName}`
          });
        });
      }
      
      if (analysis.customer_validation?.research_questions) {
        analysis.customer_validation.research_questions.forEach((question, i) => {
          requests.push({
            id: `customer_validation_${i}`,
            agent: 'customerResearch',
            type: 'customer_validation',
            question: question,
            urgency: 'high',
            guidance: 'Conduct customer research to validate this assumption'
          });
        });
      }
    });

    return requests.slice(0, 8); // Limit to 8 research requests for MVP
  }

  async _runResearchAnalysis(sprintId) {
    const sprint = this.activeSprints.get(sprintId);
    
    // Re-run agents with research data
    const researchContext = Object.entries(sprint.researchData)
      .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
      .join('\n');

    try {
      const [facilitatorUpdate, customerUpdate, strategyUpdate] = await Promise.all([
        this._updateAgentWithResearch('facilitator', sprint.productIdea, researchContext),
        this._updateAgentWithResearch('customerResearch', sprint.productIdea, researchContext),
        this._updateAgentWithResearch('productStrategy', sprint.productIdea, researchContext)
      ]);

      sprint.agents.facilitator_updated = facilitatorUpdate;
      sprint.agents.customerResearch_updated = customerUpdate;
      sprint.agents.productStrategy_updated = strategyUpdate;

      sprint.phase = 'decision_making';

    } catch (error) {
      console.error('Research analysis failed:', error);
      sprint.status = 'error';
      sprint.error = error.message;
    }
  }

  async _updateAgentWithResearch(agentType, productIdea, researchContext) {
    const systemPrompts = {
      facilitator: 'You are a Foundation Sprint facilitator. Update your analysis based on new research data.',
      customerResearch: 'You are a customer research expert. Refine your insights based on research findings.',
      productStrategy: 'You are a product strategy expert. Update your recommendations based on research data.'
    };

    const prompt = `Based on this research data, update your analysis:

RESEARCH FINDINGS:
${researchContext}

ORIGINAL PRODUCT IDEA:
${JSON.stringify(productIdea, null, 2)}

Provide updated insights in JSON format focusing on how the research changes your previous analysis.`;

    const response = await this.gemini.generateResponse(prompt, systemPrompts[agentType]);
    return this.gemini.parseJsonResponse(response);
  }

  async _generateFoundingHypothesis(sprintId) {
    const sprint = this.activeSprints.get(sprintId);
    
    const systemPrompt = `You are an expert at synthesizing Foundation Sprint results into a clear founding hypothesis.

The Foundation Sprint hypothesis format is:
"If we solve [problem] for [customer] with [approach], we think they're going to choose it over [alternatives] because of [differentiator] and [unique advantage]."

Synthesize all the analysis and decisions into a clear, testable hypothesis.`;

    const context = {
      productIdea: sprint.productIdea,
      agentInsights: sprint.agents,
      decisions: sprint.decisions,
      researchData: sprint.researchData
    };

    const prompt = `Generate a founding hypothesis based on this Foundation Sprint analysis:

${JSON.stringify(context, null, 2)}

Respond in JSON format:
{
  "founding_hypothesis": "complete hypothesis statement",
  "components": {
    "customer": "target customer",
    "problem": "problem being solved",
    "approach": "solution approach",
    "alternatives": "main competitors/alternatives",
    "differentiator_1": "primary differentiator",
    "differentiator_2": "secondary differentiator"
  },
  "confidence_level": "high/medium/low",
  "key_assumptions": ["critical assumptions to test"],
  "next_steps": ["recommended validation steps"]
}`;

    const response = await this.gemini.generateResponse(prompt, systemPrompt);
    return this.gemini.parseJsonResponse(response);
  }

  async _generateRecommendations(sprintId) {
    const sprint = this.activeSprints.get(sprintId);
    
    const systemPrompt = `Generate actionable next steps based on the Foundation Sprint results.`;

    const prompt = `Based on this Foundation Sprint, what should the team do next?

Context: ${JSON.stringify({
      hypothesis: sprint.foundingHypothesis,
      insights: sprint.agents
    }, null, 2)}

Provide 5-7 specific, actionable next steps in JSON format:
{
  "immediate_actions": ["actions for next 1-2 weeks"],
  "validation_experiments": ["ways to test the hypothesis"],
  "development_priorities": ["what to build first"],
  "research_gaps": ["additional research needed"]
}`;

    const response = await this.gemini.generateResponse(prompt, systemPrompt);
    return this.gemini.parseJsonResponse(response);
  }
}

module.exports = { FoundationSprintAPI };

// ===== FRONTEND (React) =====

// src/App.jsx
import React, { useState } from 'react';
import ProductIdeaForm from './components/ProductIdeaForm';
import SprintDashboard from './components/SprintDashboard';
import ResearchPanel from './components/ResearchPanel';
import DecisionMaker from './components/DecisionMaker';
import ResultsView from './components/ResultsView';
import './App.css';

function App() {
  const [currentStep, setCurrentStep] = useState('input');
  const [sprintId, setSprintId] = useState(null);
  const [sprintData, setSprintData] = useState(null);

  const steps = {
    input: ProductIdeaForm,
    dashboard: SprintDashboard,
    research: ResearchPanel,
    decisions: DecisionMaker,
    results: ResultsView
  };

  const StepComponent = steps[currentStep];

  return (
    <div className="App">
      <header className="app-header">
        <h1>🚀 Foundation Sprint AI</h1>
        <p>AI-powered product strategy in 2-3 hours</p>
      </header>

      <main className="app-main">
        <div className="progress-bar">
          <div className={`step ${currentStep === 'input' ? 'active' : ''}`}>Product Idea</div>
          <div className={`step ${currentStep === 'dashboard' ? 'active' : ''}`}>AI Analysis</div>
          <div className={`step ${currentStep === 'research' ? 'active' : ''}`}>Research</div>
          <div className={`step ${currentStep === 'decisions' ? 'active' : ''}`}>Decisions</div>
          <div className={`step ${currentStep === 'results' ? 'active' : ''}`}>Results</div>
        </div>

        <StepComponent 
          onNext={setCurrentStep}
          sprintId={sprintId}
          setSprintId={setSprintId}
          sprintData={sprintData}
          setSprintData={setSprintData}
        />
      </main>
    </div>
  );
}

export default App;

// src/components/ProductIdeaForm.jsx
import React, { useState } from 'react';
import { sprintAPI } from '../services/api';

const ProductIdeaForm = ({ onNext, setSprintId }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    targetMarket: '',
    problemStatement: '',
    initialSolution: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await sprintAPI.startSprint(formData);
      setSprintId(response.sprintId);
      onNext('dashboard');
    } catch (error) {
      alert('Failed to start sprint: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="product-idea-form">
      <h2>Describe Your Product Idea</h2>
      <p>Provide as much detail as possible to get better AI insights.</p>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Product Name *</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            placeholder="e.g., TaskFlow AI"
          />
        </div>

        <div className="form-group">
          <label>Product Description *</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
            rows={4}
            placeholder="Describe what your product does and how it works..."
            minLength={100}
          />
          <small>{formData.description.length}/500+ characters</small>
        </div>

        <div className="form-group">
          <label>Target Market</label>
          <input
            type="text"
            name="targetMarket"
            value={formData.targetMarket}
            onChange={handleChange}
            placeholder="e.g., Busy professionals, Small business owners..."
          />
        </div>

        <div className="form-group">
          <label>Problem Statement</label>
          <textarea
            name="problemStatement"
            value={formData.problemStatement}
            onChange={handleChange}
            rows={3}
            placeholder="What specific problem does this solve for customers?"
          />
        </div>

        <div className="form-group">
          <label>Initial Solution Concept</label>
          <textarea
            name="initialSolution"
            value={formData.initialSolution}
            onChange={handleChange}
            rows={3}
            placeholder="How do you plan to solve this problem? What's your approach?"
          />
        </div>

        <button 
          type="submit" 
          className="btn-primary"
          disabled={loading || !formData.name || !formData.description}
        >
          {loading ? 'Starting Sprint...' : 'Start Foundation Sprint'}
        </button>
      </form>
    </div>
  );
};

export default ProductIdeaForm;

// src/components/SprintDashboard.jsx
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

// src/components/ResearchPanel.jsx
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

// src/components/DecisionMaker.jsx
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

// src/components/ResultsView.jsx
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

// src/services/api.js
const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

class SprintAPI {
  async startSprint(productIdea) {
    const response = await fetch(`${API_BASE}/sprint/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productIdea })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to start sprint: ${response.statusText}`);
    }
    
    return response.json();
  }

  async getStatus(sprintId) {
    const response = await fetch(`${API_BASE}/sprint/${sprintId}/status`);
    
    if (!response.ok) {
      throw new Error(`Failed to get status: ${response.statusText}`);
    }
    
    return response.json();
  }

  async submitResearch(sprintId, researchData) {
    const response = await fetch(`${API_BASE}/sprint/${sprintId}/research`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ researchData })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to submit research: ${response.statusText}`);
    }
    
    return response.json();
  }

  async makeDecisions(sprintId, decisions) {
    const response = await fetch(`${API_BASE}/sprint/${sprintId}/decisions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ decisions })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to make decisions: ${response.statusText}`);
    }
    
    return response.json();
  }

  async getResults(sprintId) {
    const response = await fetch(`${API_BASE}/sprint/${sprintId}/results`);
    
    if (!response.ok) {
      throw new Error(`Failed to get results: ${response.statusText}`);
    }
    
    return response.json();
  }
}

export const sprintAPI = new SprintAPI();

// ===== STYLES =====

// src/App.css
.App {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.app-header {
  text-align: center;
  margin-bottom: 40px;
}

.app-header h1 {
  font-size: 2.5rem;
  margin-bottom: 10px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.progress-bar {
  display: flex;
  justify-content: space-between;
  margin-bottom: 40px;
  background: #f5f5f5;
  border-radius: 8px;
  padding: 10px;
}

.progress-bar .step {
  padding: 10px 20px;
  border-radius: 6px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.progress-bar .step.active {
  background: #667eea;
  color: white;
}

/* Form Styles */
.product-idea-form {
  max-width: 600px;
  margin: 0 auto;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #333;
}

.form-group input,
.form-group textarea,
.form-group select {
  width: 100%;
  padding: 12px;
  border: 2px solid #e1e5e9;
  border-radius: 6px;
  font-size: 16px;
  transition: border-color 0.3s ease;
}

.form-group input:focus,
.form-group textarea:focus,
.form-group select:focus {
  outline: none;
  border-color: #667eea;
}

/* Button Styles */
.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 14px 28px;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  background: #f8f9fa;
  color: #495057;
  border: 2px solid #e1e5e9;
  padding: 12px 24px;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-secondary:hover {
  background: #e9ecef;
}

/* Dashboard Styles */
.agents-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  margin: 30px 0;
}

.agent-card {
  background: white;
  border: 2px solid #e1e5e9;
  border-radius: 12px;
  padding: 24px;
  text-align: center;
  transition: all 0.3s ease;
}

.agent-card.completed {
  border-color: #28a745;
  background: #f8fff9;
}

.agent-card.running {
  border-color: #ffc107;
  background: #fffdf5;
}

.agent-icon {
  font-size: 3rem;
  margin-bottom: 16px;
}

.agent-card h3 {
  margin-bottom: 12px;
  color: #333;
}

.agent-card p {
  color: #666;
  margin-bottom: 16px;
}

.status {
  font-weight: 600;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
}

/* Research Panel Styles */
.research-interface {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 30px;
  margin: 30px 0;
  min-height: 500px;
}

.research-sidebar {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 20px;
}

.research-request-item {
  background: white;
  border: 2px solid #e1e5e9;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.research-request-item:hover {
  border-color: #667eea;
}

.research-request-item.active {
  border-color: #667eea;
  background: #f0f4ff;
}

.research-request-item.completed {
  border-color: #28a745;
  background: #f8fff9;
}

.request-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.agent-badge {
  background: #667eea;
  color: white;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

.completed-badge {
  color: #28a745;
  font-weight: bold;
}

.research-detail {
  background: white;
  border: 2px solid #e1e5e9;
  border-radius: 8px;
  padding: 30px;
}

.urgency-badge {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
}

.urgency-badge.high {
  background: #dc3545;
  color: white;
}

.urgency-badge.medium {
  background: #ffc107;
  color: #333;
}

.urgency-badge.low {
  background: #28a745;
  color: white;
}

/* Results Styles */
.hypothesis-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 12px;
  padding: 30px;
  margin: 30px 0;
  text-align: center;
}

.hypothesis-statement {
  font-size: 1.3rem;
  font-weight: 600;
  line-height: 1.6;
  margin: 20px 0;
  font-style: italic;
}

.confidence-badge {
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
}

.confidence-badge.high {
  background: #28a745;
  color: white;
}

.confidence-badge.medium {
  background: #ffc107;
  color: #333;
}

.confidence-badge.low {
  background: #dc3545;
  color: white;
}

.components-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin: 20px 0;
}

.component-card {
  background: white;
  border: 2px solid #e1e5e9;
  border-radius: 8px;
  padding: 20px;
}

.component-card h4 {
  color: #667eea;
  margin-bottom: 10px;
  font-size: 14px;
  text-transform: uppercase;
  font-weight: 700;
}

.next-steps-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 30px;
  margin: 20px 0;
}

.steps-column h4 {
  color: #333;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 2px solid #667eea;
}

.steps-column ul {
  list-style: none;
  padding: 0;
}

.steps-column li {
  background: #f8f9fa;
  padding: 12px 16px;
  margin-bottom: 8px;
  border-radius: 6px;
  border-left: 4px solid #667eea;
}

.summary-stats {
  display: flex;
  justify-content: space-around;
  background: #f8f9fa;
  border-radius: 8px;
  padding: 20px;
  margin: 20px 0;
}

.stat {
  text-align: center;
}

.stat-value {
  display: block;
  font-size: 2rem;
  font-weight: 700;
  color: #667eea;
}

.stat-label {
  font-size: 14px;
  color: #666;
  text-transform: uppercase;
  font-weight: 600;
}

.export-actions {
  display: flex;
  gap: 20px;
  justify-content: center;
  margin: 40px 0;
}

/* Loading Styles */
.loading-screen {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  text-align: center;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Utility Classes */
.text-center {
  text-align: center;
}

.mt-4 {
  margin-top: 2rem;
}

.mb-4 {
  margin-bottom: 2rem;
}

/* Responsive Design */
@media (max-width: 768px) {
  .research-interface {
    grid-template-columns: 1fr;
  }
  
  .research-sidebar {
    order: 2;
  }
  
  .research-detail {
    order: 1;
  }
  
  .agents-grid {
    grid-template-columns: 1fr;
  }
  
  .components-grid {
    grid-template-columns: 1fr;
  }
  
  .next-steps-grid {
    grid-template-columns: 1fr;
  }
  
  .export-actions {
    flex-direction: column;
    align-items: center;
  }
  
  .export-actions button {
    width: 100%;
    max-width: 300px;
  }
}

/* Decision Maker Styles */
.insights-summary {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 24px;
  margin: 30px 0;
}

.insights-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.insight-card {
  background: white;
  border: 2px solid #e1e5e9;
  border-radius: 8px;
  padding: 20px;
}

.insight-card h4 {
  color: #667eea;
  margin-bottom: 15px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.insight-card ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.insight-card li {
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
  color: #555;
}

.insight-card li:last-child {
  border-bottom: none;
}

.decisions-form {
  background: white;
  border: 2px solid #e1e5e9;
  border-radius: 8px;
  padding: 30px;
  margin: 30px 0;
}

.decision-group {
  margin-bottom: 25px;
}

.decision-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #333;
  font-size: 16px;
}

.decision-actions {
  text-align: center;
  margin: 40px 0;
}

/* Research Progress */
.research-progress {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 20px;
  margin: 20px 0;
  display: flex;
  align-items: center;
  gap: 20px;
}

.research-progress .progress-bar {
  flex: 1;
  height: 8px;
  background: #e1e5e9;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  transition: width 0.3s ease;
}

.research-progress span {
  font-weight: 600;
  color: #555;
  white-space: nowrap;
}

/* Completion Message */
.completion-message {
  background: #d4edda;
  border: 2px solid #c3e6cb;
  border-radius: 8px;
  padding: 24px;
  text-align: center;
  margin: 30px 0;
}

.completion-message h3 {
  color: #155724;
  margin-bottom: 15px;
}

.completion-message p {
  color: #155724;
  margin-bottom: 20px;
}

.auto-advance {
  background: #fff3cd;
  border: 2px solid #ffeaa7;
  border-radius: 8px;
  padding: 16px;
  text-align: center;
  margin: 20px 0;
  color: #856404;
  font-weight: 600;
}

/* Research Guidance Styles */
.research-guidance {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 20px;
  margin: 20px 0;
}

.research-guidance h4,
.research-guidance h5 {
  color: #333;
  margin-bottom: 12px;
}

.suggested-sources ul {
  list-style: none;
  padding: 0;
}

.suggested-sources li {
  padding: 8px 0;
  display: flex;
  align-items: center;
  gap: 8px;
  color: #555;
}

.research-input {
  margin-top: 20px;
}

.research-input h4 {
  margin-bottom: 15px;
  color: #333;
}

.research-input textarea {
  width: 100%;
  min-height: 150px;
  padding: 16px;
  border: 2px solid #e1e5e9;
  border-radius: 8px;
  font-family: inherit;
  font-size: 14px;
  line-height: 1.5;
  resize: vertical;
}

.research-input small {
  display: block;
  margin-top: 8px;
  color: #666;
  font-size: 12px;
}

/* Error States */
.error-message {
  background: #f8d7da;
  border: 2px solid #f5c6cb;
  color: #721c24;
  padding: 16px;
  border-radius: 8px;
  margin: 20px 0;
  text-align: center;
}

/* Success States */
.success-message {
  background: #d4edda;
  border: 2px solid #c3e6cb;
  color: #155724;
  padding: 16px;
  border-radius: 8px;
  margin: 20px 0;
  text-align: center;
}