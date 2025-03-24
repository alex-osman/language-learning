import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MandarinBlueprint, RadicalProp } from '../../interfaces/mandarin-blueprint.interface';
import { MovieGenerationRequest, MovieService } from '../../services/movie.service';

interface CharacterData {
  character: string;
  pinyin?: string;
  definition?: string;
  movie?: string;
  props?: { radical: string; prop?: string }[];
}

interface MovieScene {
  initial: string;
  final: string;
  actor: string;
  set: string;
  tone: string;
}

@Component({
  selector: 'app-characters',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './characters.component.html',
  styleUrls: ['./characters.component.scss'],
})
export class CharactersComponent {
  @Input() blueprint!: MandarinBlueprint;

  private readonly MAX_INCOMPLETE_ITEMS = 20;
  selectedCharacter: CharacterData | null = null;
  movieScene: MovieScene | null = null;
  isGeneratingMovie = false;
  radicalProps: RadicalProp[] = [];

  constructor(private movieService: MovieService) {}

  // Common two-letter initials in Mandarin
  private readonly TWO_LETTER_INITIALS = ['zh', 'ch', 'sh', 'ji', 'qi', 'xi', 'du', 'ru', 'shu'];

  // Special case mappings for finals that don't directly match sets
  private readonly FINAL_MAPPINGS: { [key: string]: string } = {
    i: 'e', // Map 'i' to '-e' set (yi -> -e)
    ie: 'e', // Map 'ie' to '-e' set (jie -> -e)
    r: 'er', // Map 'r' to '-er' set (er -> -er)
    u: 'ou', // Map 'u' to '-ou' set (bu -> -ou)
    ü: 'ou', // Map 'ü' to '-ou' set
  };

  // Special case mappings for initials that need 'i' added
  private readonly INITIAL_MAPPINGS: { [key: string]: string } = {
    n: 'ni', // Map 'n' to 'ni' for actor Nicole
    j: 'ji', // Map 'j' to 'ji' for actor Jamie
    q: 'qi', // Map 'q' to 'qi'
    x: 'xi', // Map 'x' to 'xi'
  };

  get filteredCharacters(): CharacterData[] {
    if (!this.blueprint?.characters) return [];
    const characters = this.blueprint.characters;
    const complete = characters.filter(char => this.hasCharacterData(char));
    const incomplete = characters
      .filter(char => !this.hasCharacterData(char))
      .slice(0, this.MAX_INCOMPLETE_ITEMS);
    return [...complete, ...incomplete];
  }

  get charactersProgress(): string {
    if (!this.blueprint?.characters) return '0 / 0 characters complete';
    const total = this.blueprint.characters.length;
    const complete = this.blueprint.characters.filter(char => this.hasCharacterData(char)).length;
    return `${complete} / ${total} characters complete`;
  }

  hasCharacterData(char: CharacterData): boolean {
    return !!(char?.pinyin && char?.definition);
  }

  getCharacterPinyin(char: CharacterData): string {
    return char?.pinyin || '';
  }

  getCharacterDefinition(char: CharacterData): string {
    return char?.definition || '';
  }

  getCharacterRadicalProps(char: CharacterData): RadicalProp[] {
    const characterRadicals = char.props || [];
    this.radicalProps = characterRadicals
      .map(charRadical => {
        const fullProp = this.blueprint.radicalProps.find(bp => bp.radical === charRadical.radical);
        return fullProp ? { radical: fullProp.radical, prop: fullProp.prop } : null;
      })
      .filter(
        (prop): prop is { radical: string; prop: string } =>
          prop !== null && prop.prop !== undefined
      );

    return this.radicalProps;
  }

  clearSelection(): void {
    this.selectedCharacter = null;
    this.movieScene = null;
  }

  getToneNumber(pinyin: string): string {
    // Map of tone marks to numbers
    const toneMap: { [key: string]: string } = {
      ā: '1',
      ē: '1',
      ī: '1',
      ō: '1',
      ū: '1',
      ǖ: '1',
      á: '2',
      é: '2',
      í: '2',
      ó: '2',
      ú: '2',
      ǘ: '2',
      ǎ: '3',
      ě: '3',
      ǐ: '3',
      ǒ: '3',
      ǔ: '3',
      ǚ: '3',
      à: '4',
      è: '4',
      ì: '4',
      ò: '4',
      ù: '4',
      ǜ: '4',
    };

    // Find the first tone mark in the pinyin
    for (const char of pinyin) {
      if (char in toneMap) {
        return toneMap[char];
      }
    }

    // If no tone mark is found, assume it's tone 5 (neutral tone)
    return '5';
  }

