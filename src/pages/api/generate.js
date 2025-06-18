import { google } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { z } from 'zod';

// Retry function with exponential backoff
async function retryWithBackoff(fn, maxRetries = 3, baseDelay = 1000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      console.error(`Attempt ${attempt} failed:`, error.message);
      
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Exponential backoff with jitter
      const delay = baseDelay * Math.pow(2, attempt - 1) + Math.random() * 1000;
      console.log(`Retrying in ${Math.round(delay)}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

// Fallback response generator
async function getFallbackResponse(title, difficulty) {
  const fallbackPrompt = `
    Generate a structured learning plan for "${title}" with difficulty levels: ${difficulty.join(", ")}.
    
    Follow these guidelines:
    - If Easy level: Provide 3-4 high-priority topics with essential subtopics
    - If Medium level: Provide 4-6 topics with comprehensive subtopics covering core concepts
    - If Hard level: Provide 6-8 topics with detailed subtopics covering all aspects
    
    For each topic:
    1. Provide a clear, descriptive name
    2. Include 3-5 essential subtopics that are fundamental to understanding
    3. Focus on practical, hands-on learning
    4. Ensure logical progression from basic to advanced concepts
    5. Include introduction and foundational topics
    
    Structure the response as an array of topics, each with:
    - name: Clear topic title
    - subtopics: Array of essential subtopic names
    
    Make sure the learning path is comprehensive yet manageable for the specified difficulty level.
  `;

  const result = await generateObject({
    model: google('gemini-2.0-flash-exp'),
    schema: z.object({
      topics: z.array(
        z.object({
          name: z.string(),
          subtopics: z.array(z.string()),
        })
      ),
    }),
    prompt: fallbackPrompt,
    apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
  });

  return result.object;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { title, difficulty } = req.body;
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

  if (!title || !apiKey) {
    return res.status(400).json({ error: 'Missing title or API key' });
  }

  try {
    // Main attempt with retry mechanism
    const result = await retryWithBackoff(async () => {
      return await generateObject({
        model: google('gemini-2.0-flash-exp'),
        schema: z.object({
          topics: z.array(
            z.object({
              name: z.string(),
              subtopics: z.array(z.string()),
            })
          ),
        }),
        prompt: `Generate a structured learning plan for "${title}" with difficulty levels: ${difficulty.join(", ")}.If Easy is level then Provide Topics With High Important and if Its Medium Provided Some More Topics All Next Priority if Hard is Chosed then Provided all Topics in that with all Sub Topics in that also Dont Miss Any Topics or Sub Topics In That . Provide All Level With Introduction`,
        apiKey: apiKey,
      });
    });

    res.status(200).json(result.object);
  } catch (error) {
    console.error('Main generation failed after retries:', error);
    
    try {
      // Fallback attempt with retry mechanism
      console.log('Attempting fallback generation...');
      const fallbackResult = await retryWithBackoff(async () => {
        return await getFallbackResponse(title, difficulty);
      });
      
      console.log('Fallback generation successful');
      res.status(200).json(fallbackResult);
    } catch (fallbackError) {
      console.error('Fallback generation also failed:', fallbackError);
      
      // Final fallback - return basic structure
      const basicResponse = {
        topics: [
          {
            name: `Introduction to ${title}`,
            subtopics: ["Basic Concepts", "Fundamentals", "Getting Started"]
          },
          {
            name: `Core ${title} Concepts`,
            subtopics: ["Main Principles", "Key Components", "Essential Features"]
          },
          {
            name: `Advanced ${title}`,
            subtopics: ["Advanced Techniques", "Best Practices", "Real-world Applications"]
          }
        ]
      };
      
      console.log('Returning basic fallback response');
      res.status(200).json(basicResponse);
    }
  }
}
