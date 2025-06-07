import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import {
  PutObjectCommand,
  S3Client,
  S3ServiceException,
} from '@aws-sdk/client-s3';

import {
  CharacterDTO,
  TONES_MAPPED_TO_LOCATION,
} from '@shared/interfaces/data.interface';

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
    character: CharacterDTO,
    userInput?: string,
  ): Promise<{ text: string; imageUrl?: string }> {
    try {
      let toneLocation =
        TONES_MAPPED_TO_LOCATION[
          String(character.toneNumber) as keyof typeof TONES_MAPPED_TO_LOCATION
        ];
      const attemptToneLocation = character.finalSet?.toneLocations.find(
        (t) => t.toneNumber === character.toneNumber,
      );
      if (attemptToneLocation) {
        toneLocation = attemptToneLocation.name;
        if (attemptToneLocation.description) {
          toneLocation += ` - ${attemptToneLocation.description}`;
        }
      }
      let actorName = character.initialActor?.name;
      if (character.initialActor?.description) {
        actorName += ` - ${character.initialActor.description}`;
      }

      const prompt = `Create a scene for the Chinese character "${character.character}" (${character.pinyin}) - "${character.definition}" that incorporates:

Actor: ${actorName}
Set Location: ${character.finalSet?.name}
Tone Location (Tone ${character.toneNumber}): ${toneLocation}
Radical Props: ${character.radicals?.map((rp) => `${rp.radical} (${rp.prop})`).join(', ')}

The scene should:
1. Take place in the specified location (${character.finalSet?.name})
2. Feature ${character.initialActor?.name} as the main actor
3. The action should happen in the tone location: ${toneLocation}
4. Incorporate the radical props naturally into the scene
5. Create a memorable connection to the character's meaning
6. Be concise but vivid, no more than 4 sentences
7. Include line breaks for readability
8. Be slightly humorous but not over-the-top

${userInput ? `Additional user-requested elements: ${userInput}` : ''}

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

      // Generate image based on the story
      try {
        const imageUrl = await this.generateImage(movieScene, character);
        this.logger.log(
          `Image generated successfully for character: ${character.character}`,
        );
        return { text: movieScene, imageUrl };
      } catch (imageError) {
        // If image generation fails, log the error but still return the text
        this.logger.error(
          `Image generation failed, but returning text: ${imageError}`,
        );
        return { text: movieScene };
      }
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

  public async generateImage(
    storyText: string,
    character: CharacterDTO,
  ): Promise<string | undefined> {
    const imagePrompt = `Create a vibrant, photorealistic scene for a Chinese character learning system. This is for educational purposes to help remember Chinese characters.

Guidelines:
- Create a clear, memorable scene that matches the story exactly
- If the story mentions a public figure, create a scene that captures their distinctive appearance and characteristics
- The image should be suitable for educational use
- Make the scene vivid and engaging while maintaining accuracy to the story
- Focus on visual clarity and memorable details

Character: ${character.character} (${character.pinyin})
Story context: ${storyText}
`;

    this.logger.log('=== Image Generation Debug Info ===');
    this.logger.log(`Full Image Prompt: ${imagePrompt}`);
    this.logger.log('================================');

    const response = await this.openai.images.generate({
      model: 'gpt-image-1',
      prompt: imagePrompt,
      n: 1,
      moderation: 'low',
      quality: 'standard',
    });

    console.log('response', response);

    if (!response.data?.[0]?.b64_json) {
      this.logger.error('No image data received from DALL-E');
      return undefined;
    }

    this.logger.log('=== DALL-E Response ===');
    this.logger.log('Image generated successfully');
    this.logger.log('========================');

    // Convert base64 to buffer
    const imageBuffer = Buffer.from(response.data[0].b64_json, 'base64');
    const filename = `${character.id}.png`;

    // Upload to S3
    const s3Url = await this.uploadToS3(imageBuffer, filename);

    return s3Url;
  }

  public async uploadToS3(
    imageBuffer: Buffer,
    filename: string,
  ): Promise<string> {
    try {
      // You'll need to set up the AWS SDK and S3 client
      const bucketName = 'chinese-public';
      const key = `${filename}`;

      const client = new S3Client({
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
        },
        region: process.env.AWS_REGION || '',
      });

      const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: imageBuffer,
      });
      const response = await client.send(command);

      // Return the S3 URL
      return `https://${bucketName}.s3.amazonaws.com/${key}`;
    } catch (error) {
      this.logger.error(`Failed to upload image to S3: ${error.message}`);
      throw error;
    }
  }
}
