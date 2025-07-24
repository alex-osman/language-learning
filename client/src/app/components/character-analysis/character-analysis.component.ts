import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AnalyzedCharacter } from '../../services/sentence-analysis.service';
import { CharacterDTO } from '../../services/data.service';
import { CharacterExplorerComponent } from '../character-explorer/character-explorer.component';

@Component({
  selector: 'app-character-analysis',
  standalone: true,
  imports: [CommonModule, CharacterExplorerComponent],
  template: `
    <app-character-explorer
      [characters]="analysisCharacters"
      [isLoading]="isLoading"
      [error]="error"
      [showStats]="showStats"
      [compact]="compact"
      mode="analysis"
      [showActions]="false"
      [showLearningButtons]="false"
      [showMovieGeneration]="false"
    >
    </app-character-explorer>
  `,
  styleUrls: ['./character-analysis.component.scss'],
})
export class CharacterAnalysisComponent {
  @Input() analysisResults: AnalyzedCharacter[] = [];
  @Input() totalCharacters: number = 0;
  @Input() knownCharacters: number = 0;
  @Input() unknownCharacters: number = 0;
  @Input() knownPercentage: number = 0;
  @Input() isLoading: boolean = false;
  @Input() error: string | null = null;
  @Input() showStats: boolean = true;
  @Input() compact: boolean = false;

  // Convert AnalyzedCharacter[] to CharacterDTO[] for CharacterExplorer
  get analysisCharacters(): CharacterDTO[] {
    return this.analysisResults.map(
      result =>
        ({
          id: result.charData?.id || 0,
          character: result.char,
          pinyin: result.charData?.pinyin || '',
          definition: result.charData?.definition || '',
          freq: result.charData?.freq,
          lastReviewDate: result.known ? new Date() : undefined,
          // Add other required CharacterDTO properties with defaults
          easinessFactor: result.charData?.easinessFactor || 0,
          repetitions: result.charData?.repetitions || 0,
          interval: result.charData?.interval || 0,
          dueForReview: false,
          nextReviewDate: undefined,
          initial: result.charData?.initial || '',
          final: result.charData?.final || '',
          toneNumber: result.charData?.toneNumber || '',
          imgUrl: result.charData?.imgUrl || '',
          movie: result.charData?.movie || '',
          radicals: result.charData?.radicals || [],
          initialActor: result.charData?.initialActor || null,
          finalSet: result.charData?.finalSet || null,
        } as CharacterDTO)
    );
  }
}
