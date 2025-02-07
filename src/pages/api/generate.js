import { google } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { z } from 'zod';

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
      prompt: `Generate a structured learning plan for "${title}" with difficulty levels: ${difficulty.join(", ")}.If Easy is level then Provide Topics With High Important and if Its Medium Provided Some More Topics All Next Priority if Hard is Chosed then Provided all Topics in that with all Sub Topics in that also Dont Miss Any Topics or Sub Topics In That . Provide All Level With Introduction`,
      apiKey: apiKey,
    });

    res.status(200).json(result.object);
  } catch (error) {
    console.error('Error generating topics:', error);
    res.status(500).json({ error: 'Failed to generate topics' });
  }
}
