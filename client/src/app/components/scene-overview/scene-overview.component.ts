import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { CharacterTileComponent } from '../character-tile/character-tile.component';
import { MediaService, Scene, Sentence } from '../../services/media.service';
import {
  SentenceAnalysisService,
  SentenceAnalysisResult,
} from '../../services/sentence-analysis.service';

@Component({
  selector: 'app-scene-overview',
  standalone: true,
  imports: [CommonModule, CharacterTileComponent],
  templateUrl: './scene-overview.component.html',
  styleUrl: './scene-overview.component.scss',
})
export class SceneOverviewComponent implements OnInit {
  sceneId: string = '';
  mediaId: string = '';
  seasonId: string = '';
  episodeId: string = '';

  Math = Math; // Make Math available in template

  // Data from services
  scene: Scene | null = null;
  isLoading = true;
  error: string | null = null;
  sentenceAnalysisData: { [sentenceId: string]: SentenceAnalysisResult } = {};

  // Computed properties
  get sceneData() {
    if (!this.scene) return null;

    // Calculate actual progress from sentence analysis
    const actualProgress = this.calculateActualProgress();

    return {
      title: this.scene.title,
      imageUrl: '/assets/images/peppa-pig-scene.jpg', // placeholder
      percentUnderstood: actualProgress.percentKnown,
      newSentencesCount: this.scene.sentences.length,
      uniqueCharacters: this.getUniqueCharacters(),
      sentences: this.scene.sentences.map(sentence => ({
        id: sentence.id,
        chinese: sentence.chinese,
        percentKnown: this.sentenceAnalysisData[sentence.id]?.known_percent || 0,
        status: 'new', // TODO: Get actual status from analysis
      })),
    };
  }

  // Show only first 5 characters, rest as ellipsis
  displayedCharacters: string[] = [];
  hasMoreCharacters: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private mediaService: MediaService,
    private sentenceAnalysisService: SentenceAnalysisService
  ) {}

  ngOnInit() {
    // Get route parameters
    this.route.params.subscribe(params => {
      this.mediaId = params['mediaId'] || '';
      this.seasonId = params['seasonId'] || '';
      this.episodeId = params['episodeId'] || '';
      this.sceneId = params['sceneId'] || '';

      if (!this.mediaId || !this.seasonId || !this.episodeId || !this.sceneId) {
        this.error = 'Missing required route parameters.';
        this.isLoading = false;
        return;
      }

      this.loadSceneData();
    });
  }

  private loadSceneData() {
    this.isLoading = true;
    this.error = null;

    this.mediaService
      .getScene(this.mediaId, this.seasonId, this.episodeId, this.sceneId)
      .subscribe({
        next: scene => {
          this.scene = scene;
          this.isLoading = false;
          this.updateDisplayedCharacters();
          this.analyzeProgress();
        },
        error: err => {
          console.error('Error loading scene:', err);
          this.error = 'Failed to load scene data.';
          this.isLoading = false;
        },
      });
  }

  private analyzeProgress() {
    if (!this.scene) return;

    // Analyze each sentence for progress data
    this.scene.sentences.forEach(sentence => {
      this.sentenceAnalysisService.analyzeSentence(sentence.chinese).subscribe({
        next: result => {
          this.sentenceAnalysisData[sentence.id] = result;
          // Update displayed characters when analysis completes
          this.updateDisplayedCharacters();
        },
        error: err => {
          console.error('Error analyzing sentence:', sentence.chinese, err);
        },
      });
    });
  }

  private calculateActualProgress(): {
    percentKnown: number;
    knownCharacters: number;
    totalCharacters: number;
  } {
    if (!this.scene || Object.keys(this.sentenceAnalysisData).length === 0) {
      // Return default values if no analysis data yet
      return { percentKnown: 0, knownCharacters: 0, totalCharacters: 0 };
    }

    let totalKnownCharacters = 0;
    let totalCharacters = 0;
    let analyzedSentences = 0;

    // Sum up the analysis results from all sentences
    this.scene.sentences.forEach(sentence => {
      const analysis = this.sentenceAnalysisData[sentence.id];
      if (analysis) {
        totalKnownCharacters += analysis.known_count;
        totalCharacters += analysis.total_characters;
        analyzedSentences++;
      }
    });

    // Only calculate if we have analysis data
    if (analyzedSentences === 0 || totalCharacters === 0) {
      return { percentKnown: 0, knownCharacters: 0, totalCharacters: 0 };
    }

    const percentKnown = Math.round((totalKnownCharacters / totalCharacters) * 100);

    return {
      percentKnown,
      knownCharacters: totalKnownCharacters,
      totalCharacters,
    };
  }

  private getUniqueCharacters(): string[] {
    if (!this.scene) return [];

    // Get all unique characters from all sentences
    const allText = this.scene.sentences.map(s => s.chinese).join('');
    const uniqueChars = [...new Set(allText.split(''))].filter(char =>
      // Filter out punctuation and whitespace
      /[\u4e00-\u9fff]/.test(char)
    );

    return uniqueChars;
  }

  private updateDisplayedCharacters() {
    if (!this.sceneData) return;

    this.displayedCharacters = this.sceneData.uniqueCharacters.slice(0, 5);
    this.hasMoreCharacters = this.sceneData.uniqueCharacters.length > 5;
  }

  goBack() {
    this.router.navigate(['../'], { relativeTo: this.route });
  }

  startPractice() {
    // Navigate to practice mode for this scene
    console.log('Starting practice for scene:', this.sceneId);
    // TODO: Implement navigation to practice mode
  }
}
