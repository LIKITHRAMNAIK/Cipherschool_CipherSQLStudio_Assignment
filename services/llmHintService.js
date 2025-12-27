const axios = require('axios');

const getHint = async (question, schema, userQuery, error = null, difficulty = 'Medium') => {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error('OpenAI API key is not configured');
  }

  const errorContext = error 
    ? `The user's query resulted in an error: ${error}.`
    : 'The user has written a query but may need guidance.';

  const difficultyGuidance = {
    'Easy': 'Provide a very basic hint that points to the general approach. Be very simple and direct.',
    'Medium': 'Provide a moderate hint that guides the user toward the solution without revealing it completely.',
    'Hard': 'Provide a subtle hint that challenges the user to think deeper about the problem.'
  };

  const systemPrompt = `You are a SQL learning assistant. Your role is to provide helpful hints to students learning SQL, NOT to give complete solutions.

CRITICAL RULES:
1. NEVER provide complete SQL queries or code solutions
2. NEVER write out the full query structure
3. ONLY provide conceptual hints, guidance, or suggestions
4. Point students toward the right direction without solving the problem
5. If there's an error, explain what might be wrong conceptually, but don't fix the query
6. Adapt your hint difficulty based on the assignment difficulty level
7. Keep hints concise and educational

Your response should be a helpful hint that guides the student, not a solution.`;

  const userPrompt = `Assignment Question: ${question}

Database Schema: ${schema}

User's Current Query: ${userQuery}

${errorContext}

Difficulty Level: ${difficulty}
${difficultyGuidance[difficulty] || difficultyGuidance['Medium']}

Provide a helpful hint that guides the student toward solving this SQL problem. Remember: NO SQL code, NO complete solutions, ONLY hints and guidance.`;

  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: userPrompt
          }
        ],
        temperature: 0.7,
        max_tokens: 200,
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const hint = response.data.choices[0].message.content.trim();

    const sqlPattern = /SELECT|FROM|WHERE|JOIN|GROUP BY|ORDER BY|HAVING|INSERT|UPDATE|DELETE/i;
    if (sqlPattern.test(hint)) {
      return 'Think about the structure of your query. Consider what tables you need and how to filter or join them.';
    }

    return hint;
  } catch (error) {
    if (error.response) {
      throw new Error(`OpenAI API error: ${error.response.data.error?.message || error.response.statusText}`);
    } else if (error.request) {
      throw new Error('Failed to connect to OpenAI API. Please check your network connection.');
    } else {
      throw new Error(`Error generating hint: ${error.message}`);
    }
  }
};

module.exports = {
  getHint,
};

