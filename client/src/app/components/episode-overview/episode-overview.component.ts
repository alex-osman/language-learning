import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MediaService, Episode, EpisodeDTO } from '../../services/media.service';
import {
  SentenceAnalysisResult,
  EnhancedSentenceAnalysisResult,
  SentenceAnalysisService,
} from '../../services/sentence-analysis.service';
import {
  ProgressIndicatorComponent,
  ProgressSegment,
} from '../progress-indicator/progress-indicator.component';
import { EpisodeCharactersComponent } from '../episode-characters/episode-characters.component';

interface EpisodeOverviewData {
  title: string;
  assetUrl: string;
  percentUnderstood: number;
  totalSentencesCount: number;
  progressSegments: ProgressSegment[];
  learnedCount: number;
  seenCount: number;
  unknownCount: number;
}

@Component({
  selector: 'app-episode-overview',
  standalone: true,
  imports: [CommonModule, ProgressIndicatorComponent, EpisodeCharactersComponent],
  templateUrl: './episode-overview.component.html',
  styleUrl: './episode-overview.component.scss',
})
export class EpisodeOverviewComponent implements OnInit {
  // Route parameters
  mediaId: string = '';
  episodeId: number = 0;

  // Component state
  episode: EpisodeDTO | null = null;
  isLoading = true;
  error: string | null = null;
  sentenceAnalysisData: { [sentenceId: string]: SentenceAnalysisResult } = {};
  enhancedAnalysisData: { [sentenceId: string]: EnhancedSentenceAnalysisResult } = {};

  // UI state
  isCharactersCollapsed = true;
  isSentenceGalleryCollapsed = true;
  // Template helpers
  Math = Math;

