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