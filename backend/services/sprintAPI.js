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
    const systemPrompt = `You are an expert Foundation Sprint facilitator. Analyze the product idea and provide structured guidance for the sprint process.\n\nYour role is to:\n1. Assess the product idea's readiness for Foundation Sprint\n2. Identify key questions that need to be answered\n3. Suggest areas requiring additional research\n4. Provide process guidance\n\nAlways respond in JSON format.`;

    const prompt = `Analyze this product idea for Foundation Sprint:\n\nProduct: ${productIdea.name}\nDescription: ${productIdea.description}\nTarget Market: ${productIdea.targetMarket || 'Not specified'}\nProblem: ${productIdea.problemStatement || 'Not specified'}\n\nProvide analysis in this JSON format:\n{\n  "readiness_assessment": "assessment of sprint readiness",\n  "key_questions": ["critical questions to answer"],\n  "focus_areas": ["areas to emphasize in sprint"],\n  "process_recommendations": ["specific guidance for this product"],\n  "research_priorities": ["what research is most critical"]\n}`;

    const response = await this.gemini.generateResponse(prompt, systemPrompt);
    return this.gemini.parseJsonResponse(response);
  }

  async _runCustomerResearchAgent(productIdea) {
    const systemPrompt = `You are a customer research expert. Analyze the product idea from a customer and market perspective.\n\nFocus on:\n1. Customer segmentation and personas\n2. Market opportunity assessment\n3. Customer pain points and needs\n4. Adoption patterns and behavior\n5. Market validation requirements\n\nAlways respond in JSON format.`;

    const prompt = `Analyze this product from a customer research perspective:\n\nProduct: ${productIdea.name}\nDescription: ${productIdea.description}\nTarget Market: ${productIdea.targetMarket || 'Not specified'}\n\nProvide analysis in this JSON format:\n{\n  "target_customers": {\n    "primary_segment": "description of primary customers",\n    "characteristics": ["key customer traits"],\n    "pain_points": ["specific customer problems"],\n    "current_solutions": "how they solve this today"\n  },\n  "market_opportunity": {\n    "market_size": "estimated market size",\n    "growth_trends": "relevant market trends",\n    "timing_assessment": "is the market ready?"\n  },\n  "customer_validation": {\n    "research_questions": ["key questions to validate"],\n    "validation_methods": ["recommended research approaches"],\n    "success_metrics": ["what to measure"]\n  },\n  "adoption_insights": {\n    "adoption_barriers": ["potential barriers"],\n    "motivation_factors": ["what would drive adoption"],\n    "decision_criteria": ["how customers would evaluate this"]\n  }\n}`;

    const response = await this.gemini.generateResponse(prompt, systemPrompt);
    return this.gemini.parseJsonResponse(response);
  }

  async _runProductStrategyAgent(productIdea) {
    const systemPrompt = `You are a product strategy and technical feasibility expert. Analyze the product idea from implementation and strategic perspectives.\n\nFocus on:\n1. Technical feasibility and complexity\n2. Implementation approaches and timelines\n3. Resource requirements\n4. Strategic positioning\n5. Competitive considerations\n\nAlways respond in JSON format.`;

    const prompt = `Analyze this product from a strategy and implementation perspective:\n\nProduct: ${productIdea.name}\nDescription: ${productIdea.description}\nInitial Solution: ${productIdea.initialSolution || 'Not specified'}\n\nProvide analysis in this JSON format:\n{\n  "technical_feasibility": {\n    "complexity_level": "low/medium/high",\n    "key_challenges": ["main technical hurdles"],\n    "technology_requirements": ["required technologies"],\n    "development_timeline": "estimated development time"\n  },\n  "implementation_approaches": [\n    {\n      "approach": "implementation option",\n      "pros": ["advantages"],\n      "cons": ["disadvantages"],\n      "timeline": "estimated timeline",\n      "resources_needed": ["required resources"]\n    }\n  ],\n  "strategic_positioning": {\n    "differentiation_opportunities": ["ways to differentiate"],\n    "competitive_advantages": ["potential advantages"],\n    "market_positioning": "suggested market position"\n  },\n  "resource_planning": {\n    "team_requirements": ["key roles needed"],\n    "budget_considerations": ["major cost factors"],\n    "timeline_milestones": ["key development milestones"]\n  }\n}`;

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

    const prompt = `Based on this research data, update your analysis:\n\nRESEARCH FINDINGS:\n${researchContext}\n\nORIGINAL PRODUCT IDEA:\n${JSON.stringify(productIdea, null, 2)}\n\nProvide updated insights in JSON format focusing on how the research changes your previous analysis.`;

    const response = await this.gemini.generateResponse(prompt, systemPrompts[agentType]);
    return this.gemini.parseJsonResponse(response);
  }

  async _generateFoundingHypothesis(sprintId) {
    const sprint = this.activeSprints.get(sprintId);
    
    const systemPrompt = `You are an expert at synthesizing Foundation Sprint results into a clear founding hypothesis.\n\nThe Foundation Sprint hypothesis format is:\n"If we solve [problem] for [customer] with [approach], we think they're going to choose it over [alternatives] because of [differentiator] and [unique advantage]."\n\nSynthesize all the analysis and decisions into a clear, testable hypothesis.`;

    const context = {
      productIdea: sprint.productIdea,
      agentInsights: sprint.agents,
      decisions: sprint.decisions,
      researchData: sprint.researchData
    };

    const prompt = `Generate a founding hypothesis based on this Foundation Sprint analysis:\n\n${JSON.stringify(context, null, 2)}\n\nRespond in JSON format:\n{\n  "founding_hypothesis": "complete hypothesis statement",\n  "components": {\n    "customer": "target customer",\n    "problem": "problem being solved",\n    "approach": "solution approach",\n    "alternatives": "main competitors/alternatives",\n    "differentiator_1": "primary differentiator",\n    "differentiator_2": "secondary differentiator"\n  },\n  "confidence_level": "high/medium/low",\n  "key_assumptions": ["critical assumptions to test"],\n  "next_steps": ["recommended validation steps"]\n}`;

    const response = await this.gemini.generateResponse(prompt, systemPrompt);
    return this.gemini.parseJsonResponse(response);
  }

  async _generateRecommendations(sprintId) {
    const sprint = this.activeSprints.get(sprintId);
    
    const systemPrompt = `Generate actionable next steps based on the Foundation Sprint results.`;

    const prompt = `Based on this Foundation Sprint, what should the team do next?\n\nContext: ${JSON.stringify({
      hypothesis: sprint.foundingHypothesis,
      insights: sprint.agents
    }, null, 2)}\n\nProvide 5-7 specific, actionable next steps in JSON format:\n{\n  "immediate_actions": ["actions for next 1-2 weeks"],\n  "validation_experiments": ["ways to test the hypothesis"],\n  "development_priorities": ["what to build first"],
  "research_gaps": ["additional research needed"]
}`;

    const response = await this.gemini.generateResponse(prompt, systemPrompt);
    return this.gemini.parseJsonResponse(response);
  }
}

module.exports = { FoundationSprintAPI };
