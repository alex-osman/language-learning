import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  SentenceAnalysisService,
  SentenceAnalysisResult,
  AnalyzedCharacter,
} from '../../services/sentence-analysis.service';
import { EasinessColorService } from '../../services/easiness-color.service';
import { CharacterStylingUtils } from '../../services/character-styling.utils';
import { Subject, debounceTime, distinctUntilChanged, filter } from 'rxjs';

@Component({
  selector: 'app-sentence-analyzer',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './sentence-analyzer.component.html',
  styleUrls: ['./sentence-analyzer.component.scss'],
})
export class SentenceAnalyzerComponent implements OnInit {
  inputText: string = '';
  analysisResults: AnalyzedCharacter[] = [];
  totalCharacters: number = 0;
  knownCharacters: number = 0;
  unknownCharacters: number = 0;
  knownPercentage: number = 0;
  isLoading: boolean = false;
  error: string | null = null;

  private textInput$ = new Subject<string>();

  constructor(
    private sentenceAnalysisService: SentenceAnalysisService,
    private easinessColorService: EasinessColorService
  ) {}

  ngOnInit() {
    // Set up the text input stream with debouncing and filtering
    this.textInput$
      .pipe(
        debounceTime(300), // Wait 300ms after the last keystroke
        distinctUntilChanged((prev, curr) => {
          // Remove whitespace, punctuation, and non-Chinese characters for comparison
          const cleanPrev = prev.replace(/[\s\p{P}\p{S}]/gu, '').replace(/[^\u4e00-\u9fff]/g, '');
          const cleanCurr = curr.replace(/[\s\p{P}\p{S}]/gu, '').replace(/[^\u4e00-\u9fff]/g, '');
          return cleanPrev === cleanCurr;
        }),
        filter(text => {
          // Only emit if there are Chinese characters
          const chineseChars = text
            .replace(/[\s\p{P}\p{S}]/gu, '')
            .replace(/[^\u4e00-\u9fff]/g, '');
          return chineseChars.length > 0;
        })
      )
      .subscribe(text => {
        this.analyzeText(text);
      });
  }

  onTextChange(text: string) {
    this.textInput$.next(text);

    // Clear results if there are no Chinese characters
    const chineseChars = text.replace(/[\s\p{P}\p{S}]/gu, '').replace(/[^\u4e00-\u9fff]/g, '');
    if (!chineseChars) {
      this.analysisResults = [];
      this.totalCharacters = 0;
      this.knownCharacters = 0;
      this.unknownCharacters = 0;
      this.knownPercentage = 0;
    }
  }

  private analyzeText(text: string) {
    this.isLoading = true;
    this.error = null;

    this.sentenceAnalysisService.analyzeSentence(text).subscribe({
      next: (analysis: SentenceAnalysisResult) => {
        this.analysisResults = analysis.all_characters;
        this.totalCharacters = analysis.total_characters;
        this.knownCharacters = analysis.known_count;
        this.unknownCharacters = analysis.unknown_count;
        this.knownPercentage = analysis.known_percent;
        this.isLoading = false;
      },
      error: error => {
        console.error('Error analyzing text:', error);
        this.error = 'Failed to analyze text. Please try again.';
        this.isLoading = false;
      },
    });
  }

  // Easiness gradient styling method with original border behavior
  getEasinessGradientStyle(result: AnalyzedCharacter): { [key: string]: string } {
    const gradientStyle = CharacterStylingUtils.getEasinessGradientStyle(
      this.easinessColorService,
      result
    );

    // Override border color to preserve original known/unknown behavior
    if (result.known) {
      gradientStyle['border-color'] = '#90ee90'; // Original green border for known
    } else {
      gradientStyle['border-color'] = '#ffb6c1'; // Original red border for unknown
    }

    return gradientStyle;
  }
}
