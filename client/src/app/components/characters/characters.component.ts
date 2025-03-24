import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MandarinBlueprint } from '../../interfaces/mandarin-blueprint.interface';

interface CharacterData {
  character: string;
  pinyin?: string;
  definition?: string;
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
  template: `
    <div class="section characters">
      <h2>Characters Progress</h2>
      <div class="progress-stats">{{ charactersProgress }}</div>
      <div class="grid">
        <ng-container *ngFor="let char of filteredCharacters">
          <div
            class="cell"
            [class.has-data]="hasCharacterData(char)"
            [class.no-data]="!hasCharacterData(char)"
            (mouseenter)="onCharacterHover(char)"
            (mouseleave)="clearSelection()"
          >
            <div class="cell-content">
              <div class="character">{{ char.character }}</div>
              <ng-container *ngIf="hasCharacterData(char)">
                <div class="pinyin">{{ getCharacterPinyin(char) }}</div>
                <div class="definition">{{ getCharacterDefinition(char) }}</div>
              </ng-container>
            </div>
          </div>
        </ng-container>
      </div>

      <!-- Movie Scene Info Panel -->
      <div *ngIf="selectedCharacter && movieScene" class="movie-scene-panel">
        <div class="panel-header">
          <h3>
            {{ selectedCharacter.character }} - {{ movieScene.initial }}{{ movieScene.final }}
          </h3>
          <button class="close-btn" (click)="clearSelection()">×</button>
        </div>
        <div class="panel-content">
          <div class="info-section">
            <h4>Actor</h4>
            <p>{{ movieScene.actor }}</p>
          </div>
          <div class="info-section">
            <h4>Set Location</h4>
            <p>{{ movieScene.set }}</p>
          </div>
          <div class="info-section">
            <h4>Tone Location (Tone {{ movieScene.tone }})</h4>
            <p>{{ blueprint.tones[movieScene.tone] }}</p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
        gap: 1rem;
      }

      .progress-stats {
        text-align: center;
        padding: 0.5rem;
        margin: 1rem 0;
        border-top: 1px solid #e0e0e0;
        border-bottom: 1px solid #e0e0e0;
        color: #666;
      }

      .cell {
        border-radius: 6px;
        padding: 1rem;
        transition: all 0.2s ease;
        cursor: pointer;

        &:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        &.has-data {
          background-color: #e3f2fd;
          border: 1px solid #90caf9;

          .character {
            color: #1565c0;
          }

          .pinyin {
            color: #1976d2;
          }

          .definition {
            color: #0d47a1;
          }
        }

        &.no-data {
          background-color: #f5f5f5;
          border: 1px solid #e0e0e0;

          .character {
            color: #757575;
          }
        }
      }

      .cell-content {
        .character {
          font-size: 2rem;
          font-weight: bold;
          text-align: center;
          margin-bottom: 0.5rem;
        }

        .pinyin {
          font-size: 0.9rem;
          text-align: center;
          margin-bottom: 0.25rem;
        }

        .definition {
          font-size: 0.8rem;
          text-align: center;
          word-break: break-word;
        }
      }

      .movie-scene-panel {
        position: fixed;
        right: 2rem;
        top: 50%;
        transform: translateY(-50%);
        background-color: white;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        width: 300px;
        max-height: 80vh;
        overflow-y: auto;
        z-index: 1000;

        .panel-header {
          padding: 1rem;
          border-bottom: 1px solid #e0e0e0;
          display: flex;
          justify-content: space-between;
          align-items: center;
          position: sticky;
          top: 0;
          background-color: white;

          h3 {
            margin: 0;
            font-size: 1.25rem;
            color: #1565c0;
          }

          .close-btn {
            background: none;
            border: none;
            font-size: 1.5rem;
            color: #666;
            cursor: pointer;
            padding: 0.25rem;
            line-height: 1;
            border-radius: 4px;

            &:hover {
              background-color: #f5f5f5;
            }
          }
        }

        .panel-content {
          padding: 1rem;

          .info-section {
            margin-bottom: 1.5rem;

            &:last-child {
              margin-bottom: 0;
            }

            h4 {
              font-size: 1rem;
              color: #666;
              margin: 0 0 0.5rem;
            }

            p {
              margin: 0;
              color: #333;
              line-height: 1.5;
            }
          }
        }
      }
    `,
  ],
})
export class CharactersComponent {
  @Input() blueprint!: MandarinBlueprint;

  private readonly MAX_INCOMPLETE_ITEMS = 20;
  selectedCharacter: CharacterData | null = null;
  movieScene: MovieScene | null = null;

  // Common two-letter initials in Mandarin
  private readonly TWO_LETTER_INITIALS = ['zh', 'ch', 'sh', 'ji', 'qi', 'xi', 'du', 'ru'];

  // Special case mappings for finals that don't directly match sets
  private readonly FINAL_MAPPINGS: { [key: string]: string } = {
    i: 'e', // Map 'i' to '-e' set (yi -> -e)
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
    console.log('Original pinyin:', pinyin);
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
    console.log('Pinyin without tones:', pinyinNoTones);

    // Split into initial and final
    if (this.TWO_LETTER_INITIALS.some(i => pinyinNoTones.startsWith(i))) {
      initial = pinyinNoTones.substring(0, 2);
      final = pinyinNoTones.substring(2);
    } else {
      const firstChar = pinyinNoTones[0];
      // Special handling for syllables starting with 'd' or 'r' followed by 'u'
      if ((firstChar === 'd' || firstChar === 'r') && pinyinNoTones[1] === 'u') {
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
    console.log('Extracted initial:', initial);
    console.log('Extracted final:', final);

    // Map special case finals to their corresponding sets
    const mappedFinal = this.FINAL_MAPPINGS[final] || final;
    console.log('Mapped final:', mappedFinal);

    // Get actor and set from blueprint
    console.log('Looking for actor with initial:', initial);
    console.log('Available actors:', this.blueprint.actors);
    const matchingActor = this.blueprint.actors.find(a => a.initial === initial);
    console.log('Found matching actor:', matchingActor);
    const fallbackActor = this.blueprint.actors.find(a => a.initial === 'null');
    console.log('Fallback actor:', fallbackActor);
    const actor = matchingActor?.name || fallbackActor?.name || '(No actor assigned)';
    console.log('Final actor choice:', actor);
    const setKey = `-${mappedFinal}`;
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
}
