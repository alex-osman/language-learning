import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AnalyzedCharacter } from '../../services/sentence-analysis.service';

@Component({
  selector: 'app-character-analysis',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './character-analysis.component.html',
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
}
