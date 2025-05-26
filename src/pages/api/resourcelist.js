// pages/api/generate.ts
import { google } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { z } from 'zod';
import axios from 'axios';

const topicSchema = z.object({
  topic: z.string().max(100, "Topic must not exceed 100 characters"),
  describe: z.string()
    .min(50, "Description must be at least 50 words"),
  subtopics: z.array(z.object({
    subtop: z.string(),
    subexplain: z.string().min(50),
    subexample: z.string(),
    exmexplain: z.array(z.string())
  })).default([]),
  points: z.array(z.string()).min(3, "Minimum 3 examples")
    .describe("Key technical points, specifications, or characteristics about the topic"),
  code: z.object({
    topicofcode: z.string(),
    tcode: z.string()
  }).optional(),
  define: z.array(z.object({
    code: z.string(),
    explain: z.string()
  })).default([]),
  visualization: z.object({
    hasVisualization: z.boolean().default(false),
    mermaidDiagram: z.string().optional(),
    diagramExplanation: z.string().optional(),
    operationSteps: z.array(z.object({
      operation: z.string(),
      steps: z.array(z.object({
        stepNumber: z.number(),
        diagram: z.string(),
        description: z.string()
      }))
    })).optional()
  }).optional(),
  importance: z.array(z.string())
    .min(3, "Must provide at least 3 points of importance")
    .max(5, "Cannot exceed 5 points of importance")
    .describe("Real-world applications, industry impact, and practical significance of understanding this topic"),
  prerequisites: z.array(z.string())
    .min(1, "Must provide at least 1 prerequisite")
    .max(5, "Cannot exceed 5 prerequisites")
    .describe("Topics or concepts that should be understood before learning this topic"),
  learningObjectives: z.array(z.string())
    .min(2, "Must provide at least 2 learning objectives")
    .max(5, "Cannot exceed 5 learning objectives")
    .describe("What learners should be able to do after understanding this topic"),
  commonMisconceptions: z.array(z.object({
    misconception: z.string(),
    explanation: z.string(),
    correction: z.string()
  }))
    .min(2, "Must provide at least 2 common misconceptions")
    .max(4, "Cannot exceed 4 common misconceptions")
    .describe("Common mistakes or misunderstandings about this topic"),
  practiceExercises: z.array(z.object({
    question: z.string(),
    difficulty: z.enum(["beginner", "intermediate", "advanced"]),
    solution: z.string(),
    explanation: z.string()
  }))
    .min(2, "Must provide at least 2 practice exercises")
    .max(4, "Cannot exceed 4 practice exercises")
    .describe("Practice problems to reinforce understanding"),
  webSearchTagline: z.string().describe("A concise tagline for web search related to this topic"),
  youtubeSearchTagline: z.string().describe("A concise tagline for YouTube video search related to this topic")
});

// Add fallback schema for simpler response
const fallbackSchema = z.object({
  topic: z.string(),
  description: z.string(),
  subtopics: z.array(z.object({
    subtop: z.string(),
    subexplain: z.string()
  })).optional(),
  webSearchTagline: z.string(),
  youtubeSearchTagline: z.string()
});

async function fetchYouTubeVideos(query) {
  try {
    const response = await axios.get('https://www.googleapis.com/youtube/v3/search', {
      params: {
        part: 'snippet',
        q: query,
        type: 'video',
        maxResults: 6,
        key: process.env.YOUTUBE_API_KEY
      }
    });

    if (!response.data.items) {
      console.error('No YouTube results found');
      return [];
    }

    return response.data.items.map(item => ({
      url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
      title: item.snippet.title,
      channelTitle: item.snippet.channelTitle
    }));
  } catch (error) {
    console.error('YouTube API Error:', error.response?.data || error.message);
    return [];
  }
}

async function fetchWebResults(query) {
  if (!process.env.GOOGLE_SEARCH_ENGINE_ID) {
    console.error('GOOGLE_SEARCH_ENGINE_ID is not set. Please create a Custom Search Engine at https://programmablesearch.google.com/create');
    return [];
  }

  try {
    const response = await axios.get('https://www.googleapis.com/customsearch/v1', {
      params: {
        q: query,
        cx: process.env.GOOGLE_SEARCH_ENGINE_ID,
        key: process.env.GOOGLE_API_KEY,
        num: 6
      }
    });

    if (!response.data.items) {
      console.error('No search results found');
      return [];
    }

    return response.data.items.map(item => ({
      url: item.link,
      title: item.title,
      snippet: item.snippet
    }));
  } catch (error) {
    console.error('Google Search API Error:', error.response?.data || error.message);
    if (error.response?.status === 429) {
      console.error('API quota exceeded');
    } else if (error.response?.status === 400) {
      console.error('Invalid Search Engine ID or API Key');
    }
    return [];
  }
}

