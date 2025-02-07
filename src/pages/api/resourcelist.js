// pages/api/generate.ts
import { google } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { z } from 'zod';

const topicSchema = z.object({
  topic: z.string().max(50, "Topic must not exceed 50 characters"),
  describe: z.string()
    .min(50, "Description must be at least 50 words"),
    examples: z.array(z.string()).min(3, "Minimum 3 examples"),
    code:z.object({topicofcode:z.string(),tcode:z.string()}).optional(),
    define: z.array(z.object({code:z.string(),explain:z.string()})).optional(),
    importance: z.array(z.string())
    .min(3, "Must provide at least 3 points of importance")
    .max(5, "Cannot exceed 5 points of importance"),
    article: z.array(z.object({
      urltopic:z.string(),
      Url:z.string(),
      
    })).min(3)
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
2. Description (Min 50 words)
A well-explained and easy-to-understand description.
Provide context and relevance.
3. Examples (Min 3)
At least three practical and real-world examples illustrating the concept.
4. Code (If applicable)
Include only if the topic is programming-related.
Provide a complete and functional code example.
The code should be formatted properly.
5. Code Explanation (If code is present)
Step-by-step breakdown of the logic.
Explain each important line of code and its function.
Clearly describe how the code works.
6. Importance (3-5 points)
Highlight key reasons why this topic matters.
Discuss modern applications and real-world impact.
7. Reference Articles (Min 3)
Provide three valid URLs for learning more about the topic.
Each URL should have a brief header summarizing its content.

`;

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