  // Video reference
  @ViewChild('episodeVideo') episodeVideo!: ElementRef<HTMLVideoElement>;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private mediaService: MediaService,
    private sentenceAnalysisService: SentenceAnalysisService
  ) {}

  ngOnInit() {
    this.extractRouteParameters();
  }

  // ===== COMPUTED PROPERTIES =====

  get episodeData(): EpisodeOverviewData | null {
    if (!this.episode) return null;

    const actualProgress = this.calculateActualProgress();
    const progressSegments = this.calculateProgressSegments();

    return {
      title: this.episode.title,
      assetUrl: this.episode.assetUrl,
      percentUnderstood: actualProgress.percentKnown,
      totalSentencesCount: this.getTotalSentenceCount(),
      progressSegments: progressSegments.filter(segment => segment.label !== 'unknown'),
      learnedCount: actualProgress.learnedCharacters,
      seenCount: actualProgress.seenCharacters,
      unknownCount: actualProgress.unknownCharacters,
    };
  }

  // ===== INITIALIZATION =====
  toggleCharacters() {
    this.isCharactersCollapsed = !this.isCharactersCollapsed;
  }

  toggleSentenceGallery() {
    this.isSentenceGalleryCollapsed = !this.isSentenceGalleryCollapsed;
  }

  private extractRouteParameters() {
    this.route.params.subscribe(params => {
      this.mediaId = params['mediaId'] || '';
      this.episodeId = params['episodeId'] || '';

      if (this.hasValidRouteParameters()) {
        this.loadEpisodeData();
      } else {
        this.handleRouteError();
      }
    });
  }

  private hasValidRouteParameters(): boolean {
    return !!(this.mediaId && this.episodeId);
  }

  private handleRouteError() {
    this.error = 'Missing required route parameters.';
    this.isLoading = false;
  }

  // ===== DATA LOADING =====

  private loadEpisodeData() {
    this.isLoading = true;
    this.error = null;

    this.mediaService.getEpisodeWithSentences(this.episodeId).subscribe({
      next: episodeData => this.handleEpisodeLoaded(episodeData),
      error: err => this.handleEpisodeLoadError(err),
    });
  }

  private handleEpisodeLoaded(episodeData: EpisodeDTO) {
    this.episode = episodeData;
    this.isLoading = false;
    this.startSentenceAnalysis();
  }

  private handleEpisodeLoadError(err: any) {
    console.error('Error loading episode:', err);
    this.error = 'Failed to load episode data.';
    this.isLoading = false;
  }

  // ===== SENTENCE ANALYSIS =====

  private startSentenceAnalysis() {
    if (!this.episode) return;

    // Clear existing analysis data
    this.sentenceAnalysisData = {};
    this.enhancedAnalysisData = {};

    const allSentences = this.episode.sentences || [];

    if (allSentences.length === 0) return;

    const texts = allSentences.map(sentence => sentence.sentence);

    // update the sentence ids in the sentenceAnalysisData
    // this.sentenceAnalysisService
    //   .analyzeSentenceIds(allSentences.map(sentence => sentence.id))
    //   .subscribe(x => console.log('got response from analysis thing - ', x));

    // Use batch enhanced analysis for better performance
    this.sentenceAnalysisService.analyzeTextsWithKnowledgeStatus(texts).subscribe({
      next: (results: EnhancedSentenceAnalysisResult[]) => {
        this.handleBatchAnalysisResults(results, allSentences);
      },
      error: err => {
        console.error('Enhanced batch analysis failed:', err);
        // Fallback to batch basic analysis
        this.sentenceAnalysisService.analyzeSentences(texts).subscribe({
          next: (results: SentenceAnalysisResult[]) => {
            this.handleBasicBatchAnalysisResults(results, allSentences);
          },
          error: err => {
            console.error('Basic batch analysis failed, falling back to individual:', err);
            this.fallbackToIndividualAnalysis(allSentences);
          },
        });
      },
    });
  }

  private handleBatchAnalysisResults(
    results: EnhancedSentenceAnalysisResult[],
    allSentences: any[]
  ) {
    results.forEach((result, index) => {
      if (allSentences[index]) {
        this.enhancedAnalysisData[allSentences[index].id] = result;
      }
    });
  }

  private handleBasicBatchAnalysisResults(results: SentenceAnalysisResult[], allSentences: any[]) {
    results.forEach((result, index) => {
      if (allSentences[index]) {
        this.sentenceAnalysisData[allSentences[index].id] = result;
      }
    });
  }

  private fallbackToIndividualAnalysis(allSentences: any[]) {
    // Use individual analysis as last resort
    allSentences.forEach(sentence => {
      this.sentenceAnalysisService.analyzeTextWithKnowledgeStatus(sentence.sentence).subscribe({
        next: (analysis: EnhancedSentenceAnalysisResult) => {
          this.enhancedAnalysisData[sentence.id] = analysis;
        },
        error: err => {
          console.error(`Enhanced analysis failed for sentence ${sentence.id}:`, err);
          // Fallback to basic analysis
          this.sentenceAnalysisService.analyzeSentence(sentence.sentence).subscribe({
            next: (analysis: SentenceAnalysisResult) => {
              this.sentenceAnalysisData[sentence.id] = analysis;
            },
            error: err => {
              console.error(`Fallback analysis failed for sentence ${sentence.id}:`, err);
            },
          });
        },
      });
    });
  }

  // ===== CALCULATIONS =====

  private calculateActualProgress(): {
    percentKnown: number;
    knownCharacters: number;
    totalCharacters: number;
    learnedCharacters: number;
    seenCharacters: number;
    unknownCharacters: number;
  } {
    if (!this.episode || !this.hasEnhancedAnalysisData()) {
      return {
        percentKnown: 0,
        knownCharacters: 0,
        totalCharacters: 0,
        learnedCharacters: 0,
        seenCharacters: 0,
        unknownCharacters: 0,
      };
    }

    const { totalLearnedCharacters, totalSeenCharacters, totalUnknownCharacters, totalCharacters } =
      this.aggregateEnhancedAnalysisData();

    if (totalCharacters === 0) {
      return {
        percentKnown: 0,
        knownCharacters: 0,
        totalCharacters: 0,
        learnedCharacters: 0,
        seenCharacters: 0,
        unknownCharacters: 0,
      };
    }

    const knownCharacters = totalLearnedCharacters + totalSeenCharacters;
    const percentKnown = Math.round((knownCharacters / totalCharacters) * 100);

    return {
      percentKnown,
      knownCharacters,
      totalCharacters,
      learnedCharacters: totalLearnedCharacters,
      seenCharacters: totalSeenCharacters,
      unknownCharacters: totalUnknownCharacters,
    };
  }

  private hasEnhancedAnalysisData(): boolean {
    if (!this.episode) return false;

    const allSentences = this.episode.sentences || [];
    return (
      allSentences.length > 0 &&
      allSentences.every(sentence => this.enhancedAnalysisData[sentence.id] !== undefined)
    );
  }

  private aggregateEnhancedAnalysisData(): {
    totalLearnedCharacters: number;
    totalSeenCharacters: number;
    totalUnknownCharacters: number;
    totalCharacters: number;
  } {
    // Use Sets to track unique characters by status
    const learnedChars = new Set<string>();
    const seenChars = new Set<string>();
    const unknownChars = new Set<string>();

    if (this.episode!.sentences) {
      this.episode!.sentences.forEach(sentence => {
        const analysis = this.enhancedAnalysisData[sentence.id];
        if (analysis) {
          // Add unique characters to appropriate sets
          analysis.learned_characters.forEach(char => learnedChars.add(char));
          analysis.seen_characters.forEach(char => seenChars.add(char));
          analysis.unknown_characters.forEach(char => unknownChars.add(char));
        }
      });
    }

    const totalLearnedCharacters = learnedChars.size;
    const totalSeenCharacters = seenChars.size;
    const totalUnknownCharacters = unknownChars.size;
    const totalCharacters = totalLearnedCharacters + totalSeenCharacters + totalUnknownCharacters;

    return { totalLearnedCharacters, totalSeenCharacters, totalUnknownCharacters, totalCharacters };
  }

  private getTotalSentenceCount(): number {
    if (!this.episode) return 0;

    return this.episode.sentences?.length || 0;
  }

  private calculateProgressSegments(): ProgressSegment[] {
    const progress = this.calculateActualProgress();

    if (progress.totalCharacters === 0) {
      return [];
    }

    const learnedPercent = Math.round(
      (progress.learnedCharacters / progress.totalCharacters) * 100
    );
    const seenPercent = Math.round((progress.seenCharacters / progress.totalCharacters) * 100);
    const unknownPercent = Math.round(
      (progress.unknownCharacters / progress.totalCharacters) * 100
    );

    const segments: ProgressSegment[] = [];

    if (learnedPercent > 0) {
      segments.push({
        value: learnedPercent,
        color: '#28a745', // Green for learned
        label: 'learned',
      });
    }

    if (seenPercent > 0) {
      segments.push({
        value: seenPercent,
        color: '#17a2b8', // Cyan for seen
        label: 'seen',
      });
    }

    if (unknownPercent > 0) {
      segments.push({
        value: unknownPercent,
        color: '#dc3545', // Red for unknown
        label: 'unknown',
      });
    }

    return segments;
  }

  // ===== UI UPDATES =====

  // ===== USER ACTIONS =====

  goBack() {
    this.router.navigate(['../'], { relativeTo: this.route });
  }

  startPractice() {
    // Navigate directly to episode practice
    if (this.episode && this.episode.sentences && this.episode.sentences.length > 0) {
      this.router.navigate(['/sentence-flashcard', this.episodeId], {
        queryParams: {
          mediaId: this.mediaId,
          episodeId: this.episodeId,
        },
      });
    }
  }

  toggleVideoPlayPause() {
    if (this.episodeVideo?.nativeElement) {
      const video = this.episodeVideo.nativeElement;
      video.paused ? video.play() : video.pause();
    } else {
      console.warn('Video element not found');
    }
  }

  goToVideo() {
    this.router.navigate(['/media', this.mediaId, 'episodes', this.episodeId, 'video']);
  }

  getWordUnderlineStyle(sentenceId: number, char: string): { [key: string]: string } {
    const analysis = this.enhancedAnalysisData[sentenceId];
    if (!analysis) {
      return { 'border-bottom': '3px solid #999999' }; // Darker grey for unknown
    }

    const charData = analysis.all_characters.find(c => c.char === char);
    if (!charData) {
      return { 'border-bottom': '3px solid #999999' }; // Darker grey for unknown
    }

    if (charData.status !== 'learned' && charData.status !== 'learning') {
      if (charData.status === 'seen') {
        return { 'border-bottom': '3px solid #53b1ff' };
      }

      return { 'border-bottom': '3px solid #999999' }; // Darker grey for unknown
    }

    // Get color based on easiness factor if available
    if (charData.charData?.easinessFactor) {
      const color = this.getUnderlineColor(charData.charData.easinessFactor);
      return { 'border-bottom': `3px solid ${color}` };
    }

    // Fallback to green for known characters without easiness data
    return { 'border-bottom': '3px solid #2e7d32' }; // Darker green
  }

  // Specific method for underline colors with higher saturation and lower lightness
  private getUnderlineColor(easinessFactor: number): string {
    const minEasiness = 1.3;
    const maxEasiness = 2.5;

    // Normalize easiness factor
    const normalizedEasiness = Math.max(
      0,
      Math.min(1, (easinessFactor - minEasiness) / (maxEasiness - minEasiness))
    );

    // Calculate hue (red to green)
    const hue = 0 + normalizedEasiness * 120; // 0 = red, 120 = green

    // Use higher saturation and lower lightness for more vivid underlines
    const saturation = 80; // Higher saturation
    const lightness = 50; // Lower lightness for more vivid colors

    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  }

  goToTimestamp(timestamp: number) {
    if (this.episodeVideo?.nativeElement) {
      // Convert milliseconds to seconds
      const timeInSeconds = timestamp / 1000;
      this.episodeVideo.nativeElement.currentTime = timeInSeconds;

      // Pause the video if it's playing to let user see the specific moment
      this.episodeVideo.nativeElement.play();

      console.log(`Navigated to timestamp: ${timeInSeconds}s`);
    } else {
      console.warn('Video element not found');
    }
  }
}
