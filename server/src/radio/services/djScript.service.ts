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
      'Breaking it down nice and slow:',
      "Let's spell that out together slowly:",
      "Here's how its spelled slowly:",
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

  async generateCompletePreviewScript(character: Character): Promise<string> {
    const cacheKey = `preview_complete_${character.id}`;
    const file = path.join(this.cacheDir, `${cacheKey}.txt`);

    if (fs.existsSync(file)) {
      return fs.readFileSync(file, 'utf8');
    }

    // We'll need to get actor and set info - let's build the prompt with available data
    const prompt = `You're a witty, engaging radio DJ wrapping up a Chinese learning segment.
Generate a complete "coming up next" preview script for the next character students will learn.

Character: ${character.character}
Pinyin: ${character.pinyin}
Definition: ${character.definition}

Create a 30-45 second script that:
1. Introduces the 'Next Character' Segment
2. Reveals the character's meaning
3. Says the character a few times
4. Spells out the character's pinyin and tone number
5. Uses the character in a very simple chinese sentence.
6. Talks about the character and if it's a character used often or not.  How I might see it and how it is similar or different from the literal meaning.
7. Uses only text, the radio host will read the script exactly as written.
`;

    const script = await this.generateScript(prompt);
    fs.writeFileSync(file, script);
    return script;
  }

  async generateCharacterPreviewScript(
    currentCharacter: Character,
    previousCharacter?: Character,
    nextCharacter?: Character,
  ): Promise<string> {
    const position = this.determinePosition(previousCharacter, nextCharacter);
    const cacheKey = `preview_${position}_${currentCharacter.id}_${previousCharacter?.id || 'none'}_${nextCharacter?.id || 'none'}`;

    // Check cache first
    const file = path.join(this.cacheDir, `${cacheKey}.txt`);
    if (fs.existsSync(file)) {
      return fs.readFileSync(file, 'utf8');
    }

    const prompt = this.buildPromptForPosition(
      position,
      currentCharacter,
      previousCharacter,
      nextCharacter,
    );
    const script = await this.generateScript(prompt);

    // Cache the result
    fs.writeFileSync(file, script);
    return script;
  }

  private determinePosition(
    previous?: Character,
    next?: Character,
  ): 'first' | 'middle' | 'last' | 'only' {
    if (!previous && !next) return 'only';
    if (!previous) return 'first';
    if (!next) return 'last';
    return 'middle';
  }

  private buildPromptForPosition(
    position: 'first' | 'middle' | 'last' | 'only',
    current: Character,
    previous?: Character,
    next?: Character,
  ): string {
    const baseInfo = `Character: ${current.character} (${current.pinyin}) - ${current.definition}`;

    switch (position) {
      case 'first':
        return `You're a witty radio DJ starting a preview segment of upcoming Chinese characters.

${baseInfo}
Next Character: ${next?.character} (${next?.pinyin}) - ${next?.definition}

This is the FIRST character in a preview of multiple upcoming characters.

Create a 45-60 second script that:
1. Opens the preview segment with excitement ("But wait, there's more! Let me give you a preview of your next characters...")
2. Introduces this character with its meaning and usage
3. Spells out the pinyin and mentions the tone
4. Uses it in a simple Chinese sentence
5. Discusses how common/useful it is
6. Creates anticipation for the next character without revealing too much

Say "The character is" and we'll insert the pronunciation.
End with a smooth transition hint toward the next character.`;

      case 'middle':
        return `You're a witty radio DJ continuing a preview of Chinese characters.

Previous Character: ${previous?.character} (${previous?.pinyin}) - ${previous?.definition}
${baseInfo}
Next Character: ${next?.character} (${next?.pinyin}) - ${next?.definition}

This is a MIDDLE character in the preview sequence.

Create a 30-45 second script that:
1. Smoothly transitions from the previous character (find a connection: meaning, sound, visual, context, or contrast)
2. Introduces this character with its meaning and usage
3. Spells out the pinyin and mentions the tone
4. Uses it in a simple Chinese sentence
5. Discusses practical applications
6. Sets up anticipation for the next character

Say "The character is" and we'll insert the pronunciation.
Make the transition from previous character feel natural and educational.`;

      case 'last':
        return `You're a witty radio DJ concluding a preview of Chinese characters.

Previous Character: ${previous?.character} (${previous?.pinyin}) - ${previous?.definition}
${baseInfo}

This is the LAST character in the preview sequence.

Create a 45-60 second script that:
1. Smoothly transitions from the previous character
2. Introduces this character with its meaning and usage
3. Spells out the pinyin and mentions the tone
4. Uses it in a simple Chinese sentence
5. Discusses its importance/frequency
6. Wraps up the entire preview segment with motivation
7. Ends with a call-to-action to create movies for all characters

Say "The character is" and we'll insert the pronunciation.
End with excitement and motivation for the upcoming learning journey.`;

      case 'only':
        return `You're a witty radio DJ creating a preview for a single upcoming Chinese character.

${baseInfo}

This is the ONLY character in the preview segment.

Create a 45-60 second script that:
1. Opens the preview segment with excitement
2. Introduces this character with its meaning and usage
3. Spells out the pinyin and mentions the tone
4. Uses it in a simple Chinese sentence
5. Discusses how common/useful it is
6. Ends with motivation to create a movie for this character

Say "The character is" and we'll insert the pronunciation.
Make it engaging and complete as a standalone preview.`;
    }
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
          max_tokens: 650,
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
