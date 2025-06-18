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
    exmexplain: z.array(z.string()),
    subtopicVisualizationHtml: z.array(z.object({
      step: z.string(),
      completeHtml: z.string().describe("Complete, self-contained HTML file with embedded CSS and JS that can be rendered directly in a browser"),
      explanation: z.string(),
      purpose: z.string()
    })).describe("An array of step-by-step visualization components for this specific subtopic")
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
  visualizationHtml: z.array(z.object({
    step: z.string(),
    completeHtml: z.string().describe("Complete, self-contained HTML file with embedded CSS and JS that can be rendered directly in a browser"),
    explanation: z.string(),
    purpose: z.string()
  })).describe("An array of step-by-step visualization components, each containing a complete HTML file for rendering the topic visualization"),
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
    subexplain: z.string(),
    subtopicVisualizationHtml: z.array(z.object({
      step: z.string(),
      completeHtml: z.string().describe("Complete, self-contained HTML file with embedded CSS and JS that can be rendered directly in a browser"),
      explanation: z.string(),
      purpose: z.string()
    })).describe("An array of step-by-step visualization components for this specific subtopic")
  })).optional(),
  webSearchTagline: z.string(),
  youtubeSearchTagline: z.string(),
  visualizationHtml: z.array(z.object({
    step: z.string(),
    completeHtml: z.string().describe("Complete, self-contained HTML file with embedded CSS and JS that can be rendered directly in a browser"),
    explanation: z.string(),
    purpose: z.string()
  })).describe("An array of step-by-step visualization components for the topic")
});

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
      Provide comprehensive information about "${topic}" following this structured format:
      
      1. Topic Name: A clear, concise title for the topic
      
      2. Description: A detailed explanation (minimum 100 words) that covers:
         - What the topic is and its purpose
         - Why it's important to learn
         - Basic concepts and principles
         - Real-world applications and relevance
      
      3. Subtopic Generation (MANDATORY for topics with multiple components):
         Generate 2-4 subtopics for topics that can be broken down into distinct concepts.
         Each subtopic should include:
         - subtop: Clear subtopic name
         - subexplain: Detailed explanation (minimum 50 words) covering purpose, relevance, and relationship to main topic
         - subtopicVisualizationHtml: Array of 2-3 visualization steps for this subtopic
           * Each step should have: step name, completeHtml (self-contained HTML with CSS/JS), explanation, and purpose
           * Focus on visual representation specific to this subtopic
           * Include interactive elements and animations
           * Use modern UI design with colors, gradients, and smooth transitions
      
      4. Visualization Components:
         Create an array of 3-5 step-by-step visualization components for the main topic.
         Each component should include:
         - step: Step name or description
         - completeHtml: Complete, self-contained HTML file with embedded CSS and JS
         - explanation: What this visualization step shows
         - purpose: Why this step is important for understanding
         
         Visualization guidelines:
         - Use modern, attractive styling with gradients and animations
         - Include interactive elements like buttons, sliders, and real-time updates
         - Make it responsive and mobile-friendly
         - Focus on visual understanding rather than code display
         - Use color coding and visual metaphors
         - Include step navigation and progress indicators
      
      5. Search Optimization:
         - webSearchTagline: Optimized search term for finding comprehensive articles and documentation
         - youtubeSearchTagline: Optimized search term for finding video tutorials and explanations
      
      Ensure the response is comprehensive, well-structured, and provides valuable learning content.
      Focus on practical understanding and visual learning rather than theoretical explanations.
      Make visualizations engaging and interactive to enhance the learning experience.
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
      subtopics: [],
      webSearchTagline: `${topic} basic information and tutorials`,
      youtubeSearchTagline: `${topic} tutorials and explanations`,
      visualizationHtml: [],
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
    // Main attempt with retry mechanism
    const result = await retryWithBackoff(async () => {
      const promptWithTopic = `
    Provide detailed information on the topic: "${topic}" following these structured guidelines:
    1. Topic Header (Max 50 characters)
      A clear and concise title summarizing the topic.
      If Question iS One or Two Words Answer Then Give Topic As the Answer Word
    2. Description (Min 50 words)
      - A well-explained and easy-to-understand description.
      - Easy Description Even Beginner can Understand
      - Provide context and relevance.
    3.  **Subtopic Generation (MANDATORY - Generate subtopics for ALL topics that can be broken down):** 
      - ALWAYS generate subtopics for topics that have multiple components, concepts, or aspects
      - For complex topics, generate 2-4 subtopics that cover the main aspects
      - For simpler topics, generate 1-2 subtopics that break down the concept
      - Each subtopic should be a significant, distinct aspect of the main topic
      - Generate subtopics following this structure:
      [
        {
          "subtop": "Subtopic Name 1",
          "subexplain": "A detailed explanation (min 50 words) of Subtopic Name 1.  Explain its purpose, relevance, and how it relates to the main topic.",
          "subexample": "For code topics: A complete, working code example demonstrating the subtopic. For non-code topics: A clear text-based example or representation.",
          "exmexplain": [
            "Step-by-step explanation of the subexample of the topic."
          ],
          "subtopicVisualizationHtml": [
            {
              "step": "Subtopic Step 1",
              "completeHtml": "Complete, self-contained HTML file with embedded CSS and JS for this subtopic visualization",
              "explanation": "What this subtopic visualization step shows",
              "purpose": "Why this subtopic step is important"
            },
            {
              "step": "Subtopic Step 2", 
              "completeHtml": "Complete, self-contained HTML file with embedded CSS and JS for this subtopic visualization",
              "explanation": "What this subtopic visualization step shows",
              "purpose": "Why this subtopic step is important"
            }
          ]
        },
        {
          "subtop": "Subtopic Name 2",
          "subexplain": "A detailed explanation (min 50 words) of Subtopic Name 2. Explain its purpose, relevance, and how it relates to the main topic.",
          "subexample": "For code topics: A complete, working code example demonstrating the subtopic. For non-code topics: A clear text-based example or representation.",
          "exmexplain": [
            "Step-by-step explanation of the subexample of the topic."
          ],
          "subtopicVisualizationHtml": [
            {
              "step": "Subtopic Step 1",
              "completeHtml": "Complete, self-contained HTML file with embedded CSS and JS for this subtopic visualization",
              "explanation": "What this subtopic visualization step shows", 
              "purpose": "Why this subtopic step is important"
            },
            {
              "step": "Subtopic Step 2",
              "completeHtml": "Complete, self-contained HTML file with embedded CSS and JS for this subtopic visualization",
              "explanation": "What this subtopic visualization step shows",
              "purpose": "Why this subtopic step is important"
            }
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
      *   **subtopicVisualizationHtml (Array):** Each subtopic MUST include its own visualization components following the same structure as main topic visualizations:
        - Each subtopic should have 2-4 visualization steps specific to that subtopic
        - Each step should be focused on explaining that particular subtopic concept
        - Use the same HTML/CSS/JS structure as main topic visualizations
        - Make visualizations specific to the subtopic's unique aspects
        - Include interactive elements that demonstrate the subtopic's functionality
        - Show how the subtopic relates to the main topic
      - **IMPORTANT:** Generate subtopics for topics like:
        * Data Structures (e.g., Arrays, Linked Lists, Trees, Graphs, Hash Tables, Stacks, Queues)
        * Algorithms (e.g., Sorting, Searching, Graph Algorithms, Dynamic Programming)
        * Programming Concepts (e.g., OOP, Functional Programming, Design Patterns)
        * System Design (e.g., Architecture Patterns, Scalability, Security, Performance)
        * Frameworks/Libraries (e.g., React, Node.js, Django, Spring)
        * Database Concepts (e.g., SQL, NoSQL, ACID, CAP Theorem)
        * Network Protocols (e.g., HTTP, TCP/IP, WebSocket, REST)
        * Security Concepts (e.g., Authentication, Authorization, Encryption, OAuth)
        * DevOps (e.g., CI/CD, Containerization, Orchestration, Monitoring)
        * Any topic that has multiple components, phases, or aspects
    4. Visualization (MANDATORY for all topics - Enhanced with more steps and better visual understanding)
      - EVERY topic must include a visualizationHtml field containing an array of step-by-step visualization Animated Diagrams or Visual Elements.
       *** Above Code and below code (HTML, CSS, JS) are Only Samples Not Complete Code You SHould Give Complete Good Code With Animated elements and Easy Understanding visual elements 
       *** Dont Give Large Paragraphs and Codes and Explanations instead Give Visual Diagrams and animations and interactive elements
       *** Give More  Visual Elements Step Diagrams So User can Understand  Dont Give Theory Like Give Diagrams and Flowschart and etc Can Understand by viewing and Interacting with it
      *** Output Can Easily Understand By Seeing and Interacting with it Not By Completely Reading Like that So Generate Html css Js COmplete Code Accordingly for all Visualization Areas Keep that In Mind Give Animations and Interactive Elements and Use Different Colors except black
      - Each visualization component should follow this structure:
        {
          "step": "Step name or description (e.g., 'Initial Setup', 'Data Flow', 'Algorithm Execution')",
          "completeHtml": "Complete, self-contained HTML file with embedded CSS and JS that can be rendered directly in a browser",
          "explanation": "Detailed explanation of what this visualization step shows",
          "purpose": "Why this step is important for understanding the topic"
        }
      - For Data Structure topics (Enhanced visualization):
        * Step 1: "Basic Structure Introduction" - Show the fundamental building blocks, nodes, elements, and their relationships with clear labels and colors
        * Step 2: "Memory Layout Visualization" - Display how data is stored in memory with address pointers, memory blocks, and allocation patterns
        * Step 3: "Element Insertion Process" - Animate the step-by-step insertion of elements showing before/after states with visual indicators
        * Step 4: "Element Deletion Process" - Show removal process with memory cleanup and pointer adjustments
        * Step 5: "Search/Traversal Visualization" - Demonstrate how elements are accessed, searched, or traversed with path highlighting
        * Step 6: "Performance Metrics Display" - Show time complexity, space complexity, and real-time performance indicators
        * Step 7: "Comparison with Other Structures" - Side-by-side comparison showing advantages/disadvantages
        * Step 8: "Real-world Application Examples" - Visual representation of where this data structure is used in real applications
      - For Algorithm topics:
        * Step 1: "Input Data Visualization" - Show initial data state with clear visual representation
        * Step 2: "Algorithm Initialization" - Display setup phase, variables, and initial conditions
        * Step 3: "Step-by-Step Execution" - Animate each algorithm step with visual feedback and state changes
        * Step 4: "Intermediate States" - Show data transformation at each major step
        * Step 5: "Optimization Visualization" - Display efficiency improvements and optimization techniques
        * Step 6: "Final Result Display" - Show completed algorithm with final output and analysis
        * Step 7: "Performance Analysis" - Visual charts showing time/space complexity and efficiency metrics
        * Step 8: "Edge Cases and Error Handling" - Visual representation of boundary conditions and error scenarios
      - For Programming Concepts:
        * Step 1: "Concept Foundation" - Visual introduction to the core concept with diagrams and examples
        * Step 2: "Component Breakdown" - Show individual parts and how they work together
        * Step 3: "Flow Control Visualization" - Demonstrate program flow, decision points, and execution paths
        * Step 4: "Data Flow Diagrams" - Show how data moves through the system
        * Step 5: "State Management" - Visual representation of variable states and changes
        * Step 6: "Error Handling Scenarios" - Show different error conditions and how they're handled
        * Step 7: "Best Practices Display" - Visual examples of good vs bad practices
        * Step 8: "Real-world Implementation" - Show practical applications and use cases
      - For System Design topics:
        * Step 1: "System Architecture Overview" - High-level system diagram with all major components
        * Step 2: "Component Interaction Flow" - Show how different parts communicate and interact
        * Step 3: "Data Flow Visualization" - Demonstrate data movement through the system
        * Step 4: "Scalability Patterns" - Show how the system handles increased load
        * Step 5: "Security Implementation" - Visual representation of security measures and protocols
        * Step 6: "Performance Monitoring" - Real-time performance metrics and monitoring dashboards
        * Step 7: "Failure Scenarios" - Show how the system handles failures and recovery
        * Step 8: "Optimization Strategies" - Visual examples of system optimization techniques
      - For Conceptual topics:
        * Step 1: "Concept Introduction" - Visual foundation with clear explanations and examples
        * Step 2: "Core Principles Visualization" - Show fundamental principles with interactive diagrams
        * Step 3: "Relationship Mapping" - Display connections between related concepts
        * Step 4: "Hierarchy and Classification" - Show concept hierarchy and categorization
        * Step 5: "Application Scenarios" - Visual examples of where the concept is applied
        * Step 6: "Comparison Analysis" - Side-by-side comparison with related concepts
        * Step 7: "Evolution and History" - Show how the concept has developed over time
        * Step 8: "Future Implications" - Visual representation of future applications and trends
      - Each completeHtml should be:
        * A complete HTML file with <!DOCTYPE html>, <html>, <head>, and <body> tags
        * Include embedded <style> tags for CSS with modern, attractive styling
        * Include embedded <script> tags for JavaScript with smooth animations
        * Self-contained (no external dependencies except CDN libraries if needed)
        * Visually appealing with modern UI design, gradients, shadows, and smooth transitions
        * Highly interactive with buttons, sliders, animations, real-time updates, and user controls
        * Responsive and mobile-friendly with adaptive layouts
        * Include clear visual indicators, progress bars, and status updates
        * Use color coding, icons, and visual metaphors to enhance understanding
        * Include tooltips, hover effects, and click interactions for better user experience
        * Show step-by-step progression with clear visual feedback
        * Include pause/play controls for animations and step navigation
        * Use modern CSS features like flexbox, grid, and CSS animations
        * Include visual feedback for user interactions (hover, click, focus states)
      - The completeHtml must be a single string containing a complete HTML file that can be rendered directly
      - Do NOT use Mermaid or any diagram syntax. Only HTML, CSS, and JS.
      - Focus on visual representation and understanding - avoid showing code in visualizations
      - Use visual metaphors, diagrams, charts, and interactive elements to explain concepts
      - Example structure:
        [
          {
            "step": "Basic Structure Setup",
            "completeHtml": "<!DOCTYPE html><html><head><title>Step 1</title><style>/* Modern CSS with animations */</style></head><body><div id='container'>...</div><script>/* Interactive JS with smooth animations */</script></body></html>",
            "explanation": "This step shows the basic structure and setup of the concept with interactive elements...",
            "purpose": "To establish the foundation for understanding the topic with visual clarity..."
          },
          {
            "step": "Data Processing Visualization",
            "completeHtml": "<!DOCTYPE html><html><head><title>Step 2</title><style>/* Enhanced CSS with visual effects */</style></head><body><div id='process'>...</div><script>/* Advanced JS with real-time updates */</script></body></html>",
            "explanation": "This step demonstrates how data flows and is processed with visual feedback...",
            "purpose": "To show the core concept in action with enhanced visual understanding..."
          }
        ]

        ## Above Code are Only Samples Not Complete Code You SHould Give Complete Good Code With Animated elements and Easy Understanding visual elements 
        ## Dont Give Large Paragraphs and Codes and Explanations instead Give Visual Diagrams and animations and interactive elements
    5. Points (Min 3 with Each min of 50 characters) 
      - For example if its Code then Give Time and Space Complexity like that others give Other related to it
      - Important Points to About the Person Or Any Topic
    6. Code (If applicable)
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
    7. Code Explanation (If code is present then its compulsory)
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
    8. Importance (3-5 points)
      -Importance or Advantages About the Topic
      - Highlight key reasons why this topic matters.
      - Discuss modern applications and real-world impact.
    9. Prerequisites (1-5 points)
      - List the fundamental concepts or topics that should be understood before learning this topic
      - Include any required background knowledge or skills
      - Specify any tools, software, or resources needed
    10. Learning Objectives (2-5 points)
      - Define clear, measurable outcomes that learners should achieve
      - Include both theoretical understanding and practical skills
      - Focus on what learners will be able to do after mastering the topic
    11. Common Misconceptions (2-4 points)
        - Identify frequent misunderstandings about the topic
        - Provide detailed explanations of why these misconceptions occur
        - Offer clear corrections and proper understanding
        - Include real-world examples to illustrate the correct concepts
    12. Practice Exercises (2-4 problems)
        - Create exercises of varying difficulty levels (beginner, intermediate, advanced)
        - Include detailed solutions and explanations
        - Focus on practical application of the concepts
        - Provide step-by-step guidance for solving each problem
    13. Search Taglines
        - Provide one optimized search tagline for web and one for YouTube
        - The taglines should be:
          * Concise and focused on the main topic
          * Optimized for search engines
          * For web search: focus on finding comprehensive articles and documentation
          * For YouTube: focus on finding the best video tutorials and explanations
    `;

      return await generateObject({
        model: google('gemini-2.0-flash-exp'),
        schema: topicSchema,
        prompt: promptWithTopic,
        apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
      });
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

    console.log('Main generation successful');
    res.status(200).json(response);
  } catch (error) {
    console.error('Main generation failed after retries:', error);
    
    try {
      // Fallback attempt with retry mechanism
      console.log('Attempting fallback generation...');
      const fallbackResponse = await retryWithBackoff(async () => {
        return await getFallbackResponse(topic);
      });
      
      console.log('Fallback generation successful');
      res.status(200).json(fallbackResponse);
    } catch (fallbackError) {
      console.error('Fallback generation also failed:', fallbackError);
      
      // Final fallback - return basic structure
      const basicResponse = {
        topic: topic,
        description: `Basic information about ${topic}. This is a simplified response as the detailed generation failed.`,
        subtopics: [],
        webSearchTagline: `${topic} basic information and tutorials`,
        youtubeSearchTagline: `${topic} tutorials and explanations`,
        visualizationHtml: [],
        youtubeResults: [],
        webResults: []
      };
      
      console.log('Returning basic fallback response');
      res.status(200).json(basicResponse);
    }
  }
}