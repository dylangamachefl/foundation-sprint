# Foundation Sprint MVP with Gemini
## Personal Project Implementation

### Core MVP Features

#### 1. Single-Page Web Application
- **Simple React frontend** with basic form inputs
- **No authentication** - direct access to sprint interface
- **Local state management** only (no database)
- **Results export** as JSON/PDF for saving

#### 2. Simplified Agent System
**Reduced to 3 core agents:**
- **Facilitator Agent** - Guides process and synthesizes decisions
- **Customer Research Agent** - Provides market/customer insights
- **Product Strategy Agent** - Technical feasibility and implementation advice

**Removed for MVP:**
- Competitive Intelligence (can be manual research)
- Multiple Founder agents (single user perspective)
- Complex voting/collaboration systems

#### 3. Streamlined Sprint Process
**Single session flow (2-3 hours):**
1. **Product Idea Input** (10 min)
2. **Automated Agent Analysis** (30 min)
3. **Research Integration** (60 min)
4. **Decision Making** (30 min)
5. **Hypothesis Generation** (15 min)

#### 4. Research Integration
- **Manual research input only** (no automated web scraping)
- **Simple text/file upload** for research data
- **Research request generation** by agents with clear guidance
- **Basic confidence scoring** for research quality

#### 5. Gemini Integration
- **Single Gemini API provider** (no fallbacks needed for personal use)
- **Simple prompt engineering** for each agent type
- **Direct API calls** without complex orchestration
- **Basic error handling** and retry logic

---

## Technical Architecture

### Frontend (React)
```
src/
├── components/
│   ├── ProductIdeaForm.jsx      # Initial product input
│   ├── AgentDashboard.jsx       # Real-time agent progress
│   ├── ResearchPanel.jsx        # Research requests/input
│   ├── DecisionMaker.jsx        # Simple decision interface
│   └── ResultsView.jsx          # Final hypothesis display
├── services/
│   └── geminiService.js         # Gemini API integration
└── App.jsx                      # Main application flow
```

### Backend (Node.js/Express)
```
src/
├── agents/
│   ├── facilitator.js           # Process orchestration
│   ├── customerResearch.js      # Customer insights
│   └── productStrategy.js       # Technical feasibility
├── services/
│   └── geminiProvider.js        # Gemini API client
└── server.js                    # Simple Express server
```

### Key Simplifications

#### 1. No Database
- **In-memory state** during sprint session
- **Local storage** for temporary persistence
- **Export functionality** for permanent saving
- **Import capability** to resume sessions

#### 2. Single User Experience
- **No team collaboration** features
- **No voting mechanisms** 
- **Direct decision making** by user with agent guidance
- **Simplified conflict resolution**

#### 3. Basic Research Flow
- **Agent generates 3-5 research requests** per phase
- **User manually conducts research** using provided guidance
- **Simple text input** for research findings
- **No automated research APIs** or web scraping

#### 4. Minimal UI/UX
- **Clean, functional design** using a simple CSS framework
- **Progressive disclosure** - one section at a time
- **Real-time agent status** with simple progress indicators
- **Mobile-friendly** but desktop-optimized

---

## Gemini Integration Details

### Agent Prompt Templates
```javascript
const AGENT_PROMPTS = {
  facilitator: `You are an expert facilitator running a Foundation Sprint...`,
  customerResearch: `You are a customer research expert analyzing...`,
  productStrategy: `You are a product strategy expert evaluating...`
};
```

### API Implementation
```javascript
class GeminiProvider {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta';
  }
  
  async generateResponse(prompt, systemPrompt, maxTokens = 1000) {
    // Simple Gemini API call with error handling
  }
}
```

### Cost Optimization
- **Shorter prompts** to reduce token usage
- **Batch similar requests** when possible
- **Cache common responses** in local storage
- **Token usage tracking** for budget awareness

---

## Development Timeline (2-3 weeks)

### Week 1: Core Foundation
- **Day 1-2:** Basic React app setup with Gemini integration
- **Day 3-4:** Product idea form and basic agent system
- **Day 5-7:** Agent prompt engineering and response handling

### Week 2: Sprint Flow
- **Day 1-3:** Complete sprint orchestration logic
- **Day 4-5:** Research request generation and input system
- **Day 6-7:** Decision making and hypothesis generation

### Week 3: Polish & Testing
- **Day 1-2:** UI improvements and mobile responsiveness
- **Day 3-4:** Error handling and edge case management
- **Day 5-7:** Testing with real product ideas and refinements

---

## MVP User Flow

### 1. Product Idea Input (10 minutes)
```
Enter Product Details:
├── Name: [text input]
├── Description: [textarea, 500+ chars]
├── Target Market: [text input]
├── Problem Statement: [textarea]
└── Initial Solution: [textarea]
```

### 2. Automated Analysis (30 minutes)
```
Agent Processing:
├── Facilitator: "Analyzing product idea structure..."
├── Customer Research: "Identifying customer segments..."
├── Product Strategy: "Assessing technical feasibility..."
└── Progress: [Real-time status updates]
```

### 3. Research Phase (60 minutes)
```
Research Requests Generated:
├── "Analyze target customer pain points in [market]"
├── "Research pricing models for similar solutions"
├── "Evaluate technical implementation approaches"
└── [Manual research with guided templates]
```

### 4. Decision Making (30 minutes)
```
Agent Recommendations:
├── Customer Focus: [AI recommendation]
├── Differentiation: [AI recommendation]  
├── Implementation: [AI recommendation]
└── User Decision: [Simple selection interface]
```

### 5. Hypothesis Generation (15 minutes)
```
Founding Hypothesis:
"If we solve [problem] for [customer] with [approach], 
we think they're going to choose it over [alternatives] 
because of [differentiator] and [unique advantage]."

Export Options:
├── PDF Report
├── JSON Data
└── Markdown Summary
```

---

## Essential MVP Components

### Minimum Viable Features
✅ **Product idea input form**
✅ **3 LLM agents with Gemini**
✅ **Research request generation**
✅ **Manual research input**
✅ **Founding hypothesis generation**
✅ **Results export (JSON/PDF)**

### Nice-to-Have (Post-MVP)
⚪ **Research quality scoring**
⚪ **Multiple export formats**
⚪ **Session save/resume**
⚪ **Agent personality customization**
⚪ **Advanced error handling**

### Explicitly Excluded from MVP
❌ **Authentication/user accounts**
❌ **Database persistence**
❌ **Team collaboration**
❌ **Automated web research**
❌ **Complex competitive analysis**
❌ **Payment/subscription system**

---

## Quick Start Implementation

### Environment Setup
```bash
# Frontend
npx create-react-app foundation-sprint-mvp
cd foundation-sprint-mvp
npm install axios recharts

# Backend
mkdir sprint-api && cd sprint-api
npm init -y
npm install express cors dotenv @google/generative-ai
```

### Key Files to Create
1. **`.env`** - Gemini API key
2. **`geminiService.js`** - API integration
3. **`SprintOrchestrator.js`** - Core sprint logic
4. **`App.jsx`** - Main React application
5. **`server.js`** - Express API server

This MVP focuses on the core value proposition - AI-guided Foundation Sprint methodology - while keeping complexity minimal for a personal project.