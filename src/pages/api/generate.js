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
    Create a comprehensive learning plan for "${title}" tailored to difficulty level: ${difficulty.join(", ")}.
    
    IMPORTANT GUIDELINES:
    - Each topic should be a distinct, separate learning area
    - Subtopics should be specific, actionable learning objectives within each topic
    - NO combining of topics - keep them separate and focused
    - Ensure logical progression from foundational to advanced concepts
    
    DIFFICULTY-BASED REQUIREMENTS:
    
    EASY LEVEL:
    - 4-5 core topics covering essential fundamentals
    - 3-4 subtopics per topic focusing on basic concepts
    - Focus on getting started and core principles
    - Include: Introduction, Basic Concepts, Core Fundamentals, Essential Applications
    
    MEDIUM LEVEL:
    - 6-8 topics covering comprehensive understanding
    - 4-6 subtopics per topic with practical applications
    - Include intermediate concepts and real-world usage
    - Add: Advanced Fundamentals, Practical Implementation, Problem-Solving, Best Practices
    
    HARD LEVEL:
    - 8-12 topics covering complete mastery
    - 5-8 subtopics per topic with detailed breakdown
    - Include advanced techniques, optimization, and expert-level concepts
    - Comprehensive coverage: From basics to expert-level mastery
    - Add: Advanced Techniques, Optimization, Expert Patterns, Industry Standards, Advanced Problem-Solving
    
    TOPIC STRUCTURE REQUIREMENTS:
    1. Start with "Introduction to [Topic]" for foundational concepts
    2. Include "Core [Topic] Concepts" for fundamental understanding
    3. Add "Advanced [Topic]" for higher-level concepts
    4. Include practical topics like "Real-world Applications" and "Best Practices"
    5. For Hard level: Add "Expert-level [Topic]" and "Advanced Optimization"
    
    SUBTOPIC REQUIREMENTS:
    - Each subtopic should be a specific, learnable concept
    - Focus on practical, hands-on learning objectives
    - Include both theoretical understanding and practical application
    - Ensure progressive difficulty within each topic
    
    RESPONSE FORMAT:
    Return an array of topics, each containing:
    - name: Clear, descriptive topic title
    - subtopics: Array of specific, actionable subtopic names
    
    Make the learning path comprehensive, well-structured, and appropriate for the specified difficulty level.
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
        model: google('gemini-1.5-flash'),
        schema: z.object({
          topics: z.array(
            z.object({
              name: z.string(),
              subtopics: z.array(z.string()),
            })
          ),
        }),
        prompt: `Create a comprehensive learning plan for "${title}" with difficulty level: ${difficulty.join(", ")}.

IMPORTANT REQUIREMENTS:
- Generate separate, distinct topics (NO combining topics)
- Each topic should be a focused learning area
- Subtopics should be specific, actionable learning objectives
- Ensure complete coverage from basic to advanced based on difficulty level

DIFFICULTY-BASED STRUCTURE:

EASY LEVEL (4-5 topics):
- Introduction to [Topic] - Basic concepts, getting started, fundamentals
- Core [Topic] Fundamentals - Essential principles, basic operations, key concepts
- Essential [Topic] Applications - Practical usage, common scenarios, basic implementations
- [Topic] Best Practices - Basic guidelines, common patterns, fundamental techniques

MEDIUM LEVEL (6-8 topics):
- Introduction to [Topic] - Comprehensive overview, foundational concepts
- Core [Topic] Fundamentals - Detailed principles, intermediate operations, advanced basics
- Advanced [Topic] Concepts - Complex operations, sophisticated techniques, deeper understanding
- Practical [Topic] Implementation - Real-world applications, hands-on projects, practical scenarios
- [Topic] Problem-Solving - Common challenges, solution patterns, troubleshooting
- [Topic] Best Practices & Optimization - Performance tips, efficiency techniques, industry standards
- Advanced [Topic] Applications - Complex use cases, advanced implementations, specialized scenarios

HARD LEVEL (8-12 topics):
- Introduction to [Topic] - Complete overview, all foundational concepts
- Core [Topic] Fundamentals - Comprehensive principles, all basic operations
- Intermediate [Topic] Concepts - Advanced basics, sophisticated fundamentals
- Advanced [Topic] Techniques - Complex operations, expert-level techniques, advanced methodologies
- Expert [Topic] Implementation - Master-level applications, complex real-world scenarios
- Advanced [Topic] Problem-Solving - Complex challenges, advanced solution patterns, optimization techniques
- [Topic] Performance Optimization - Advanced optimization, efficiency maximization, performance tuning
- Expert [Topic] Patterns - Advanced design patterns, sophisticated architectures, expert-level patterns
- [Topic] Industry Standards - Professional standards, enterprise-level practices, industry best practices
- Advanced [Topic] Applications - Complex use cases, specialized implementations, cutting-edge applications
- [Topic] Mastery Techniques - Expert-level mastery, advanced optimization, ultimate techniques
- [Topic] Advanced Problem-Solving - Complex scenarios, expert-level challenges, mastery-level solutions

SUBDIVISION REQUIREMENTS:
- Each topic must have 3-8 subtopics (based on difficulty)
- Subtopics should be specific, learnable concepts
- Include both theoretical understanding and practical application
- Ensure progressive difficulty within each topic
- Focus on hands-on, practical learning objectives

Generate a structured, comprehensive learning path that covers all necessary concepts for the specified difficulty level, ensuring complete mastery from basic to advanced concepts.`,
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
