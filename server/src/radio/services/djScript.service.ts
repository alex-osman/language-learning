import { Injectable } from '@nestjs/common';
import { BaseAiService } from '../../ai/services/base-ai.service';
import { Character } from '../../entities/character.entity';
import * as fs from 'fs';
import * as crypto from 'crypto';
import * as path from 'path';

@Injectable()
export class DjScriptService extends BaseAiService {
  private readonly cacheDir = path.join(
    process.cwd(),
    'radio-cache',
    'scripts',
  );

  constructor() {
    super();
    if (!fs.existsSync(this.cacheDir)) {
      fs.mkdirSync(this.cacheDir, { recursive: true });
    }
  }

  async generateIntro(
    character: Character,
    characterNumber: number,
  ): Promise<string> {
    const cacheKey = `intro_${character.id}_${characterNumber}`;
    const file = path.join(this.cacheDir, `${cacheKey}.txt`);

    if (fs.existsSync(file)) {
      return fs.readFileSync(file, 'utf8');
    }

    const prompt = `You're a fun, energetic, engaging, and controversial radio DJ introducing a Chinese character to language learners.

Character: ${character.character}
Pinyin: ${character.pinyin}
Definition: ${character.definition}
Character Number: ${this.getOrdinal(characterNumber)}

Create a 1-2 sentence witty, silly, and engaging intro that mentions this is the "${this.getOrdinal(characterNumber)} character" and builds excitement. Keep it conversational and fun, like a real radio DJ. Don't mention the movie yet - that comes later.

Example style: "Alright, let's tackle our third character today!  This one's super useful when you need to say 'I'm sorry' in Chinese because you've been a naughty naughty boy."`;

    const script = await this.generateScript(prompt);
    fs.writeFileSync(file, script);
    return script;
  }

  async generateSpellingIntro(
    character: Character,
    spelledPinyin: string,
    toneNumber: number,
  ): Promise<string> {
    // Predefined DJ phrases for spelling introduction
    const spellingPhrases = [
      'Let me break that down for you slowly:',
      "Here's how we spell it out slowly:",
      "Letter by letter, that's:",
      'Breaking it down nice and slow:',
      "Let's spell that out together slowly:",
      'Piece by piece it is spelled:',
      "Here's how its speled slowly:",
    ];

    // Randomly select a phrase
    const randomPhrase =
      spellingPhrases[Math.floor(Math.random() * spellingPhrases.length)];

    // Combine with spelled pinyin and tone
    return `${randomPhrase} ${spelledPinyin}, tone ${toneNumber}`;
  }

  async generateMovieContext(character: Character): Promise<string> {
    const cacheKey = `context_${character.id}`;
    const file = path.join(this.cacheDir, `${cacheKey}.txt`);

    if (fs.existsSync(file)) {
      return fs.readFileSync(file, 'utf8');
    }

    const movieSnippet = character.movie;

    const prompt = `You're a witty radio DJ explaining how a Chinese character connects to a memorable movie scene. Help students remember the character through the story.

Character: ${character.character}
Definition: ${character.definition}
Movie Scene: ${movieSnippet}

Create 2-3 sentences for the DJ to say. End with something like "And that's how you'll never forget [character]!"`;

    const script = await this.generateScript(prompt);
    fs.writeFileSync(file, script);
    return script;
  }

  private async generateScript(prompt: string): Promise<string> {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const response = await this.openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content:
                'You are a professional radio DJ script writer. Create engaging, natural-sounding radio content that is educational but fun. Keep responses concise, casual, and controversial.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          max_tokens: 150,
          temperature: 0.8,
        });

        return (
          response.choices[0]?.message?.content?.trim() ||
          'Script generation failed'
        );
      } catch (e) {
        if (attempt === 2) throw e;
        await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
      }
    }

    throw new Error('Failed to generate DJ script after 3 attempts');
  }

  private getOrdinal(num: number): string {
    const ordinals = [
      'first',
      'second',
      'third',
      'fourth',
      'fifth',
      'sixth',
      'seventh',
      'eighth',
      'ninth',
      'tenth',
    ];
    return ordinals[num - 1] || `${num}th`;
  }
}
