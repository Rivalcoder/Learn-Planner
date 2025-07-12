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
  leetcodeProblem: z.object({
    isProgrammingTopic: z.boolean().describe("Whether this topic is related to programming and has LeetCode problems"),
    selectedProblem: z.object({
      title: z.string(),
      difficulty: z.enum(["Easy", "Medium", "Hard"]),
      problemNumber: z.number(),
      url: z.string(),
      description: z.string(),
      tags: z.array(z.string()),
      whySelected: z.string().describe("Why this specific problem was chosen for this topic")
    }).optional().describe("The AI-selected LeetCode problem that best matches this topic"),
    alternativeProblems: z.array(z.object({
      title: z.string(),
      difficulty: z.enum(["Easy", "Medium", "Hard"]),
      problemNumber: z.number(),
      url: z.string(),
      description: z.string(),
      tags: z.array(z.string())
    })).min(0, "Must provide at least 0 alternative problems").max(4, "Cannot exceed 4 alternative problems").describe("Alternative LeetCode problems related to this topic with mixed difficulty levels")
  }).optional().describe("LeetCode problems related to this programming topic"),
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
  leetcodeProblem: z.object({
    isProgrammingTopic: z.boolean().describe("Whether this topic is related to programming and has LeetCode problems"),
    selectedProblem: z.object({
      title: z.string(),
      difficulty: z.enum(["Easy", "Medium", "Hard"]),
      problemNumber: z.number(),
      url: z.string(),
      description: z.string(),
      tags: z.array(z.string()),
      whySelected: z.string().describe("Why this specific problem was chosen for this topic")
    }).optional().describe("The AI-selected LeetCode problem that best matches this topic"),
    alternativeProblems: z.array(z.object({
      title: z.string(),
      difficulty: z.enum(["Easy", "Medium", "Hard"]),
      problemNumber: z.number(),
      url: z.string(),
      description: z.string(),
      tags: z.array(z.string())
    })).min(0, "Must provide at least 0 alternative problems").max(4, "Cannot exceed 4 alternative problems").describe("Alternative LeetCode problems related to this topic")
  }).optional().describe("LeetCode problems related to this programming topic"),
  webSearchTagline: z.string(),
  youtubeSearchTagline: z.string(),
  visualizationHtml: z.array(z.object({
    step: z.string(),
    completeHtml: z.string().describe("Complete, self-contained HTML file with embedded CSS and JS that can be rendered directly in a browser"),
    explanation: z.string(),
    purpose: z.string()
  })).describe("An array of step-by-step visualization components for the topic")
});

// Retry function with exponential backoff and timeout
async function retryWithBackoff(fn, maxRetries = 3, baseDelay = 1000, timeout = 30000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), timeout);
      });
      
      const resultPromise = fn();
      return await Promise.race([resultPromise, timeoutPromise]);
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
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('YouTube API timeout')), 10000);
    });
    
    const responsePromise = axios.get('https://www.googleapis.com/youtube/v3/search', {
      params: {
        part: 'snippet',
        q: query,
        type: 'video',
        maxResults: 6,
        key: process.env.YOUTUBE_API_KEY
      }
    });

    const response = await Promise.race([responsePromise, timeoutPromise]);

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
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Web search timeout')), 10000);
    });
    
    const responsePromise = axios.get('https://www.googleapis.com/customsearch/v1', {
      params: {
        q: query,
        cx: process.env.GOOGLE_SEARCH_ENGINE_ID,
        key: process.env.GOOGLE_API_KEY,
        num: 6
      }
    });

    const response = await Promise.race([responsePromise, timeoutPromise]);

    if (!response.data.items) {
      console.error('No web search results found');
      return [];
    }

    return response.data.items.map(item => ({
      url: item.link,
      title: item.title,
      snippet: item.snippet
    }));
  } catch (error) {
    console.error('Web search API Error:', error.response?.data || error.message);
    return [];
  }
}