  onCharacterHover(char: CharacterData) {
    if (!char.pinyin) return;

    this.selectedCharacter = char;

    // Parse pinyin to get initial and final
    const pinyin = char.pinyin.toLowerCase();
    let initial = '';
    let final = '';

    // First, remove tone marks from the entire pinyin
    const pinyinNoTones = pinyin.replace(/[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]/g, match => {
      const toneToBase: { [key: string]: string } = {
        ā: 'a',
        á: 'a',
        ǎ: 'a',
        à: 'a',
        ē: 'e',
        é: 'e',
        ě: 'e',
        è: 'e',
        ī: 'i',
        í: 'i',
        ǐ: 'i',
        ì: 'i',
        ō: 'o',
        ó: 'o',
        ǒ: 'o',
        ò: 'o',
        ū: 'u',
        ú: 'u',
        ǔ: 'u',
        ù: 'u',
        ǖ: 'ü',
        ǘ: 'ü',
        ǚ: 'ü',
        ǜ: 'ü',
      };
      return toneToBase[match] || match;
    });

    // Split into initial and final
    if (pinyinNoTones.startsWith('shu')) {
      initial = 'shu';
      final = pinyinNoTones.substring(3);
    } else if (
      pinyinNoTones.startsWith('shi') ||
      pinyinNoTones.startsWith('chi') ||
      pinyinNoTones.startsWith('zhi')
    ) {
      // Special case: treat shi/chi/zhi as complete initials with no final
      initial = pinyinNoTones.substring(0, 2);
      final = '';
    } else if (this.TWO_LETTER_INITIALS.some(i => pinyinNoTones.startsWith(i))) {
      initial = pinyinNoTones.substring(0, 2);
      final = pinyinNoTones.substring(2);
    } else {
      const firstChar = pinyinNoTones[0];
      // Special handling for w/y initials - use just the first letter and no final
      if (firstChar === 'w' || firstChar === 'y') {
        initial = firstChar;
        final = ''; // Empty final will use null set (Bridgewater)
      } else if ((firstChar === 'd' || firstChar === 'r') && pinyinNoTones[1] === 'u') {
        initial = pinyinNoTones.substring(0, 2);
        final = pinyinNoTones.substring(2);
      } else if (firstChar in this.INITIAL_MAPPINGS) {
        initial = this.INITIAL_MAPPINGS[firstChar];
        final = pinyinNoTones.substring(1);
      } else {
        initial = firstChar;
        final = pinyinNoTones.substring(1);
      }
    }

    // Map special case finals to their corresponding sets
    const mappedFinal = this.FINAL_MAPPINGS[final] || final;

    // Get actor and set from blueprint
    const matchingActor = this.blueprint.actors.find(a => a.initial === initial);
    const fallbackActor = this.blueprint.actors.find(a => a.initial === 'ø');
    const actor = matchingActor?.name || fallbackActor?.name || '(No actor assigned)';

    // For w/y initials or empty finals, use the null set (Bridgewater)
    const setKey = final ? `-${mappedFinal}` : 'null';
    const set = this.blueprint.sets[setKey];
    const tone = this.getToneNumber(pinyin);

    this.movieScene = {
      initial,
      final: mappedFinal,
      actor,
      set: set || this.blueprint.sets['null'],
      tone,
    };
  }

  generateMovie(): void {
    if (!this.selectedCharacter || !this.movieScene) return;

    this.isGeneratingMovie = true;

    const request: MovieGenerationRequest = {
      character: this.selectedCharacter.character,
      pinyin: this.selectedCharacter.pinyin || '',
      actor: this.movieScene.actor,
      set: this.movieScene.set,
      tone: this.movieScene.tone,
      toneLocation: this.blueprint.tones[this.movieScene.tone],
      radicalProps: this.radicalProps,
    };

    this.movieService.generateMovie(request).subscribe({
      next: response => {
        if (this.selectedCharacter && this.blueprint.characters) {
          // Find and update the character in the blueprint data
          const charIndex = this.blueprint.characters.findIndex(
            c => c.character === this.selectedCharacter?.character
          );
          if (charIndex !== -1) {
            this.blueprint.characters[charIndex].movie = response.movie;
            this.selectedCharacter.movie = response.movie;
          }
        }
        this.isGeneratingMovie = false;
      },
      error: error => {
        console.error('Error generating movie:', error);
        this.isGeneratingMovie = false;
      },
    });
  }
}
