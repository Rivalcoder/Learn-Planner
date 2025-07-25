// pages/api/generate.ts
import { google } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { z } from 'zod';
import axios from 'axios';

const topicSchema = z.object({
  topic: z.string().max(100, "Topic must not exceed 100 characters"),
  describe: z.string(),
  subtopics: z.array(z.object({
    subtop: z.string(),
    subexplain: z.string().min(50),
    subexample: z.string(),
    exmexplain: z.array(z.object({
      lineNumber: z.number().describe("Line number in the code (1, 2, 3, etc.)"),
      code: z.string().describe("The exact code line as it appears in the subexample"),
      explanation: z.string().describe("Detailed explanation covering what the line does, variable declarations, function calls, control flow, input/output operations, error handling, performance considerations, and best practices")
    })),
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
    lineNumber: z.number().describe("Line number in the code (1, 2, 3, etc.)"),
    code: z.string().describe("The exact code line as it appears in the example"),
    explanation: z.string().describe("Detailed explanation covering what the line does, variable declarations, function calls, control flow, input/output operations, error handling, performance considerations, and best practices")
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
    .min(1, "Must provide at least 1 common misconception")
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
    subexample: z.string().optional(),
    exmexplain: z.array(z.object({
      lineNumber: z.number().describe("Line number in the code (1, 2, 3, etc.)"),
      code: z.string().describe("The exact code line as it appears in the subexample"),
      explanation: z.string().describe("Detailed explanation covering what the line does, variable declarations, function calls, control flow, input/output operations, error handling, performance considerations, and best practices")
    })).optional(),
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

// HTML validation and sanitization function
function validateAndFixHtml(html) {
  // Debug logging
  console.log('Validating HTML:', html ? html.substring(0, 200) + '...' : 'null');
  
  if (!html || typeof html !== 'string' || html.trim().length === 0) {
    console.log('HTML is empty or null, using fallback template');
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Interactive Visualization</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #333;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        
        .visualization-container {
            background: rgba(255, 255, 255, 0.95);
            padding: 30px;
            border-radius: 15px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
            text-align: center;
            max-width: 600px;
            width: 100%;
        }
        
        .title {
            color: #4a5568;
            margin-bottom: 20px;
            font-size: 24px;
            font-weight: 600;
        }
        
        .content {
            color: #718096;
            line-height: 1.6;
            margin-bottom: 20px;
        }
        
        .interactive-element {
            background: linear-gradient(45deg, #667eea, #764ba2);
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 16px;
            transition: all 0.3s ease;
            margin: 10px;
        }
        
        .interactive-element:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
        }
        
        .progress-bar {
            width: 100%;
            height: 6px;
            background: #e2e8f0;
            border-radius: 3px;
            overflow: hidden;
            margin: 20px 0;
        }
        
        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #667eea, #764ba2);
            border-radius: 3px;
            animation: progress 2s ease-in-out infinite;
        }
        
        @keyframes progress {
            0% { width: 0%; }
            50% { width: 70%; }
            100% { width: 100%; }
        }
        
        @media (max-width: 768px) {
            .visualization-container {
                padding: 20px;
                margin: 10px;
            }
            
            .title {
                font-size: 20px;
            }
        }
    </style>
</head>
<body>
    <div class="visualization-container">
        <h1 class="title">Interactive Visualization</h1>
        <p class="content">This is an interactive visualization component. Click the button below to see it in action.</p>
        
        <div class="progress-bar">
            <div class="progress-fill"></div>
        </div>
        
        <button class="interactive-element" onclick="toggleAnimation()">
            Start Animation
        </button>
        
        <div id="animation-area" style="margin-top: 20px; padding: 20px; background: rgba(102, 126, 234, 0.1); border-radius: 8px;">
            <p>Animation area will appear here</p>
        </div>
    </div>
    
    <script>
        let animationActive = false;
        
        function toggleAnimation() {
            const area = document.getElementById('animation-area');
            const button = event.target;
            
            if (!animationActive) {
                area.innerHTML = '<div style="width: 50px; height: 50px; background: linear-gradient(45deg, #667eea, #764ba2); border-radius: 50%; margin: 0 auto; animation: bounce 1s infinite;"></div>';
                button.textContent = 'Stop Animation';
                animationActive = true;
            } else {
                area.innerHTML = '<p>Animation stopped</p>';
                button.textContent = 'Start Animation';
                animationActive = false;
            }
        }
        
        // Add CSS animation
        const style = document.createElement('style');
        style.textContent = \`
            @keyframes bounce {
                0%, 20%, 50%, 80%, 100% {
                    transform: translateY(0);
                }
                40% {
                    transform: translateY(-20px);
                }
                60% {
                    transform: translateY(-10px);
                }
            }
        \`;
        document.head.appendChild(style);
        
        // Error handling
        window.addEventListener('error', function(e) {
            console.error('Visualization error:', e.error);
        });
    </script>
</body>
</html>`;
  }

  // More lenient validation - only check for basic HTML structure
  const hasHtmlTag = html.includes('<html') || html.includes('<body') || html.includes('<div');
  const hasContent = html.includes('<body') || html.includes('<div') || html.includes('<h1') || html.includes('<p');
  
  // If HTML has no content at all, return fallback template
  if (!hasContent) {
    console.log('HTML has no content, using fallback template');
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Visualization</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #333;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .container {
            background: rgba(255, 255, 255, 0.95);
            padding: 30px;
            border-radius: 15px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
            text-align: center;
            max-width: 500px;
        }
        h1 {
            color: #4a5568;
            margin-bottom: 20px;
        }
        p {
            color: #718096;
            line-height: 1.6;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Visualization Loading</h1>
        <p>This visualization is being prepared. Please wait...</p>
    </div>
</body>
</html>`;
  }

  // If HTML doesn't have DOCTYPE, add it
  if (!html.includes('<!DOCTYPE html>') && !html.includes('<!doctype html>')) {
    html = '<!DOCTYPE html>\n' + html;
  }

  // If HTML doesn't have viewport meta tag, add it
  if (!html.includes('viewport')) {
    html = html.replace('<head>', '<head>\n    <meta name="viewport" content="width=device-width, initial-scale=1.0">');
    html = html.replace('<html>', '<html>\n<head>\n    <meta name="viewport" content="width=device-width, initial-scale=1.0">\n</head>');
  }

  // If HTML doesn't have charset, add it
  if (!html.includes('charset') && !html.includes('UTF-8')) {
    html = html.replace('<head>', '<head>\n    <meta charset="UTF-8">');
    html = html.replace('<html>', '<html>\n<head>\n    <meta charset="UTF-8">\n</head>');
  }

  // Ensure no black backgrounds that cause display issues
  html = html.replace(/background:\s*black/gi, 'background: #f8f9fa');
  html = html.replace(/background-color:\s*black/gi, 'background-color: #f8f9fa');
  html = html.replace(/background:\s*#000/gi, 'background: #f8f9fa');
  html = html.replace(/background-color:\s*#000/gi, 'background-color: #f8f9fa');

  console.log('HTML validation completed, returning processed HTML');
  return html;
}

// Retry function with exponential backoff and timeout
async function retryWithBackoff(fn, maxRetries = 3, baseDelay = 1000, timeout = 60000) {
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
      setTimeout(() => reject(new Error('YouTube API timeout')), 15000);
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
      setTimeout(() => reject(new Error('Web search timeout')), 15000);
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
    
    ## PROGRAMMING TOPICS INCLUDE (but not limited to):
    - Data Structures: arrays, linked lists, trees, graphs, stacks, queues, hash tables, heaps, tries, segment trees
    - Algorithms: sorting, searching, dynamic programming, recursion, backtracking, greedy, divide and conquer
    - Programming Concepts: OOP, functional programming, design patterns, SOLID principles, clean code
    - System Design: architecture, scalability, databases, caching, load balancing, microservices
    - Frameworks/Libraries: React, Node.js, Django, Spring, Express, Angular, Vue
    - Database: SQL, NoSQL, ACID, CAP theorem, indexing, transactions, normalization
    - Network Protocols: HTTP, TCP/IP, WebSocket, REST, GraphQL, gRPC
    - Security: authentication, authorization, encryption, OAuth, JWT, HTTPS, CORS
    - DevOps: CI/CD, containerization, orchestration, monitoring, logging, deployment
    - Web Technologies: HTML, CSS, JavaScript, TypeScript, Web APIs, DOM manipulation
    - Mobile Development: iOS, Android, React Native, Flutter, mobile UI/UX
    - Cloud Computing: AWS, Azure, GCP, microservices, serverless, containers
    - Programming Languages: Python, Java, C++, JavaScript, Go, Rust, Swift, Kotlin
    - Computer Science: data structures, algorithms, complexity analysis, optimization, theory
    - Machine Learning: algorithms, data preprocessing, model evaluation, neural networks
    - Blockchain: smart contracts, consensus algorithms, cryptography, distributed systems
    
    ## NON-PROGRAMMING TOPICS (examples):
    - History, literature, art, music, sports, cooking, travel, philosophy, biology, chemistry, physics (non-CS), mathematics (non-CS), economics, psychology
    
    ## ADVANCED REQUIREMENTS FOR PROGRAMMING TOPICS:
    If "${topic}" is programming-related, you MUST generate:
    1. One selected problem that best matches the topic (selectedProblem)
    2. EXACTLY 4 alternative problems for additional practice (alternativeProblems array)
    
    ## DIFFICULTY DISTRIBUTION REQUIREMENTS:
    - Provide a progressive learning path with mixed difficulty levels
    - Include 2-3 Easy problems for beginners to build foundational understanding
    - Include 1-2 Medium problems for intermediate practice and concept application
    - Include 1 Hard problem for advanced learners and optimization challenges
    - The selected problem should be Medium difficulty (optimal for focused learning)
    
    ## CRITICAL: PRIORITIZE EASY PROBLEMS FOR BEGINNERS
    RECOMMENDED DISTRIBUTION:
    - Selected Problem: 1 Medium (for focused learning of core concepts)
    - Alternative Problems: 2 Easy + 1 Medium + 1 Hard = 4 total
    - Total: 2 Easy + 2 Medium + 1 Hard = 5 problems
    
    EASY PROBLEMS ARE ESSENTIAL for beginners to understand the topic step by step.
    DO NOT generate mostly Medium/Hard problems - focus on Easy problems for learning.
    
    ## PROBLEM SELECTION CRITERIA:
    - Choose problems that directly relate to the core concepts of "${topic}"
    - Ensure problems cover fundamental principles and practical applications
    - Select problems with clear learning objectives and educational value
    - Include problems that demonstrate real-world applications
    - Choose problems that build upon each other in complexity
    
    ## LEARNING PROGRESSION:
    - Easy problems: Focus on basic concepts, fundamental understanding, and simple implementations
    - Medium problems: Apply concepts in more complex scenarios, handle edge cases, optimize solutions
    - Hard problems: Advanced applications, optimization challenges, complex algorithm implementations
    
    ## REQUIRED FIELDS FOR EACH PROBLEM:
    - title: Problem title
    - difficulty: Easy, Medium, or Hard
    - problemNumber: LeetCode problem number
    - url: LeetCode problem URL
    - description: Brief description of the problem and its requirements
    - tags: Relevant tags for the problem (array of strings)
    - whySelected: Detailed explanation of why this problem was chosen for this topic (for selected problem only)
    
    ## IMPORTANT: You MUST provide both selectedProblem AND alternativeProblems array with 4 problems.
    
    If this is NOT a programming topic, return isProgrammingTopic: false.
    
    Focus on problems that directly relate to the core concepts of "${topic}" and provide a comprehensive learning experience.
    
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
      Create an advanced, comprehensive learning resource for "${topic}" following this detailed structure:

      ## 1. TOPIC & DESCRIPTION
      - Topic: Clear, concise title for the topic
      - Description: Comprehensive explanation (minimum 150 words) covering:
        * Core concepts and fundamental principles
        * Real-world applications and industry relevance
        * Why this topic is important in modern technology/industry
        * Learning path context and prerequisites

      ## 2. SUBTOPIC GENERATION (MANDATORY)
         Generate 2-4 subtopics for topics that can be broken down into distinct concepts.
      Each subtopic must include:
      - subtop: Clear, specific subtopic name
      - subexplain: Comprehensive explanation (minimum 80 words) covering:
        * Detailed concept breakdown and principles
        * Practical applications and real-world use cases
        * Common challenges and their solutions
        * Relationship to main topic and learning progression
         - subtopicVisualizationHtml: Array of 2-3 visualization steps for this subtopic
        * Each step must have: step name, completeHtml (self-contained HTML with CSS/JS), explanation, purpose
        * CRITICAL: Each completeHtml must be a COMPLETE, VALID HTML document with:
          - Proper DOCTYPE declaration
          - Complete HTML structure (html, head, body tags)
          - Embedded CSS in <style> tag with modern styling
          - Embedded JavaScript in <script> tag with error handling
          - No external dependencies or CDN links
          - Responsive design with viewport meta tag
          - Modern UI with gradients, animations, and interactive elements
          - Color-coded visual metaphors and progress indicators
          - Mobile-friendly design with touch interactions
          - Proper error handling and loading states

      ## 3. VISUALIZATION COMPONENTS (MANDATORY)
         Create an array of 3-5 step-by-step visualization components for the main topic.
      Each component must include:
      - step: Clear step name or description
      - completeHtml: COMPLETE, SELF-CONTAINED HTML file with embedded CSS and JS
      - explanation: Detailed explanation of what this visualization demonstrates
      - purpose: Why this step is crucial for understanding the concept

      ## VISUALIZATION REQUIREMENTS (CRITICAL):
      Each completeHtml MUST be a complete HTML document with this exact structure:
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Visualization Step</title>
          <style>
              /* Complete CSS with modern styling, gradients, animations */
              /* Must include responsive design, color schemes, and visual effects */
          </style>
      </head>
      <body>
          <!-- Interactive content with buttons, sliders, animations -->
          <script>
              // Complete JavaScript with error handling, animations, interactivity
              // Must include fallbacks and mobile compatibility
          </script>
      </body>
      </html>

      ## ABSOLUTE REQUIREMENTS FOR VISUALIZATIONS:
      - Every visualization must have at least one visible interactive control (button, slider, or input) that the user can use to change the visualization.
      - The visualization must visibly change or animate in response to user input (e.g., bars move, chart updates, memory usage animates).
      - If a visualization is static, missing, or does not respond to user input, OUTPUT AN ERROR MESSAGE or RETRY until a dynamic, interactive visualization is produced.
      - For sorting visualizations, always provide a "Start" or "Step" button that animates the sorting process step by step.
      - For time/space complexity, always provide a slider or input for 'n' and update the chart or memory display live as the user changes 'n'.
      - Do NOT generate static images, static bars, or single-color boxes.
      - If you cannot generate a dynamic, interactive visualization, output: "ERROR: Visualization is not dynamic or interactive."

      ## EXAMPLES:
      - For Bubble Sort: Provide a "Run Code" button. When clicked, animate the sorting process step by step, updating the bars and highlighting swaps. Show the actual array being sorted with real-time updates.
      - For time complexity: Add a "Show Working" button that demonstrates the algorithm with different input sizes and shows the actual time complexity in action.
      - For space complexity: Show a "Run Code" button that demonstrates memory allocation and deallocation with visual feedback.
      - For data structures: Include a "Show Working" button that demonstrates insertion, deletion, and traversal with real data.
      - For algorithms: Provide a "Run Code" button that shows the algorithm working with step-by-step execution and visual feedback.
      - For concepts: Include interactive buttons that demonstrate the concept in action with user input and real-time updates.

      ## VISUALIZATION GUIDELINES:
      - Use modern, attractive styling with CSS gradients and smooth animations
      - Make it fully responsive and mobile-friendly
      - Focus on visual understanding with color coding and visual metaphors
      - Include step navigation, progress indicators, and smooth transitions
      - Use modern color schemes (avoid black or very dark backgrounds that cause display issues)
      - Implement proper error handling and loading states
      - Ensure all animations are smooth and performant
      - Add hover effects and micro-interactions
      - Use semantic HTML with proper accessibility
      - **Visualizations must be topic-specific, engaging, and educational, with clear labels, legends, and user guidance. No placeholders.**
      - **If the visualization is not dynamic or interactive, output an error message or retry.**

      ## 4. SEARCH OPTIMIZATION
         - webSearchTagline: Optimized search term for finding comprehensive articles and documentation
         - youtubeSearchTagline: Optimized search term for finding video tutorials and explanations
      
      ## 5. LETCODE PROBLEM SELECTION (OPTIONAL)
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
      
      ## CRITICAL REQUIREMENTS:
      - All visualizations must be complete, self-contained HTML documents
      - No external dependencies or CDN links
      - Must work offline and in sandboxed environments
      - Include proper error handling and fallbacks
      - Use modern CSS with gradients, animations, and responsive design
      - Avoid black backgrounds and ensure proper contrast
      - Include loading states and smooth transitions
      - Make all interactive elements accessible
      - Ensure mobile compatibility and touch-friendly interfaces

      Ensure the response is comprehensive, well-structured, and provides valuable learning content.
      Focus on practical understanding and visual learning rather than theoretical explanations.
      Make visualizations engaging and interactive to enhance the learning experience.
      Prioritize visual clarity and user experience over complex animations.
      Ensure all HTML is valid and self-contained.
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

    // Process and validate HTML in the fallback response
    const processedFallbackResponse = {
      ...result.object,
      youtubeResults,
      webResults,
      leetcodeProblem: leetcodeProblems
    };

    // Validate and fix all HTML in visualizations
    if (processedFallbackResponse.visualizationHtml && Array.isArray(processedFallbackResponse.visualizationHtml)) {
      processedFallbackResponse.visualizationHtml = processedFallbackResponse.visualizationHtml.map((vis, index) => {
        console.log(`Processing fallback visualization ${index + 1}:`, vis.step);
        const validatedHtml = validateAndFixHtml(vis.completeHtml);
        
        // Check if HTML contains interactive elements
        const hasInteractiveElements = validatedHtml.includes('onclick') || 
                                    validatedHtml.includes('addEventListener') || 
                                    validatedHtml.includes('function') ||
                                    validatedHtml.includes('button') ||
                                    validatedHtml.includes('input');
        
        console.log(`Fallback visualization ${index + 1} has interactive elements:`, hasInteractiveElements);
        
        return {
          ...vis,
          completeHtml: validatedHtml
        };
      });
    }

    // Validate and fix HTML in subtopics
    if (processedFallbackResponse.subtopics && Array.isArray(processedFallbackResponse.subtopics)) {
      processedFallbackResponse.subtopics = processedFallbackResponse.subtopics.map((subtopic, subIndex) => {
        if (subtopic.subtopicVisualizationHtml && Array.isArray(subtopic.subtopicVisualizationHtml)) {
          return {
            ...subtopic,
            subtopicVisualizationHtml: subtopic.subtopicVisualizationHtml.map((vis, visIndex) => {
              console.log(`Processing fallback subtopic ${subIndex + 1} visualization ${visIndex + 1}:`, vis.step);
              const validatedHtml = validateAndFixHtml(vis.completeHtml);
              
              // Check if HTML contains interactive elements
              const hasInteractiveElements = validatedHtml.includes('onclick') || 
                                          validatedHtml.includes('addEventListener') || 
                                          validatedHtml.includes('function') ||
                                          validatedHtml.includes('button') ||
                                          validatedHtml.includes('input');
              
              console.log(`Fallback subtopic ${subIndex + 1} visualization ${visIndex + 1} has interactive elements:`, hasInteractiveElements);
              
              return {
                ...vis,
                completeHtml: validatedHtml
              };
            })
          };
        }
        return subtopic;
      });
    }

    return processedFallbackResponse;
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
    Create a comprehensive, advanced learning resource for the topic: "${topic}" following this detailed structure:

    ## 1. TOPIC & DESCRIPTION
    - Topic: Clear, concise title (max 50 characters)
    - Description: Detailed explanation (min 100 words) covering:
       * Give a Good Explanation of the Topic User Can Understand Even Beginner
       * Give Correct Explanation for That Topic
       * 
    ## 2. SUBTOPIC GENERATION (MANDATORY)
    **CRITICAL: You MUST generate subtopics for every topic. This is a required field that cannot be empty.**
    Generate 2-4 subtopics for complex topics, 1-2 for simpler topics. Each subtopic must include:
    - subtop: Clear, specific subtopic name
    - subexplain: Comprehensive explanation (min 80 words) covering:
      * Detailed concept breakdown
      * Practical applications and use cases
      * Common challenges and solutions
      * Relationship to main topic
    - subexample: Working code example for programming topics, detailed example for others
    - exmexplain: **IMPORTANT: Provide a detailed line-by-line explanation for every line of code in subexample. Output this as an array of objects with the following structure:
      * Each object should have: { lineNumber: number, code: string, explanation: string }
      * lineNumber: The line number in the code (1, 2, 3, etc.)
      * code: The exact code line as it appears in the subexample
      * explanation: Detailed explanation covering:
        - What the line does and why it's needed for this subtopic
        - Variable declarations and their purpose in the context
        - Function calls and their parameters
        - Control flow (if/else, loops, etc.)
        - Input/output operations
        - Error handling and edge cases
        - Performance considerations
        - Best practices and conventions
      * Explanations should be beginner-friendly and educational
      * Cover every single line of code, including comments and whitespace
      * Provide context for how each line relates to the subtopic concept
      * Include examples of what the code does with sample inputs
      * Explain any complex logic, algorithms, or data structures used in this subtopic**
    - subtopicVisualizationHtml: 1-2 visualization steps specific to this subtopic
      * Each step must have: step name, completeHtml (self-contained HTML with CSS/JS), explanation, purpose
      * CRITICAL: Each completeHtml must be a COMPLETE, VALID HTML document with:
        - Proper DOCTYPE declaration
        - Complete HTML structure (html, head, body tags)
        - Embedded CSS in <style> tag
        - Embedded JavaScript in <script> tag
        - No external dependencies
        - Responsive design with viewport meta tag
        - Error handling and fallbacks
        - Modern UI with gradients, animations, and interactive elements
        - Color-coded visual metaphors
        - Progress indicators and navigation
        - Mobile-friendly design
        - **STRICTLY PROHIBIT black or very dark backgrounds. Use only light, high-contrast, accessible backgrounds that work in both light and dark UI themes. Use modern, accessible color palettes. Avoid backgrounds that could cause the visualization to disappear or blend in.**
        - **Visualizations must be topic-specific, engaging, and educational, with clear labels, legends, and user guidance. No placeholders.**
        - **MANDATORY: Include interactive buttons that demonstrate the working of the topic**
          * Every visualization MUST include at least one "Run Code" or "Show Working" button Only Click It Should Show The Working Animations Completely So Generate The Code For Visualization Very Long To Show The Full Working Process So Give Accordingly
             ### Visualization  SHould Be Complete Working On RUn It Must Completely Show The Working So Give Accodingly Visula View
             ### Dont Use Black Color In The Visualization  It Is Mandotory
             ### Show The Step By Step animation for working For example If Sorting Shows The Swaping by comparing like That It Shows Completely It Is Mandotory
             ### This Above Is Condition For Visulizations is Applied All Visualization The Generation Completely
            
          * The button should trigger the actual execution/demonstration of the concept
          * For programming topics: Show code execution with step-by-step output
          * For algorithms: Show the algorithm working with real data and visual feedback
          * For concepts: Show interactive demonstrations with user input and real-time updates
          * The button should provide immediate, visible feedback showing how the topic actually works
          * If a topic cannot be demonstrated interactively, provide a detailed explanation of why and offer alternative learning methods

    ## 3. VISUALIZATION COMPONENTS (MANDATORY)
    Create 1-3 step-by-step visualization components for the main topic. Each must include:
    - step: Clear step name or description
    - completeHtml: COMPLETE, SELF-CONTAINED HTML file with embedded CSS and JS
    - explanation: Detailed explanation of what this visualization demonstrates
    - purpose: Why this step is crucial for understanding the concept

    ## VISUALIZATION REQUIREMENTS (CRITICAL):
    Each completeHtml MUST be a complete HTML document with this exact structure:
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Visualization Step</title>
        <style>
            /* Complete CSS with modern styling, gradients, animations */
            /* Must include responsive design, color schemes, and visual effects */
            /* STRICTLY PROHIBIT black or very dark backgrounds. Use only light, high-contrast, accessible backgrounds. */
        </style>
    </head>
    <body>
        <!-- Interactive content with buttons, sliders, animations -->
        <!-- MANDATORY: Include at least one "Run Code" or "Show Working" button -->
        <button id="runButton" onclick="runCode()">Run Code</button>
        <div id="output"></div>
        <script>
            // Complete JavaScript with error handling, animations, interactivity
            // Must include fallbacks and mobile compatibility
            // MANDATORY: Include function to demonstrate topic working
            function runCode() {
                // Demonstrate the actual working of the topic
                // Show step-by-step execution, real data processing, or concept demonstration
                // Provide immediate visual feedback
                // Include error handling and user guidance
            }
            // EXAMPLE OF REQUIRED INTERACTIVITY:
            // - Event listeners (onclick, addEventListener)
            // - DOM manipulation (innerHTML, style changes, classList)
            // - State management (variables, counters, flags)
            // - Real-time updates (setInterval, setTimeout)
            // - User input handling (input events, form submissions)
            // - Animation controls (start/stop, pause/resume)
            // - Code execution and demonstration functions
        </script>
    </body>
    </html>

    ## ABSOLUTE REQUIREMENTS FOR VISUALIZATIONS:
    - Every visualization must have at least one visible interactive control (button, slider, or input) that the user can use to change the visualization.
    - **MANDATORY: Every visualization MUST include a "Run Code" or "Show Working" button that demonstrates the actual working of the topic.**
    - The visualization must visibly change or animate in response to user input (e.g., bars move, chart updates, memory usage animates).
    - The "Run Code" button should trigger the actual execution/demonstration of the concept being taught.
    - For programming topics: Show code execution with step-by-step output and real data processing.
    - For algorithms: Show the algorithm working with real data and visual feedback (e.g., sorting steps, search progress).
    - For concepts: Show interactive demonstrations with user input and real-time updates.
    - If a visualization is static, missing, or does not respond to user input, OUTPUT AN ERROR MESSAGE or RETRY until a dynamic, interactive visualization is produced.
    - For sorting visualizations, always provide a "Start" or "Step" button that animates the sorting process step by step.
    - For time/space complexity, always provide a slider or input for 'n' and update the chart or memory display live as the user changes 'n'.
    - Do NOT generate static images, static bars, or single-color boxes.
    - If you cannot generate a dynamic, interactive visualization, output: "ERROR: Visualization is not dynamic or interactive."
    - **If a topic cannot be demonstrated interactively, provide a detailed explanation of why and offer alternative learning methods.**

    ## EXAMPLES:
    - For Bubble Sort: Provide a "Run Code" button. When clicked, animate the sorting process step by step, updating the bars and highlighting swaps. Show the actual array being sorted with real-time updates.
    - For time complexity: Add a "Show Working" button that demonstrates the algorithm with different input sizes and shows the actual time complexity in action.
    - For space complexity: Show a "Run Code" button that demonstrates memory allocation and deallocation with visual feedback.
    - For data structures: Include a "Show Working" button that demonstrates insertion, deletion, and traversal with real data.
    - For algorithms: Provide a "Run Code" button that shows the algorithm working with step-by-step execution and visual feedback.
    - For concepts: Include interactive buttons that demonstrate the concept in action with user input and real-time updates.

    ## VISUALIZATION GUIDELINES:
    - **CRITICAL: Every visualization MUST have REAL, WORKING JavaScript functionality**
    - **MANDATORY: Include at least one interactive element that actually works:**
      * Clickable buttons that trigger animations or state changes
      * Sliders that update values in real-time
      * Drag-and-drop elements that respond to user input
      * Animated elements that start/stop on user interaction
      * Form inputs that update the visualization dynamically
    - **The visualization must DEMONSTRATE THE CONCEPT IN ACTION** - not just show static diagrams
    - **Provide clear user instructions** (e.g., "Click 'Start' to see the algorithm step by step")
    - **All interactions must provide immediate, visible feedback** (animations, color changes, text updates, progress bars)
    - **DO NOT create static visualizations** - every element must be interactive and responsive
    - **Include working event listeners** (onclick, addEventListener, input events)
    - **Use real JavaScript functions** that manipulate the DOM and update the visualization
    - **Add state management** (variables that track current state, step counters, etc.)
    - **Include smooth animations** that respond to user input (CSS transitions, JavaScript animations)
    - **Make it educational** - each interaction should teach something about the concept
    - Use modern, attractive styling with CSS gradients and smooth animations
    - Make it fully responsive and mobile-friendly
    - Focus on visual understanding with color coding and visual metaphors
    - Include step navigation, progress indicators, and smooth transitions
    - Use modern color schemes (avoid black or very dark backgrounds that cause display issues)
    - Implement proper error handling and loading states
    - Ensure all animations are smooth and performant
    - Add hover effects and micro-interactions
    - Use semantic HTML with proper accessibility
    - **Visualizations must be topic-specific, engaging, and educational, with clear labels, legends, and user guidance. No placeholders.**

    ## 4. TECHNICAL CONTENT
    - Points: 3-5 key technical points or characteristics (min 50 characters each)
    - Code: For programming topics, provide a complete, working implementation
      * Use the most appropriate programming language for the topic
      * Include proper syntax highlighting comments
      * Add comprehensive error handling
      * Include input validation and edge cases
    - **CODE EXPLANATION IS HIGHLY RECOMMENDED**: Provide detailed line-by-line explanations for ALL code examples and If Long code Give 2-4 lines In One and Give Explanation Dont Generate For Line by Line By Giving Large so If Large Give With Bunch of Code And With Its Explanation and Code and Explanation must Come From Above Code Generated 
      * Include line numbers, exact code, and detailed explanations
      * Cover variable declarations, function calls, control flow, and logic
      * Provide context for how each line contributes to the overall solution
      * Make explanations beginner-friendly and educational
      * Include examples of what the code does with sample inputs
    - Code Explanation: **IMPORTANT: Provide a detailed line-by-line explanation for every line of code in the code example. Output this as an array of objects with the following structure:
      * Each object should have: { lineNumber: number, code: string, explanation: string }
      * lineNumber: The line number in the code (1, 2, 3, etc.)
      * code: The exact code line as it appears in the example
      * explanation: Detailed explanation covering:
        - What the line does and why it's needed
        - Variable declarations and their purpose
        - Function calls and their parameters
        - Control flow (if/else, loops, etc.)
        - Input/output operations
        - Error handling and edge cases
        - Performance considerations
        - Best practices and conventions
      * Explanations should be beginner-friendly and educational
      * Cover every single line of code, including comments and whitespace
      * Provide context for how each line relates to the overall algorithm/concept
      * Include examples of what the code does with sample inputs
      * Explain any complex logic, algorithms, or data structures used**

    ## 5. LEARNING FRAMEWORK
    - Importance: 3-5 points about why this topic matters in industry
    - Prerequisites: 1-5 fundamental concepts needed before learning this topic
    - Learning Objectives: 2-5 clear, measurable outcomes
    - Common Misconceptions: **MANDATORY - Generate EXACTLY 2-4 frequent misunderstandings with detailed explanations and corrections. This field is required and must contain at least 2 misconceptions.**
    - Practice Exercises: 2-4 problems of varying difficulty (beginner, intermediate, advanced) with complete solutions

    ## 6. SEARCH OPTIMIZATION
        - webSearchTagline: Optimized for finding comprehensive articles and documentation
        - youtubeSearchTagline: Optimized for finding video tutorials and explanations
    
    ## CRITICAL REQUIREMENTS:
    - All visualizations must be complete, self-contained HTML documents
    - No external dependencies or CDN links
    - Must work offline and in sandboxed environments
    - Include proper error handling and fallbacks
    - Use modern CSS with gradients, animations, and responsive design
    - STRICTLY PROHIBIT black or very dark backgrounds. Use only light, high-contrast, accessible backgrounds.
    - Include loading states and smooth transitions
    - Make all interactive elements accessible
    - Ensure mobile compatibility and touch-friendly interfaces
    - **CODE EXPLANATIONS ARE HIGHLY RECOMMENDED**: Every code example should include detailed line-by-line explanations
        - **COMMON MISCONCEPTIONS ARE MANDATORY**: You MUST generate at least 2 common misconceptions for every topic. This is a required field that cannot be empty.
    - **SUBTOPICS ARE MANDATORY**: You MUST generate at least 1-2 subtopics for every topic. This is a required field that cannot be empty.
      * Example structure for common misconceptions:
        [
          {
            "misconception": "Arrays and linked lists are the same thing",
            "explanation": "Many beginners think arrays and linked lists are interchangeable, but they have different memory layouts and performance characteristics.",
            "correction": "Arrays store elements in contiguous memory with O(1) access, while linked lists use pointers with O(n) access but dynamic sizing."
          },
          {
            "misconception": "Big O notation only applies to time complexity",
            "explanation": "Students often focus only on time complexity and ignore space complexity considerations.",
            "correction": "Big O notation applies to both time and space complexity, and both are important for algorithm analysis."
          }
        ]
    * Example structure for code explanations:
        [
          {
            "lineNumber": 1,
            "code": "function bubbleSort(arr) {",
            "explanation": "Define a function named bubbleSort that takes an array parameter. This is the entry point of our sorting algorithm."
          },
          {
            "lineNumber": 2,
            "code": "  const n = arr.length;",
            "explanation": "Store the length of the array in variable 'n'. This is used to control the number of iterations in our sorting loops."
          },
          {
            "lineNumber": 3,
            "code": "  for (let i = 0; i < n - 1; i++) {",
            "explanation": "Outer loop that runs n-1 times. Each iteration places the largest unsorted element in its correct position."
          }
        ]

    ## JAVASCRIPT INTERACTIVITY EXAMPLES:
    - Buttons that change colors, text, or trigger animations when clicked
    - Sliders that update values and refresh the visualization in real-time
    - Step-by-step animations that progress with user clicks
    - Form inputs that validate and update the display
    - Drag-and-drop elements that respond to mouse/touch events
    - Progress bars that fill up based on user interaction
    - State toggles (play/pause, start/stop, show/hide)
    - Real-time calculations and updates based on user input

    Focus on creating engaging, interactive visualizations that enhance learning.
    Prioritize visual clarity and user experience over complex animations.
    Ensure all HTML is valid and self-contained.
    **EVERY VISUALIZATION MUST BE DYNAMIC AND RESPONSIVE TO USER INPUT.**
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

    // Process and validate HTML in the response
    const processedResponse = {
      ...result.object,
      youtubeResults: youtubeResults.status === 'fulfilled' ? youtubeResults.value : [],
      webResults: webResults.status === 'fulfilled' ? webResults.value : [],
      leetcodeProblem: leetcodeProblems.status === 'fulfilled' ? leetcodeProblems.value : {
        isProgrammingTopic: false,
        selectedProblem: null,
        alternativeProblems: []
      }
    };

    // Ensure we have at least 2 common misconceptions
    if (!processedResponse.commonMisconceptions || processedResponse.commonMisconceptions.length < 2) {
      console.warn('Not enough common misconceptions generated, adding fallback misconceptions');
      const fallbackMisconceptions = [
        {
          misconception: `Beginners often think ${topic} is too complex to learn`,
          explanation: `Many students get overwhelmed by the complexity and think they need to understand everything at once.`,
          correction: `${topic} can be learned step by step. Start with the basics and gradually build up your understanding.`
        },
        {
          misconception: `${topic} is only useful for advanced programmers`,
          explanation: `Students often believe this topic is only relevant for experienced developers or specific use cases.`,
          correction: `${topic} has practical applications at all skill levels and is fundamental to understanding broader programming concepts.`
        }
      ];
      
      if (!processedResponse.commonMisconceptions) {
        processedResponse.commonMisconceptions = fallbackMisconceptions;
      } else {
        processedResponse.commonMisconceptions = [
          ...processedResponse.commonMisconceptions,
          ...fallbackMisconceptions.slice(0, 2 - processedResponse.commonMisconceptions.length)
        ];
      }
    }

    // Ensure we have at least 1-2 subtopics
    if (!processedResponse.subtopics || processedResponse.subtopics.length === 0) {
      console.warn('No subtopics generated, adding fallback subtopics');
      const fallbackSubtopics = [
        {
          subtop: `Basic ${topic} Concepts`,
          subexplain: `This subtopic covers the fundamental concepts and principles of ${topic}. Understanding these basics is essential before moving to more advanced topics. We'll explore the core ideas, terminology, and foundational knowledge that every learner needs to master.`,
          subexample: `// Basic example for ${topic}\nconsole.log("Hello ${topic}");\n// This demonstrates the basic syntax`,
          exmexplain: [
            {
              lineNumber: 1,
              code: `// Basic example for ${topic}`,
              explanation: `This comment explains what this code example demonstrates for the ${topic} concept.`
            },
            {
              lineNumber: 2,
              code: `console.log("Hello ${topic}");`,
              explanation: `This line demonstrates basic output functionality and shows how to display information related to ${topic}.`
            },
            {
              lineNumber: 3,
              code: `// This demonstrates the basic syntax`,
              explanation: `This comment provides context about what the previous line of code shows about the ${topic} syntax.`
            }
          ],
          subtopicVisualizationHtml: [
            {
              step: `Introduction to ${topic}`,
              completeHtml: `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${topic} Introduction</title><style>body{font-family:sans-serif;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:#333;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px}.container{background:rgba(255,255,255,0.95);padding:30px;border-radius:15px;box-shadow:0 10px 30px rgba(0,0,0,0.2);text-align:center;max-width:500px}h1{color:#4a5568;margin-bottom:20px}p{color:#718096;line-height:1.6}.btn{background:linear-gradient(45deg,#667eea,#764ba2);color:white;border:none;padding:12px 24px;border-radius:8px;cursor:pointer;font-size:16px;transition:all 0.3s ease;margin:10px}.btn:hover{transform:translateY(-2px);box-shadow:0 5px 15px rgba(0,0,0,0.2)}</style></head><body><div class="container"><h1>Welcome to ${topic}</h1><p>This visualization introduces the basic concepts of ${topic}. Click the button below to see an interactive demonstration.</p><button class="btn" onclick="showDemo()">Start Demo</button><div id="demo" style="margin-top:20px;padding:20px;background:rgba(102,126,234,0.1);border-radius:8px;display:none"><p>Interactive ${topic} demonstration will appear here!</p></div></div><script>function showDemo(){document.getElementById('demo').style.display='block';document.querySelector('.btn').textContent='Demo Active';}</script></body></html>`,
              explanation: `This visualization introduces the basic concepts of ${topic} in an interactive way.`,
              purpose: `To provide a gentle introduction to ${topic} concepts and engage learners with interactive elements.`
            }
          ]
        },
        {
          subtop: `Advanced ${topic} Applications`,
          subexplain: `This subtopic explores more advanced applications and real-world uses of ${topic}. We'll dive deeper into complex scenarios, optimization techniques, and practical implementations that demonstrate the full power and versatility of ${topic} in modern development.`,
          subexample: `// Advanced ${topic} example\nfunction advanced${topic}() {\n  // Complex implementation\n  return "Advanced ${topic} functionality";\n}`,
          exmexplain: [
            {
              lineNumber: 1,
              code: `// Advanced ${topic} example`,
              explanation: `This comment indicates that this code demonstrates advanced concepts of ${topic}.`
            },
            {
              lineNumber: 2,
              code: `function advanced${topic}() {`,
              explanation: `This defines a function that demonstrates advanced ${topic} functionality and techniques.`
            },
            {
              lineNumber: 3,
              code: `  // Complex implementation`,
              explanation: `This comment indicates where complex ${topic} logic would be implemented.`
            },
            {
              lineNumber: 4,
              code: `  return "Advanced ${topic} functionality";`,
              explanation: `This line returns a result that demonstrates the advanced ${topic} capabilities.`
            },
            {
              lineNumber: 5,
              code: `}`,
              explanation: `This closes the function definition for the advanced ${topic} example.`
            }
          ],
          subtopicVisualizationHtml: [
            {
              step: `Advanced ${topic} Visualization`,
              completeHtml: `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Advanced ${topic}</title><style>body{font-family:sans-serif;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:#333;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px}.container{background:rgba(255,255,255,0.95);padding:30px;border-radius:15px;box-shadow:0 10px 30px rgba(0,0,0,0.2);text-align:center;max-width:500px}h1{color:#4a5568;margin-bottom:20px}p{color:#718096;line-height:1.6}.btn{background:linear-gradient(45deg,#667eea,#764ba2);color:white;border:none;padding:12px 24px;border-radius:8px;cursor:pointer;font-size:16px;transition:all 0.3s ease;margin:10px}.btn:hover{transform:translateY(-2px);box-shadow:0 5px 15px rgba(0,0,0,0.2)}</style></head><body><div class="container"><h1>Advanced ${topic}</h1><p>This visualization demonstrates advanced ${topic} concepts and applications.</p><button class="btn" onclick="showAdvanced()">Show Advanced Demo</button><div id="advanced" style="margin-top:20px;padding:20px;background:rgba(102,126,234,0.1);border-radius:8px;display:none"><p>Advanced ${topic} demonstration with complex interactions!</p></div></div><script>function showAdvanced(){document.getElementById('advanced').style.display='block';document.querySelector('.btn').textContent='Advanced Demo Active';}</script></body></html>`,
              explanation: `This visualization demonstrates advanced ${topic} concepts with interactive elements.`,
              purpose: `To showcase complex ${topic} applications and provide hands-on learning experience.`
            }
          ]
        }
      ];
      processedResponse.subtopics = fallbackSubtopics;
    }

    // Validate and fix all HTML in visualizations
    if (processedResponse.visualizationHtml && Array.isArray(processedResponse.visualizationHtml)) {
      processedResponse.visualizationHtml = processedResponse.visualizationHtml.map((vis, index) => {
        console.log(`Processing visualization ${index + 1}:`, vis.step);
        const validatedHtml = validateAndFixHtml(vis.completeHtml);
        
        // Check if HTML contains interactive elements
        const hasInteractiveElements = validatedHtml.includes('onclick') || 
                                    validatedHtml.includes('addEventListener') || 
                                    validatedHtml.includes('function') ||
                                    validatedHtml.includes('button') ||
                                    validatedHtml.includes('input');
        
        console.log(`Visualization ${index + 1} has interactive elements:`, hasInteractiveElements);
        
        return {
          ...vis,
          completeHtml: validatedHtml
        };
      });
    }

    // Validate and fix HTML in subtopics
    if (processedResponse.subtopics && Array.isArray(processedResponse.subtopics)) {
      processedResponse.subtopics = processedResponse.subtopics.map((subtopic, subIndex) => {
        if (subtopic.subtopicVisualizationHtml && Array.isArray(subtopic.subtopicVisualizationHtml)) {
          return {
            ...subtopic,
            subtopicVisualizationHtml: subtopic.subtopicVisualizationHtml.map((vis, visIndex) => {
              console.log(`Processing subtopic ${subIndex + 1} visualization ${visIndex + 1}:`, vis.step);
              const validatedHtml = validateAndFixHtml(vis.completeHtml);
              
              // Check if HTML contains interactive elements
              const hasInteractiveElements = validatedHtml.includes('onclick') || 
                                          validatedHtml.includes('addEventListener') || 
                                          validatedHtml.includes('function') ||
                                          validatedHtml.includes('button') ||
                                          validatedHtml.includes('input');
              
              console.log(`Subtopic ${subIndex + 1} visualization ${visIndex + 1} has interactive elements:`, hasInteractiveElements);
              
              return {
                ...vis,
                completeHtml: validatedHtml
              };
            })
          };
        }
        return subtopic;
      });
    }
    console.log(processedResponse);
    console.log('Main generation successful with HTML validation');
    res.status(200).json(processedResponse);
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