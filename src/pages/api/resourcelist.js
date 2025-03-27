// pages/api/generate.ts
import { google } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { z } from 'zod';

const topicSchema = z.object({
  topic: z.string().max(100, "Topic must not exceed 100 characters"),
  describe: z.string()
    .min(50, "Description must be at least 50 words"),
  subtopics:z.array(z.object({subtop:z.string(),subexplain:z.string().min(50),subexample:z.string(),exmexplain:z.array(z.string())})).optional(),
    points: z.array(z.string()).min(3, "Minimum 3 examples"),
    code:z.object({topicofcode:z.string(),tcode:z.string()}).optional(),
    define: z.array(z.object({code:z.string(),explain:z.string()})).optional(),
    importance: z.array(z.string())
    .min(3, "Must provide at least 3 points of importance")
    .max(5, "Cannot exceed 5 points of importance"),
    article: z.array(z.object({
      urltopic:z.string(),
      Url:z.string().describe("Give Valid And Most Visit Page For Reference"),
      
    })).min(6)
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { topic } = req.body;

  if (!topic) {
    return res.status(400).json({ error: 'Topic is required' });
  }

  try {
    const promptWithTopic = `
    
    Provide detailed information on the topic: "${topic}" following these structured guidelines:

            1. Topic Header (Max 50 characters)
                
                A clear and concise title summarizing the topic.
                If Question iS One or Two Words Answer Then Give Topic As the Answer Word
            
            2. Description (Min 50 words)
              
              - A well-explained and easy-to-understand description.
              - Easy Description Even Beginner can Understand
              - Provide context and relevance.

            3.  **Subtopic Generation (If Applicable):** If subtopics are deemed appropriate, generate an array of subtopic objects, following this structure:

                  
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

          8. Reference Articles (Min 6)
                - Try to Give More Links If There With Good Understanding Give Top Websited Pages In Url Link
                - Provide Links related  To learn About The Mentioned Topics links With Most User Visited in Recent Times
                - Use Different Websites For Reference Dont USe the Same Website More than Once
                - Focus on reputable sources like academic papers, trusted news sites, and official websites.
                - Avoid providing YouTube links and 404 error pages. Ensure each URL works properly.

            `;
    console.log("Entered APi")
    const result = await generateObject({
      model: google('gemini-2.0-flash-exp'),
      schema: topicSchema,
      prompt: promptWithTopic,
      apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    });
    
    console.log(result.object);
    res.status(200).json(result.object);
  } catch (error) {
    console.error('Generation error:', error);
    res.status(500).json({ error: 'Failed to generate content' });
  }
}