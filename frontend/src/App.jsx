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