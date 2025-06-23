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

  async generateIntro(character: Character): Promise<string> {
    const cacheKey = `intro_${character.id}`;
    const file = path.join(this.cacheDir, `${cacheKey}.txt`);

    if (fs.existsSync(file)) {
      return fs.readFileSync(file, 'utf8');
    }

    const prompt = `You're a fun DJ hosting a Chinese learning podcast.  You're reminding the listener about a character they have seen before but often forget. The character is: ${character.character}.  The pinyin is: ${character.pinyin}.  The definition is: ${character.definition}.

    Write a short 1 sentence intro. Before we tell the listener how to spell the character.`;

    const script = await this.generateScript(prompt);
    fs.writeFileSync(file, script);
    return script;
  }

  async generateSpellingIntro(
    spelledPinyin: string,
    toneNumber: number,
  ): Promise<string> {
    // Predefined DJ phrases for spelling introduction
    const spellingPhrases = [
      "Here's how we spell it out slowly:",
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
Radicals: ${character.radicals}
Definition: ${character.definition}
Movie Scene: ${movieSnippet}

Create 2-3 sentences for the DJ to say.  If the character has a notable look or radicals, mention that.`;

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

    const prompt = `You're a witty, engaging radio DJ hosting a Chinese learning segment.
Generate a complete script for the next character students will learn.

Character: ${character.character}
Pinyin: ${character.pinyin}
Definition: ${character.definition}

Create a 30-45 second script that:
1. Introduces the Character
2. Reveals the character's meaning
3. Spells out the character's pinyin using the exact format:
    "[character] spelled out slowly is [capital letter] - [capital letter] - [capital letter].  That is tone [number].  Again, spelled out slowly it is [capital letter],[capital letter],[capital letter].  That is tone [number]."
    For example, 讨 is T - A - O.  That is tone 3.  Again spelled out slowly it is T,A,O.  That is tone 3.
4. Uses the character in a very simple chinese sentence.
5. Talks about the character and if it's a character used often or not.  How I might see it and how it is similar or different from the literal meaning.  If it is used in words, what are some examples?
6. Uses only text, the radio host will read the script exactly as written.
`;

    const script = await this.generateScript(prompt);
    fs.writeFileSync(file, script);
    return script;
  }

  async generateMultiCharacterPreviewScript(
    characters: Character[],
  ): Promise<string> {
    const cacheKey = `multi_preview_${characters.map((c) => c.id).join('_')}`;
    const file = path.join(this.cacheDir, `${cacheKey}.txt`);

    if (fs.existsSync(file)) {
      return fs.readFileSync(file, 'utf8');
    }

    const characterList = characters
      .map(
        (char, index) =>
          `${index + 1}. ${char.character} (${char.pinyin}) - ${char.definition} - Character ID: ${char.id}`,
      )
      .join('\n');

    const prompt = `You're a witty, engaging radio DJ creating a segment for Chinese characters.

Characters to preview:
${characterList}

Create a script that:

1. Introduces each character and mentions the character ID
2. Reveals the character's meaning
3. Spells out the character's pinyin using the exact format:
    "[character] spelled out slowly is [capital letter] - [capital letter] - [capital letter].  That is tone [number].  Again, spelled out slowly it is [capital letter],[capital letter],[capital letter].  That is tone [number]."
    For example, 讨 is T - A - O.  That is tone 3.  Again spelled out slowly it is T,A,O.  That is tone 3.
4. Uses the character in a very simple chinese sentence.
5. Talks about the character and if it's a character used often or not.  How I might see it and how it is similar or different from the literal meaning.  If it is used in words, what are some examples?
6. Uses only text, the radio host will read the script exactly as written.`;

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
1. Opens the preview segment with excitement for learning the next characters.
2. Introduces this character with its meaning and usage
3. Spells out the pinyin and says the tone number
4. Uses it in a simple Chinese sentence
5. Discusses how common/useful it is
6. Uses only text, the radio host will read the script exactly as written.

End with a smooth transition to the next character.`;

      case 'middle':
        return `You're a witty radio DJ continuing a preview of Chinese characters.

Previous Character: ${previous?.character} (${previous?.pinyin}) - ${previous?.definition}
${baseInfo}
Next Character: ${next?.character} (${next?.pinyin}) - ${next?.definition}

This is a MIDDLE character in the preview sequence.

Create a 30-45 second script that:
1. Smoothly transitions from the previous character (find a connection: meaning, sound, visual, context, or contrast)
2. Introduces this character with its meaning and usage
3. Spells out the pinyin and says the tone number
4. Uses it in a simple Chinese sentence
5. Discusses practical applications
6. Relates this character to the next character in some way.
7. Uses only text, the radio host will read the script exactly as written.

Make the transition from previous character feel natural and educational.`;

      case 'last':
        return `You're a witty radio DJ concluding a preview of Chinese characters.

Previous Character: ${previous?.character} (${previous?.pinyin}) - ${previous?.definition}
${baseInfo}

This is the LAST character in the preview sequence.

Create a 45-60 second script that:
1. Smoothly transitions from the previous character
2. Introduces this character with its meaning and usage
3. Spells out the pinyin and says the tone number
4. Uses it in a simple Chinese sentence
5. Discusses its importance/frequency
6. Wraps up the entire preview segment
7. Uses only text, the radio host will read the script exactly as written.`;

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
7. Uses only text, the radio host will read the script exactly as written.`;
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
                'You are a professional radio DJ script writer. Create engaging, natural-sounding radio content that is educational but fun. Keep responses concise, casual, and controversial.  Respond only in text, no markdown or other formatting.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          max_tokens: 1000,
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
