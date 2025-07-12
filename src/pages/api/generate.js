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
  const fallbackPrompt = `Create a comprehensive learning plan for "${title}" with difficulty level: ${difficulty.join(", ")}.

IMPORTANT REQUIREMENTS:
- Generate specific, distinct topics related to the actual subject (NOT generic topics like "Introduction", "Core", etc.)
- Each topic should be a specific method, technique, or concept within the subject area
- Subtopics should be specific, actionable learning objectives within each topic
- Ensure complete coverage from basic to advanced based on difficulty level
- Dont Give Bunch of Topics in One Topic[Example : LFS,DFS ,LinkedList,Stack,Queue,Tree,Graph,etc.] Give as Individal Topics
- This Generation of Topics and Subtopics is Used for Roadmap Based learning for The Roadmap We Are Covering The Topic based on The Level So Give Topics as Mentioned Liek Below.
- Topics should be the actual names of methods/techniques/concepts in the subject


EXAMPLES:
- For "Sorting": topics should be "Bubble Sort", "Quick Sort", "Merge Sort", etc.
- For "Machine Learning": topics should be "Linear Regression", "Decision Trees", "Neural Networks", etc.
- For "JavaScript": topics should be "Variables & Data Types", "Functions", "DOM Manipulation", etc.
- For "React": topics should be "Components", "Hooks", "State Management", etc.

DIFFICULTY-BASED STRUCTURE:

EASY LEVEL:
  -Based On the Topic User Need to Master Give All Important and Easy Topics and Subtopics in That user can learn
  -This Level is the Beginner Level So Give all Important Easy Topics So he Can Easily Learn Basics In That Topic
  -In The Easy Topic Give all Easy Subtopics in that(Easy Subtopics and Important for that Topics)

MEDIUM LEVEL:
  -Focus on intermediate and advanced methods/concepts within the subject area
  -Include both theoretical understanding and practical implementation techniques
  -Provide comprehensive subtopics that cover both depth and breadth
  -Include performance considerations and scalability aspects

HARD LEVEL:
  -Comprehensive coverage of all major methods/concepts in the subject area
  -Include advanced techniques, optimization strategies, and expert-level concepts
  -Include cutting-edge techniques and Important Algorithms in that Topic
  -In Hard Give All There Topic and Need to Learn Topics With Sutopics So He can Be The Mastery in That Topic 
  -So Hard How Long It is Give all Topics and Subtopics in that Topic So He Can Mastery Every topic

SUBDIVISION REQUIREMENTS:
  - Based On the Topic of That specific Topic Generate All Possible Subtopics in that Topic So He Can Learn Every Thing in that Topic
  - if hard Generate All Possible Subtopics in that Topic So He Can Learn Every Thing in that Topic and Different Methods also in That


Generate a structured, comprehensive learning path with specific topic names that are actual methods, techniques, or concepts within the subject area, ensuring complete mastery from basic to advanced concepts.`
       ;

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
- Generate specific, distinct topics related to the actual subject (NOT generic topics like "Introduction", "Core", etc.)
- Each topic should be a specific method, technique, or concept within the subject area
- Subtopics should be specific, actionable learning objectives within each topic
- Ensure complete coverage from basic to advanced based on difficulty level
- Dont Give Bunch of Topics in One Topic[Example : LFS,DFS ,LinkedList,Stack,Queue,Tree,Graph,etc.] Give as Individal Topics
- This Generation of Topics and Subtopics is Used for Roadmap Based learning for The Roadmap We Are Covering The Topic based on The Level So Give Topics as Mentioned Liek Below.
- Topics should be the actual names of methods/techniques/concepts in the subject


EXAMPLES:
- For "Sorting": topics should be "Bubble Sort", "Quick Sort", "Merge Sort", etc.
- For "Machine Learning": topics should be "Linear Regression", "Decision Trees", "Neural Networks", etc.
- For "JavaScript": topics should be "Variables & Data Types", "Functions", "DOM Manipulation", etc.
- For "React": topics should be "Components", "Hooks", "State Management", etc.

DIFFICULTY-BASED STRUCTURE:

EASY LEVEL:
  -Based On the Topic User Need to Master Give All Important and Easy Topics and Subtopics in That user can learn
  -This Level is the Beginner Level So Give all Important Easy Topics So he Can Easily Learn Basics In That Topic
  -In The Easy Topic Give all Easy Subtopics in that(Easy Subtopics and Important for that Topics)

MEDIUM LEVEL:
  -Focus on intermediate and advanced methods/concepts within the subject area
  -Include both theoretical understanding and practical implementation techniques
  -Provide comprehensive subtopics that cover both depth and breadth
  -Include performance considerations and scalability aspects

HARD LEVEL:
  -Comprehensive coverage of all major methods/concepts in the subject area
  -Include advanced techniques, optimization strategies, and expert-level concepts
  -Include cutting-edge techniques and Important Algorithms in that Topic
  -In Hard Give All There Topic and Need to Learn Topics With Sutopics So He can Be The Mastery in That Topic 
  -So Hard How Long It is Give all Topics and Subtopics in that Topic So He Can Mastery Every topic

SUBDIVISION REQUIREMENTS:
  - Based On the Topic of That specific Topic Generate All Possible Subtopics in that Topic So He Can Learn Every Thing in that Topic
  - if hard Generate All Possible Subtopics in that Topic So He Can Learn Every Thing in that Topic and Different Methods also in That


Generate a structured, comprehensive learning path with specific topic names that are actual methods, techniques, or concepts within the subject area, ensuring complete mastery from basic to advanced concepts.`,
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
      
      // Final fallback - return basic structure with specific topic names
      const basicResponse = {
        topics: [
          {
            name: `${title} Fundamentals`,
            subtopics: ["Basic Concepts", "Core Principles", "Essential Features"]
          },
          {
            name: `${title} Core Methods`,
            subtopics: ["Main Techniques", "Key Approaches", "Standard Practices"]
          },
          {
            name: `${title} Advanced Techniques`,
            subtopics: ["Advanced Methods", "Best Practices", "Real-world Applications"]
          }
        ]
      };
      
      console.log('Returning basic fallback response');
      res.status(200).json(basicResponse);
    }
  }
}
