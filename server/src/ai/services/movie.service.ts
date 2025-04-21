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
    // const actorName = character.initialActor?.name || '';
    // const location = character.finalSet?.name || '';

    // Create a prompt for DALL-E that captures the essence of the story
    //     const imagePrompt = `Create a vibrant, photorealistic scene for the following story:
    // The scene shows ${actorName} in ${location}.
    // The image should be memorable, slightly stylized, and clearly represent the Chinese character "${character.character}" (${character.definition}).
    // Make it visually distinct and high quality.  Here is the scene: ${storyText} - Remember to make ${actorName} the main focus of the image.`;

    const imagePrompt = `Create a vibrant, photorealistic scene for the following story: ${storyText}`;

    this.logger.log(`Image generation prompt: ${imagePrompt}`);

    const response = await this.openai.images.generate({
      model: 'dall-e-3',
      prompt: imagePrompt,
      n: 1,
      size: '1024x1024',
    });

    this.logger.log(`Image generation prompt: ${imagePrompt}`);
    this.logger.log(`Generated image URL: ${response.data[0]?.url}`);

    const imageUrl = response.data[0]?.url;
    if (!imageUrl) {
      return undefined;
    }

    // Download the image as a buffer
    const imageResponse = await fetch(imageUrl);
    const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
    // Use characterID for the filename
    const filename = `${character.id}.png`;

    // Upload to S3
    const s3Url = await this.uploadToS3(imageBuffer, filename);

    return s3Url;
  }

  private async uploadToS3(
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
