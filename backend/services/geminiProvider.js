const { GoogleGenerativeAI } = require('@google/generative-ai');

class GeminiProvider {
  constructor() {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY environment variable is required');
    }

    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
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