async function fetchLeetCodeProblems(topic) {
  try {
    console.log('Generating LeetCode problems for topic:', topic);
    
    // Use AI to generate LeetCode problems instead of pre-generated list
    const leetcodePrompt = `
    For the topic "${topic}", determine if it's programming-related and generate relevant LeetCode problems.
    

    ###Give More Easy Problems than Medium/Hard Problems Because Beginners Need to Understand the Topic Step by Step So It is Important To Give More easy and 1 or 2 medium and hard problems
    PROGRAMMING TOPICS INCLUDE (but not limited to):
    - Data Structures: arrays, linked lists, trees, graphs, stacks, queues, hash tables, heaps
    - Algorithms: sorting, searching, dynamic programming, recursion, backtracking, greedy
    - Programming Concepts: OOP, functional programming, design patterns, SOLID principles
    - System Design: architecture, scalability, databases, caching, load balancing
    - Frameworks/Libraries: React, Node.js, Django, Spring, Express
    - Database: SQL, NoSQL, ACID, CAP theorem, indexing, transactions
    - Network Protocols: HTTP, TCP/IP, WebSocket, REST, GraphQL
    - Security: authentication, authorization, encryption, OAuth, JWT
    - DevOps: CI/CD, containerization, orchestration, monitoring
    - Web Technologies: HTML, CSS, JavaScript, TypeScript
    - Mobile Development: iOS, Android, React Native, Flutter
    - Cloud Computing: AWS, Azure, GCP, microservices, serverless
    - Programming Languages: Python, Java, C++, JavaScript, Go, Rust, Swift
    - Computer Science: data structures, algorithms, complexity analysis, optimization
    
    NON-PROGRAMMING TOPICS (examples):
    - History, literature, art, music, sports, cooking, travel, philosophy, biology, chemistry, physics (non-CS)
    
    If "${topic}" is programming-related, you MUST generate:
    1. One selected problem that best matches the topic (selectedProblem)
    2. EXACTLY 4 alternative problems for additional practice (alternativeProblems array)
    
    DIFFICULTY DISTRIBUTION REQUIREMENTS:
    - Provide a good mix of difficulty levels for progressive learning
    - Include 2-3 Easy problems for beginners to start with
    - Include 1-2 Medium problems for intermediate practice
    - Include 1 Hard problem for advanced learners
    - The selected problem should be Medium difficulty (best for learning the topic)
    
    CRITICAL: You MUST generate MORE EASY problems than Medium/Hard problems.
    RECOMMENDED DISTRIBUTION:
    - Selected Problem: 1 Medium (for focused learning)
    - Alternative Problems: 2 Easy + 1 Medium + 1 Hard = 4 total
    - Total: 2 Easy + 2 Medium + 1 Hard = 5 problems
    
    EASY PROBLEMS ARE ESSENTIAL for beginners to understand the topic step by step.
    DO NOT generate mostly Medium/Hard problems - focus on Easy problems for learning.
    
    IMPORTANT: You MUST provide both selectedProblem AND alternativeProblems array with 4 problems.
    
    For each problem, provide:
    - title: Problem title
    - difficulty: Easy, Medium, or Hard
    - problemNumber: LeetCode problem number
    - url: LeetCode problem URL
    - description: Brief description of the problem
    - tags: Relevant tags for the problem
    - whySelected: Why this problem was chosen for this topic (for selected problem only)
    
    LEARNING PROGRESSION:
    - Easy problems: Focus on basic concepts and fundamental understanding
    - Medium problems: Apply concepts in more complex scenarios
    - Hard problems: Advanced applications and optimization challenges
    
    If this is NOT a programming topic, return isProgrammingTopic: false.
    
    Focus on problems that directly relate to the core concepts of "${topic}".
    
    Example structure for programming topics:
    {
      "isProgrammingTopic": true,
      "selectedProblem": {
        "title": "Two Sum",
        "difficulty": "Medium",
        "problemNumber": 1,
        "url": "https://leetcode.com/problems/two-sum/",
        "description": "Find two numbers that add up to target",
        "tags": ["Array", "Hash Table"],
        "whySelected": "This problem directly tests array manipulation and hash table usage, core concepts of the topic"
      },
      "alternativeProblems": [
        {
          "title": "Valid Parentheses",
          "difficulty": "Easy",
          "problemNumber": 20,
          "url": "https://leetcode.com/problems/valid-parentheses/",
          "description": "Check if parentheses are valid using stack",
          "tags": ["Stack", "String"]
        },
        {
          "title": "Best Time to Buy and Sell Stock",
          "difficulty": "Easy",
          "problemNumber": 121,
          "url": "https://leetcode.com/problems/best-time-to-buy-and-sell-stock/",
          "description": "Find maximum profit from buying and selling stock",
          "tags": ["Array", "Dynamic Programming"]
        },
        {
          "title": "Maximum Subarray",
          "difficulty": "Medium",
          "problemNumber": 53,
          "url": "https://leetcode.com/problems/maximum-subarray/",
          "description": "Find contiguous subarray with largest sum",
          "tags": ["Array", "Divide and Conquer"]
        },
        {
          "title": "Trapping Rain Water",
          "difficulty": "Hard",
          "problemNumber": 42,
          "url": "https://leetcode.com/problems/trapping-rain-water/",
          "description": "Calculate trapped water between bars",
          "tags": ["Array", "Two Pointers", "Dynamic Programming"]
        }
      ]
    }
    
    Example for non-programming topics:
    {
      "isProgrammingTopic": false,
      "selectedProblem": null,
      "alternativeProblems": []
    }
    `;

    const leetcodeResult = await generateObject({
      model: google('gemini-1.5-flash'),
      schema: z.object({
        isProgrammingTopic: z.boolean().describe("Whether this topic is related to programming and has LeetCode problems"),
        selectedProblem: z.object({
          title: z.string(),
          difficulty: z.enum(["Easy", "Medium", "Hard"]),
          problemNumber: z.number(),
          url: z.string(),
          description: z.string(),
          tags: z.array(z.string()),
          whySelected: z.string().describe("Why this specific problem was chosen for this topic")
        }).optional().describe("The AI-selected LeetCode problem that best matches this topic"),
        alternativeProblems: z.array(z.object({
          title: z.string(),
          difficulty: z.enum(["Easy", "Medium", "Hard"]),
          problemNumber: z.number(),
          url: z.string(),
          description: z.string(),
          tags: z.array(z.string())
        })).min(0, "Must provide at least 0 alternative problems").max(4, "Cannot exceed 4 alternative problems").describe("Alternative LeetCode problems related to this topic with mixed difficulty levels")
      }),
      prompt: leetcodePrompt,
      apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    });

    // Validate and enhance the result if needed
    const result = leetcodeResult.object;
    console.log('LeetCode generation result:', result);
    
    if (result.isProgrammingTopic) {
      // Add fallback problems if AI didn't generate enough
      if (!result.selectedProblem) {
        console.warn('No selected problem generated, adding fallback');
        result.selectedProblem = {
          title: "Two Sum",
          difficulty: "Medium",
          problemNumber: 1,
          url: "https://leetcode.com/problems/two-sum/",
          description: "Find two numbers that add up to target",
          tags: ["Array", "Hash Table"],
          whySelected: "Basic array manipulation problem relevant to the topic"
        };
      }
      
      // Ensure we have some alternative problems (up to 4)
      if (!result.alternativeProblems || result.alternativeProblems.length === 0) {
        console.warn('No alternative problems generated, adding fallback problems');
        const fallbackProblems = [
          {
            title: "Valid Parentheses",
            difficulty: "Easy",
            problemNumber: 20,
            url: "https://leetcode.com/problems/valid-parentheses/",
            description: "Check if parentheses are valid using stack",
            tags: ["Stack", "String"]
          },
          {
            title: "Best Time to Buy and Sell Stock",
            difficulty: "Easy",
            problemNumber: 121,
            url: "https://leetcode.com/problems/best-time-to-buy-and-sell-stock/",
            description: "Find maximum profit from buying and selling stock",
            tags: ["Array", "Dynamic Programming"]
          },
          {
            title: "Climbing Stairs",
            difficulty: "Easy",
            problemNumber: 70,
            url: "https://leetcode.com/problems/climbing-stairs/",
            description: "Find ways to climb n stairs using dynamic programming",
            tags: ["Dynamic Programming", "Math"]
          },
          {
            title: "Maximum Subarray",
            difficulty: "Medium",
            problemNumber: 53,
            url: "https://leetcode.com/problems/maximum-subarray/",
            description: "Find contiguous subarray with largest sum",
            tags: ["Array", "Divide and Conquer"]
          }
        ];
        result.alternativeProblems = fallbackProblems;
      } else if (result.alternativeProblems.length > 4) {
        console.warn('Too many alternative problems, truncating to 4');
        result.alternativeProblems = result.alternativeProblems.slice(0, 4);
      }
    }

    return result;
  } catch (error) {
    console.error('Error generating LeetCode problems:', error);
    // Return default response if AI generation fails
    return {
      isProgrammingTopic: false,
      selectedProblem: null,
      alternativeProblems: []
    };
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
      
      6. LeetCode Problem Selection (OPTIONAL - Only for programming topics):
         - Determine if this topic is related to programming and has applicable LeetCode problems
         - For programming topics (data structures, algorithms, programming concepts, system design, etc.):
           * Set isProgrammingTopic to true
           * The AI will automatically select the most appropriate LeetCode problem based on the topic
           * The selected problem will be chosen from Easy, Medium, or Hard difficulty levels
           * Alternative problems will also be provided for additional practice
         - For non-programming topics (history, science, art, etc.):
           * Set isProgrammingTopic to false
           * No LeetCode problems will be included
         - The LeetCode problem selection will be handled automatically by the system
         - No manual selection is needed - the AI will choose the best problem based on topic relevance
      
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

    // Fetch URLs using the generated taglines and LeetCode problems
    const [youtubeResults, webResults, leetcodeProblems] = await Promise.all([
      fetchYouTubeVideos(result.object.youtubeSearchTagline),
      fetchWebResults(result.object.webSearchTagline),
      fetchLeetCodeProblems(topic)
    ]);

    return {
      ...result.object,
      youtubeResults,
      webResults,
      leetcodeProblem: leetcodeProblems
    };
  } catch (error) {
    console.error('Fallback model error:', error);
    
    // Log detailed error information for debugging
    if (error.cause && error.cause.issues) {
      console.error('Fallback schema validation errors:', JSON.stringify(error.cause.issues, null, 2));
    }
    
    // Return a basic response if the fallback model fails
    return {
      topic: topic,
      description: `Basic information about ${topic}. This is a simplified response as the detailed generation failed.`,
      subtopics: [],
      webSearchTagline: `${topic} basic information and tutorials`,
      youtubeSearchTagline: `${topic} tutorials and explanations`,
      visualizationHtml: [],
      youtubeResults: [],
      webResults: [],
      leetcodeProblem: {
        isProgrammingTopic: false,
        selectedProblem: null,
        alternativeProblems: []
      }
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
    Provide comprehensive information on the topic: "${topic}" following this structured format:
    
    1. Topic: Clear, concise title (max 50 characters)
    2. Description: Detailed explanation (min 50 words) that beginners can understand
    3. Subtopic Generation (MANDATORY for topics with multiple components):
       Generate 2-4 subtopics for complex topics, 1-2 for simpler topics. Each subtopic includes:
       - subtop: Clear subtopic name
       - subexplain: Detailed explanation (min 50 words)
       - subexample: Working code example for programming topics, clear example for others
       - exmexplain: Step-by-step explanation of the example
       - subtopicVisualizationHtml: 2-3 visualization steps specific to this subtopic
         * Each step: step name, completeHtml (self-contained HTML with CSS/JS), explanation, purpose
         * Focus on visual representation with interactive elements and animations
         * Use modern UI design with colors, gradients, and smooth transitions
    
    4. Visualization Components (MANDATORY):
       Create 3-5 step-by-step visualization components for the main topic. Each includes:
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
    
    5. Points: 3-5 key technical points or characteristics (min 50 characters each)
    6. Code (if Programming Topic Then Small Implementation of That Topic With Code Example): Simple, working implementation (give Code example In The User Asked Language if Not Give Using Python) Give Code Accordingly So I can Render With Highlighter in the Frontend
    7. Code Explanation: Step-by-step explanation of the Complete code of All The Above Code Lines(# Give All Lines explanation of teh Above coe Given even explain The Input Vairable Declare Also)
    8. Importance: 3-5 points about why this topic matters
    9. Prerequisites: 1-5 fundamental concepts needed before learning this topic
    10. Learning Objectives: 2-5 clear, measurable outcomes
    11. Common Misconceptions: 2-4 frequent misunderstandings with explanations and corrections
    12. Practice Exercises: 2-4 problems of varying difficulty (beginner, intermediate, advanced) with solutions
    13. Search Taglines:
        - webSearchTagline: Optimized for finding comprehensive articles and documentation
        - youtubeSearchTagline: Optimized for finding video tutorials and explanations
    
    Focus on practical understanding and visual learning. Make visualizations engaging and interactive.
    Keep responses concise but comprehensive. Avoid overly long explanations.
    `;

      return await generateObject({
        model: google('gemini-1.5-flash'),
        schema: topicSchema,
        prompt: promptWithTopic,
        apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
      });
    });

    // Fetch URLs using the generated taglines and LeetCode problems with timeouts
    const [youtubeResults, webResults, leetcodeProblems] = await Promise.allSettled([
      fetchYouTubeVideos(result.object.youtubeSearchTagline).catch((error) => {
        console.error('YouTube fetch error:', error);
        return [];
      }),
      fetchWebResults(result.object.webSearchTagline).catch((error) => {
        console.error('Web search fetch error:', error);
        return [];
      }),
      fetchLeetCodeProblems(topic).catch((error) => {
        console.error('LeetCode problems fetch error:', error);
        return {
          isProgrammingTopic: false,
          selectedProblem: null,
          alternativeProblems: []
        };
      })
    ]);

    const response = {
      ...result.object,
      youtubeResults: youtubeResults.status === 'fulfilled' ? youtubeResults.value : [],
      webResults: webResults.status === 'fulfilled' ? webResults.value : [],
      leetcodeProblem: leetcodeProblems.status === 'fulfilled' ? leetcodeProblems.value : {
        isProgrammingTopic: false,
        selectedProblem: null,
        alternativeProblems: []
      }
    };
    // console.log(response);
    console.log('Main generation successful');
    res.status(200).json(response);
  } catch (error) {
    console.error('Main generation failed after retries:', error);
    
    // Log detailed error information for debugging
    if (error.cause && error.cause.issues) {
      console.error('Schema validation errors:', JSON.stringify(error.cause.issues, null, 2));
    }
    
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
        webResults: [],
        leetcodeProblem: {
          isProgrammingTopic: false,
          selectedProblem: null,
          alternativeProblems: []
        }
      };
      
      console.log('Returning basic fallback response');
      res.status(200).json(basicResponse);
    }
  }
}