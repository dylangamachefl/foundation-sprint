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