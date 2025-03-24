import { Request, Response } from 'express';
import OpenAI from 'openai';

interface MovieGenerationRequest {
  character: string;
  pinyin: string;
  actor: string;
  set: string;
  tone: string;
  toneLocation: string;
  radicalProps: { radical: string; prop: string }[];
}

export class MovieController {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  public generateMovie = async (req: Request, res: Response): Promise<void> => {
    try {
      const movieRequest: MovieGenerationRequest =
        req.body as MovieGenerationRequest;
      const {
        character,
        pinyin,
        actor,
        set,
        tone,
        toneLocation,
        radicalProps,
      } = movieRequest;

      // Create a prompt for GPT to generate a movie scene
      const prompt = `Create a vivid, memorable, and slightly humorous movie scene for the Chinese character "${character}" (${pinyin}) that incorporates:

Actor: ${actor}
Set Location: ${set}
Tone Location (Tone ${tone}): ${toneLocation}
Radical Props: ${radicalProps.map((rp) => `${rp.radical} (${rp.prop})`).join(', ')}

The scene should:
1. Take place in the specified location (${set})
2. Feature ${actor} as the main actor
3. The action should happen in the tone location: ${toneLocation}
4. Incorporate the radical props naturally into the scene
5. Create a memorable connection to the character's meaning
6. Be concise but vivid (around 100-150 words)
7. Include line breaks for readability
8. Be slightly humorous but not over-the-top

The scene should help remember both the character's appearance and meaning through the story.`;

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content:
              'You are a creative writer specializing in creating memorable, vivid scenes for a Chinese character memory palace system. Your scenes should be concise, clear, and incorporate all the elements provided in a natural way.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.8,
        max_tokens: 500,
      });

      const movieScene = completion.choices[0].message.content;

      res.status(200).json({ movie: movieScene });
    } catch (error) {
      console.error('Error generating movie:', error);
      res.status(500).json({ error: 'Failed to generate movie scene' });
    }
  };
}
