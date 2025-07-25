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