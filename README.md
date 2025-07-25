# Foundation Sprint MVP with Gemini AI

An AI-powered Foundation Sprint implementation that helps startup founders validate and refine their product ideas in 2-3 hours instead of 2 days.

## 🚀 Features

- **AI-Powered Analysis**: 3 specialized AI agents analyze your product idea
- **Research Integration**: Manual research input with AI guidance
- **Decision Support**: AI-assisted strategic decision making
- **Founding Hypothesis**: Auto-generated, testable product hypothesis
- **Export Results**: Save your sprint results as JSON

## 🛠️ Tech Stack

**Backend:**
- Node.js + Express
- Google Gemini AI API
- In-memory storage (for MVP)

**Frontend:**
- React 18
- Vanilla CSS
- Fetch API for backend communication

## 📋 Prerequisites

- Node.js 16+ 
- npm or yarn
- Gemini API key ([Get one here](https://makersuite.google.com/app/apikey))

## ⚡ Quick Start

### Option 1: Automated Setup (Recommended)

**Unix/Linux/Mac:**
```bash
chmod +x setup.sh
./setup.sh
```

**Windows:**
```batch
setup.bat
```

### Option 2: Manual Setup

1. **Clone and setup backend:**
   ```bash
   mkdir foundation-sprint-mvp && cd foundation-sprint-mvp
   mkdir backend && cd backend
   npm init -y
   npm install @google/generative-ai cors dotenv express uuid
   npm install --save-dev nodemon
   ```

2. **Create environment file:**
   ```bash
   cp .env.example .env
   # Add your Gemini API key to .env
   ```

3. **Setup frontend:**
   ```bash
   cd ../frontend
   npx create-react-app . --template typescript
   npm install
   ```

## 🔧 Configuration

1. **Get Gemini API Key:**
   - Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Create a new API key
   - Copy the key

2. **Configure Backend:**
   ```env
   GEMINI_API_KEY=your_actual_api_key_here
   PORT=5000
   NODE_ENV=development
   ```

## 🏃‍♂️ Running the Application

1. **Start Backend:**
   ```bash
   cd backend
   npm run dev
   ```

2. **Start Frontend** (in a new terminal):
   ```bash
   cd frontend
   npm start
   ```

3. **Access Application:**
   - Open http://localhost:3000
   - Backend API: http://localhost:5000

## 📱 How to Use

1. **Product Idea Input** (10 min)
   - Enter your product name and description
   - Add target market and problem statement
   - Provide initial solution concept

2. **AI Analysis** (30 min)
   - Watch AI agents analyze your idea
   - Facilitator structures the sprint
   - Customer Research analyzes market fit
   - Product Strategy evaluates feasibility

3. **Research Phase** (60 min)
   - Review AI-generated research requests
   - Conduct manual research using provided guidance
   - Input findings into the system

4. **Decision Making** (30 min)
   - Review updated AI insights
   - Make strategic decisions with AI guidance
   - Choose target customer, differentiation, approach

5. **Results** (15 min)
   - Get your founding hypothesis
   - Review key assumptions to test
   - Export results for future reference

## 🎯 Example Product Ideas to Test

- **AI Task Manager**: "Smart task prioritization app using AI"
- **Remote Team Tool**: "Virtual office space for distributed teams"
- **Learning Platform**: "Personalized skill development platform"
- **Health Tracker**: "Predictive health monitoring device"

## 📁 Project Structure

```
foundation-sprint-mvp/
├── backend/
│   ├── services/
│   │   ├── geminiProvider.js
│   │   └── sprintAPI.js
│   ├── server.js
│   ├── package.json
│   └── .env
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── ProductIdeaForm.jsx
│   │   ├── SprintDashboard.jsx
│   │   ├── ResearchPanel.jsx
│   │   ├── DecisionMaker.jsx
│   │   └── ResultsView.jsx
│   ├── services/
│   │   └── api.js
│   ├── App.jsx
│   ├── App.css
│   └── index.js
    └── package.json
```

## 🔧 API Endpoints

- `POST /api/sprint/start` - Initialize new sprint
- `GET /api/sprint/:id/status` - Get sprint status
- `POST /api/sprint/:id/research` - Submit research data
- `POST /api/sprint/:id/decisions` - Make decisions
- `GET /api/sprint/:id/results` - Get final results

## 🎨 Customization

### Adding New AI Agents

1. Create new agent in `services/sprintAPI.js`:
```javascript
async _runNewAgent(productIdea) {
  const systemPrompt = `You are a [role] expert...`;
  const prompt = `Analyze this product...`;
  const response = await this.gemini.generateResponse(prompt, systemPrompt);
  return this.gemini.parseJsonResponse(response);
}
```

2. Add to agent processing pipeline
3. Update frontend to display new insights

### Modifying AI Prompts

Edit the system prompts in `sprintAPI.js` to customize agent behavior:
- `_runFacilitatorAgent()` - Sprint facilitation
- `_runCustomerResearchAgent()` - Customer insights
- `_runProductStrategyAgent()` - Technical strategy

### Styling Changes

Modify `src/App.css` to customize the UI:
- Color scheme: Update CSS custom properties
- Layout: Modify grid and flexbox styles
- Components: Style individual component classes

## 🚀 Deployment

### Backend (Heroku)

1. Create Heroku app:
   ```bash
   heroku create your-sprint-api
   ```

2. Set environment variables:
   ```bash
   heroku config:set GEMINI_API_KEY=your_key
   ```

3. Deploy:
   ```bash
   git push heroku main
   ```

### Frontend (Netlify)

1. Build the frontend:
   ```bash
   cd frontend && npm run build
   ```

2. Deploy build folder to Netlify

3. Set environment variable:
   ```
   REACT_APP_API_URL=https://your-sprint-api.herokuapp.com/api
   ```

## 🧪 Testing

### Backend Testing
```bash
cd backend
# Test health endpoint
curl http://localhost:5000/api/health

# Test sprint creation
curl -X POST http://localhost:5000/api/sprint/start \
  -H "Content-Type: application/json" \
  -d '{"productIdea": {"name": "Test", "description": "Test product"}}'
```

### Frontend Testing
```bash
cd frontend
npm test
```

## 📊 Cost Estimation

**Gemini API Usage:**
- ~3,000-5,000 tokens per sprint
- Approximately $0.05-0.15 per sprint
- 100 sprints ≈ $5-15/month

**Hosting (Optional):
- Backend: Free tier (Heroku/Railway)
- Frontend: Free tier (Netlify/Vercel)

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Jake Knapp and John Zeratsky for the Foundation Sprint methodology
- Google for the Gemini AI API
- The startup community for inspiration and feedback

## 📞 Support

- 🐛 **Issues**: [GitHub Issues](https://github.com/yourusername/foundation-sprint-mvp/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/yourusername/foundation-sprint-mvp/discussions)
- 📧 **Email**: your.email@example.com

---

**Built with ❤️ for the startup community**