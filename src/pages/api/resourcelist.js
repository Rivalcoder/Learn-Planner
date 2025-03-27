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
                        "subexample": "A practical example demonstrating Subtopic Name 1.",
                        "exmexplain": [
                          "Step-by-step explanation of the subexample of the topic."
                        ]
                      },
                      {
                        "subtop": "Subtopic Name 2",
                        "subexplain": "A detailed explanation (min 50 words) of Subtopic Name 2. Explain its purpose, relevance, and how it relates to the main topic.",
                        "subexample": "A practical example demonstrating Subtopic Name 2.",
                        "exmexplain": [
                          "Step-by-step explanation of the subexample of the topic."
                        ]
                      },
                      // ... more subtopics (as needed, but aim for 3 and Above)
                    ]
                  

                    *   **subtop (String):** A concise and descriptive name for the subtopic.
                    *   *subexplain (String):** A thorough and easy-to-understand explanation of the subtopic (minimum 50 words).
                    *   **subexample (String):** A practical example demonstrating the subtopic in action if its code give as Complete code itself.
                    *   **exmexplain (Array of Strings):** A list of strings, each providing a detailed explanation of the subexample above, step-by-step. Explain *why* each step is performed Explain every line of Sub Example.


            4. Points (Min 3 with Each min of 50 characters) 

              - For example if its Code then Give Time and Space Complexity like that others give Other related to it
             - Important Points to About the Person Or Any Topic
            
            5. Code (If applicable)
              - Although Code is Provided in subtopic Generation Provide here Also A Basic Implement Program With The Topic
              - If Its A Code Related Topic Provide Of Code Is Compulsory in This Area
              - Include only if the topic is programming-related.
              - Provide a complete and functional code example.
              - The code should be formatted properly.
              - Basic Level Implementation program min 5 lines.

                   
            6. Code Explanation (If code is present then its compulsory)
            
              - Step-by-step breakdown of the logic.
              - Explain each important line of code and its function.
              - Clearly describe how the code works.
               -** Example :  define: [
                              {
                                code: '#include <iostream>\n// ... (rest of the code)',
                                explain: 'Includes the iostream library for input/output operations.'
                              },
                              {
                                code: 'struct Node { ... };',
                                explain: 'Defines the structure of a node in the linked list, containing data and a pointer to the next node.'
                              },
                              {
                                code: 'std::shared_ptr<Node> next;',
                                explain: 'Uses a smart pointer (shared_ptr) to manage the next node, automatically handling memory allocation and deallocation.'
                              },
                              {
                                code: 'void insert(std::shared_ptr<Node>& head, int val) { ... }',
                                explain: 'Defines the insert function to add a new node at the beginning of the list.'
                              },
                              {
                                code: 'newNode->next = head;',
                                explain: 'Links the new node to the current head of the list.'
                              },
                              {
                                code: 'head = newNode;',
                                explain: 'Updates the head of the list to point to the new node.'
                              },
                              {
                                code: 'void display(std::shared_ptr<Node> head) { ... }',
                                explain: 'Defines the display function to print the elements of the list.'
                              },
                              {
                                code: 'while (head) { ... }',
                                explain: 'Iterates through the list until the end (nullptr) is reached.'
                              },
                              {
                                code: 'std::cout << head->data << " -> ";',
                                explain: 'Prints the data of the current node and an arrow.'
                              },
                              {
                                code: 'head = head->next;',
                                explain: 'Moves to the next node in the list.'
                              }
                            ]
                                

            7. Importance (3-5 points)
              -Importance or Advantages About the Topic
              - Highlight key reasons why this topic matters.
              - Discuss modern applications and real-world impact.

            8. Prerequisites (1-5 points)
              - List the fundamental concepts or topics that should be understood before learning this topic
              - Include any required background knowledge or skills
              - Specify any tools, software, or resources needed

            9. Learning Objectives (2-5 points)
              - Define clear, measurable outcomes that learners should achieve
              - Include both theoretical understanding and practical skills
              - Focus on what learners will be able to do after mastering the topic

            10. Common Misconceptions (2-4 points)
                - Identify frequent misunderstandings about the topic
                - Provide detailed explanations of why these misconceptions occur
                - Offer clear corrections and proper understanding
                - Include real-world examples to illustrate the correct concepts

            11. Practice Exercises (2-4 problems)
                - Create exercises of varying difficulty levels (beginner, intermediate, advanced)
                - Include detailed solutions and explanations
                - Focus on practical application of the concepts
                - Provide step-by-step guidance for solving each problem

          12. Search Taglines
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