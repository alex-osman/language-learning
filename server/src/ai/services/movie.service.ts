import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import OpenAI from 'openai';
import {
  MovieGenerationRequestDto,
  MovieGenerationResponseDto,
} from '../dto/movie-generation.dto';

@Injectable()
export class MovieAiService {
  private readonly logger = new Logger(MovieAiService.name);
  private readonly openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async generateMovie(
    request: MovieGenerationRequestDto,
  ): Promise<MovieGenerationResponseDto> {
    try {
      const { character, pinyin, actor, set, tone, radicalProps, definition } =
        request;

      const tones = {
        '1': 'Outside the entrance',
        '2': 'Kitchen or inside entrance',
        '3': 'Bedroom or living room',
        '4': 'Bathroom or outside/yard',
        '5': 'On the roof',
      } as const;

      const actualToneLocation =
        tone && tone in tones ? tones[tone as keyof typeof tones] : '';
      const prompt = `Create a scene for the Chinese character "${character}" (${pinyin}) - "${definition}" that incorporates:

Actor: ${actor}
Set Location: ${set}
Tone Location (Tone ${tone}): ${actualToneLocation}
Radical Props: ${radicalProps.map((rp) => `${rp.radical} (${rp.prop})`).join(', ')}

The scene should:
1. Take place in the specified location (${set})
2. Feature ${actor} as the main actor
3. The action should happen in the tone location: ${actualToneLocation}
4. Incorporate the radical props naturally into the scene
5. Create a memorable connection to the character's meaning
6. Be concise but vivid, no more than 4 sentences
7. Include line breaks for readability
8. Be slightly humorous but not over-the-top

The scene should help remember both the character's appearance and meaning through the story.`;

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content:
              'You are a memory expert helping a client create vivid scenes for a Chinese character memory palace system. Your scenes should be concise, clear, and incorporate all the elements provided in a natural way.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.8,
        max_tokens: 350,
      });
      const movieScene = completion.choices[0]?.message?.content;
      if (!movieScene) {
        throw new HttpException(
          'Failed to generate movie scene: No content received from AI',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      return { movie: movieScene };
    } catch (error) {
      // If it's already an HttpException, rethrow it
      if (error instanceof HttpException) {
        throw error;
      }

      // Log the error with proper type checking
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Movie generation failed: ${errorMessage}`, errorStack);

      // Throw a new HttpException with the error details
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: 'Failed to generate movie scene',
          details: errorMessage,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