async function getFallbackResponse(topic) {
  try {
    const fallbackPrompt = `
      Provide basic information about "${topic}" following this structure:
      1. A clear topic name
      2. A simple description
      3. Optional: 2-3 main subtopics with brief explanations
      4. A web search tagline optimized for finding articles
      5. A YouTube search tagline optimized for finding video tutorials
      
      Keep the response simple and focused on the essential information.
      Make sure to include ALL required fields: topic, description, webSearchTagline, and youtubeSearchTagline.
    `;

    const result = await generateObject({
      model: google('gemini-2.0-flash-exp'),
      schema: fallbackSchema,
      prompt: fallbackPrompt,
      apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    });

    // Fetch URLs using the generated taglines
    const [youtubeResults, webResults] = await Promise.all([
      fetchYouTubeVideos(result.object.youtubeSearchTagline),
      fetchWebResults(result.object.webSearchTagline)
    ]);

    return {
      ...result.object,
      youtubeResults,
      webResults
    };
  } catch (error) {
    console.error('Fallback model error:', error);
    // Return a basic response if the fallback model fails
    return {
      topic: topic,
      description: `Basic information about ${topic}. This is a simplified response as the detailed generation failed.`,
      webSearchTagline: `${topic} basic information and tutorials`,
      youtubeSearchTagline: `${topic} tutorials and explanations`,
      youtubeResults: [],
      webResults: []
    };
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { topic } = req.body;

  if (!topic) {
    return res.status(400).json({ error: 'Topic is required' });
  }

  try {
    // Try the main detailed model first
    const promptWithTopic = `
    
    Provide detailed information on the topic: "${topic}" following these structured guidelines:

            1. Topic Header (Max 50 characters)
                
                A clear and concise title summarizing the topic.
                If Question iS One or Two Words Answer Then Give Topic As the Answer Word
            
            2. Description (Min 50 words)
              
              - A well-explained and easy-to-understand description.
              - Easy Description Even Beginner can Understand
              - Provide context and relevance.

            3.  **Subtopic Generation (If Applicable):** If subtopics are deemed appropriate, generate an array of subtopic objects, following this structure (Topic Related To It and Basic Important Topic):

                  
                    [
                      {
                        "subtop": "Subtopic Name 1",
                        "subexplain": "A detailed explanation (min 50 words) of Subtopic Name 1.  Explain its purpose, relevance, and how it relates to the main topic.",
                        "subexample": "For code topics: A complete, working code example demonstrating the subtopic. For non-code topics: A clear text-based example or representation.",
                        "exmexplain": [
                          "Step-by-step explanation of the subexample of the topic."
                        ]
                      },
                      {
                        "subtop": "Subtopic Name 2",
                        "subexplain": "A detailed explanation (min 50 words) of Subtopic Name 2. Explain its purpose, relevance, and how it relates to the main topic.",
                        "subexample": "For code topics: A complete, working code example demonstrating the subtopic. For non-code topics: A clear text-based example or representation.",
                        "exmexplain": [
                          "Step-by-step explanation of the subexample of the topic."
                        ]
                      }
                    ]
                  

                    *   **subtop (String):** A concise and descriptive name for the subtopic.
                    *   *subexplain (String):** A thorough and easy-to-understand explanation of the subtopic (minimum 50 words).
                    *   **subexample (String):** 
                      - For code topics: Provide a complete, working code example that demonstrates the subtopic in action. The code should be:
                        * Complete and runnable
                        * Well-formatted and properly indented
                        * Include necessary imports/dependencies
                        * Show clear input/output
                        * Use best practices
                      - For non-code topics: Provide a clear text-based example or representation that illustrates the concept.
                    *   **exmexplain (Array of Strings):** A list of strings, each providing a detailed explanation of the subexample above, step-by-step. Explain *why* each step is performed.

            4. Visualization (MANDATORY for all topics)
               - EVERY topic must include at least one of these visualizations:
                 * Basic structure visualization (mermaidDiagram)
                 * Step-by-step operation diagrams (operationSteps)
                 * Flow of data and state changes
                 * Concept visualization
                 * Process flow diagram
                 * Relationship diagram
                 * Timeline visualization
                 * Comparison diagram
                 
               - For DSA topics:
                 * MUST include both mermaidDiagram and operationSteps
                 * Show basic structure and all operations
                 * Include step-by-step diagrams for each operation
                 
               - For Programming topics:
                 * MUST include mermaidDiagram showing:
                   - Program flow
                   - Data flow
                   - Component relationships
                   - Architecture diagram
                 
               - For Conceptual topics:
                 * MUST include mermaidDiagram showing:
                   - Concept relationships
                   - Process flow
                   - Timeline
                   - Comparison charts
                   
               - For Algorithm topics:
                 * MUST include operationSteps showing:
                   - Step-by-step execution
                   - State changes
                   - Data transformations
                   
               - For System Design topics:
                 * MUST include mermaidDiagram showing:
                   - System architecture
                   - Component interactions
                   - Data flow
                   - Deployment diagram

               Format for mermaidDiagram:
               {
                 "mermaidDiagram": "flowchart TD\n...",
                 "diagramExplanation": "Clear explanation of the diagram"
               }

               Format for operationSteps:
               {
                 "operationSteps": [
                   {
                     "operation": "Operation Name",
                     "steps": [
                       {
                         "stepNumber": 1,
                         "diagram": "flowchart TD\n...",
                         "description": "Step explanation"
                       }
                     ]
                   }
                 ]
               }

               IMPORTANT RULES:
               1. EVERY topic MUST have at least one visualization
               2. DSA topics MUST have both mermaidDiagram and operationSteps
               3. Each operation MUST have at least 3 steps
               4. Each step MUST have a diagram and description
               5. Diagrams MUST follow the exact templates provided
               6. NO topic should be without visualization
               7. If a topic seems to not need visualization, create a concept/relationship diagram
               8. For abstract topics, use flowcharts or mind maps
               9. For historical topics, use timelines
               10. For comparison topics, use comparison charts

               Example for a non-technical topic:
               "flowchart TD
               subgraph Concept[Main Concept]
               A((Core Idea)) --> B((Related Concept 1))
               A --> C((Related Concept 2))
               B --> D((Example 1))
               C --> E((Example 2))
               end"

               Example for a technical topic:
               "flowchart TD
               subgraph System[System Architecture]
               A((Frontend)) --> B((API))
               B --> C((Database))
               C --> D((Cache))
               end"

               Example for an algorithm:
               "flowchart TD
               subgraph Step1[Initial State]
               A[Input] --> B[Process]
               B --> C[Output]
               end"

               REMEMBER: NO topic should be without visualization. If unsure, create a concept map or flowchart.

            5. Operation Steps (For DSA Topics)
               - For each operation (insertion, deletion, etc.), provide:
                 * A clear operation name
                 * An array of steps, each with its own diagram
                 * A detailed explanation for each step
               - Format each operation step as:
                 {
                   "operation": "Operation Name (e.g., 'Binary Tree Insertion')",
                   "steps": [
                     {
                       "stepNumber": 1,
                       "diagram": "EXACT TEMPLATE FROM ABOVE",
                       "description": "Initial state of the data structure"
                     },
                     {
                       "stepNumber": 2,
                       "diagram": "EXACT TEMPLATE FROM ABOVE",
                       "description": "What changes in this step"
                     },
                     {
                       "stepNumber": 3,
                       "diagram": "EXACT TEMPLATE FROM ABOVE",
                       "description": "Final state after the operation"
                     }
                   ]
                 }
               - Example for Binary Tree Insertion:
                 * Show 3 steps: initial state, find position, insert node
                 * Each step should be a separate diagram
                 * Include clear progression from initial to final state
                 * Explain node changes in each step
               - Example for Binary Tree Deletion:
                 * Show 3 steps: initial state, find node, remove node
                 * Each step should be a separate diagram
                 * Include clear progression from initial to final state
                 * Explain node removal process in each step
               - Keep examples simple and focused on one operation at a time
               - Use small data structures (3-4 nodes) for clarity
               - Include clear visual transitions between states
               - Explain each pointer/node change in simple terms
               - Show each step as a separate diagram
               - Each step should have its own subgraph and clear explanation

            6. Points (Min 3 with Each min of 50 characters) 

              - For example if its Code then Give Time and Space Complexity like that others give Other related to it
             - Important Points to About the Person Or Any Topic
            
            7. Code (If applicable)
              - For code topics:
                * Provide a small, easy-to-understand implementation
                * Keep the code simple and focused on the core concept
                * Include only essential functionality
                * Use clear variable names and comments
                * Show basic input/output
                * Format: {
                  "topicofcode": "Simple Implementation of [Topic]",
                  "tcode": "Complete, working code example"
                }
              - For non-code topics:
                * Provide a text-based representation or example
                * Use clear formatting and structure
                * Include relevant diagrams or visualizations
                * Format: {
                  "topicofcode": "Example of [Topic]",
                  "tcode": "Text-based example or representation"
                }
              - The code/example should be:
                * Easy to understand
                * Well-documented
                * Follow best practices
                * Include comments explaining key parts
                * Show clear progression of concepts

            8. Code Explanation (If code is present then its compulsory)
              - For code topics:
                * Explain each line of code
                * Describe the purpose of each function
                * Explain the logic and flow
                * Highlight important concepts
                * Show how the code works step by step
              - For non-code topics:
                * Explain the example or representation
                * Break down the concept into parts
                * Show how different elements relate
                * Explain the significance of each part
              - Format: [
                {
                  "code": "Code snippet or example part",
                  "explain": "Detailed explanation of this part"
                }
              ]

            9. Importance (3-5 points)
              -Importance or Advantages About the Topic
              - Highlight key reasons why this topic matters.
              - Discuss modern applications and real-world impact.

            10. Prerequisites (1-5 points)
              - List the fundamental concepts or topics that should be understood before learning this topic
              - Include any required background knowledge or skills
              - Specify any tools, software, or resources needed

            11. Learning Objectives (2-5 points)
              - Define clear, measurable outcomes that learners should achieve
              - Include both theoretical understanding and practical skills
              - Focus on what learners will be able to do after mastering the topic

            12. Common Misconceptions (2-4 points)
                - Identify frequent misunderstandings about the topic
                - Provide detailed explanations of why these misconceptions occur
                - Offer clear corrections and proper understanding
                - Include real-world examples to illustrate the correct concepts

            13. Practice Exercises (2-4 problems)
                - Create exercises of varying difficulty levels (beginner, intermediate, advanced)
                - Include detailed solutions and explanations
                - Focus on practical application of the concepts
                - Provide step-by-step guidance for solving each problem

          14. Search Taglines
                - Provide one optimized search tagline for web and one for YouTube
                - The taglines should be:
                  * Concise and focused on the main topic
                  * Optimized for search engines
                  * For web search: focus on finding comprehensive articles and documentation
                  * For YouTube: focus on finding the best video tutorials and explanations

            `;

    const result = await generateObject({
      model: google('gemini-2.0-flash-exp'),
      schema: topicSchema,
      prompt: promptWithTopic,
      apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    });

    // Fetch URLs using the generated taglines
    const [youtubeResults, webResults] = await Promise.all([
      fetchYouTubeVideos(result.object.youtubeSearchTagline),
      fetchWebResults(result.object.webSearchTagline)
    ]);

    const response = {
      ...result.object,
      youtubeResults,
      webResults
    };

    console.log(response);
    res.status(200).json(response);
  } catch (error) {
    console.error('Main model error:', error);
    try {
      // If main model fails, try the fallback model
      const fallbackResponse = await getFallbackResponse(topic);
      console.log(fallbackResponse);
      res.status(200).json(fallbackResponse);
    } catch (fallbackError) {
      console.error('Both models failed:', fallbackError);
      // Return a minimal response if both models fail
      res.status(200).json({
        topic: topic,
        description: `Basic information about ${topic}. This is a simplified response as the detailed generation failed.`,
        webSearchTagline: `${topic} basic information and tutorials`,
        youtubeSearchTagline: `${topic} tutorials and explanations`,
        youtubeResults: [],
        webResults: []
      });
    }
  }
}