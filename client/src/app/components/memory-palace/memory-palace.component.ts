import { CommonModule } from '@angular/common';
import { Component, OnDestroy } from '@angular/core';
import { ActorsComponent } from '../actors/actors.component';
import { CharactersComponent } from '../characters/characters.component';
import { RadicalsComponent } from '../radicals/radicals.component';
import { SetsComponent } from '../sets/sets.component';
import { AddRadicalPropComponent } from '../add-radical-prop/add-radical-prop.component';
import { WordsComponent } from '../words/words.component';
import { SentenceAnalyzerComponent } from '../sentence-analyzer/sentence-analyzer.component';
import { PodcastService } from '../../services/podcast.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-memory-palace',
  standalone: true,
  imports: [
    CommonModule,
    ActorsComponent,
    SetsComponent,
    CharactersComponent,
    RadicalsComponent,
    AddRadicalPropComponent,
    WordsComponent,
    SentenceAnalyzerComponent,
  ],
  template: `
    <div class="memory-palace">
      <div class="section-container podcast-section">
        <div class="section-header">
          <h2>🎙️ Chinese Learning Podcast</h2>
        </div>
        <div class="section-content">
          <div class="podcast-controls">
            <p class="podcast-description">
              Generate a personalized Chinese learning podcast with your hard words review and
              character previews.
              <br />
              <small
                ><strong>Note:</strong> Generation takes about 30-40 seconds. Please be
                patient!</small
              >
            </p>

            <div *ngIf="todayDate" class="podcast-status">
              <p class="status-text" [class.cached]="todayPodcastExists">
                <span *ngIf="todayPodcastExists">✅</span>
                <span *ngIf="!todayPodcastExists">📅</span>
                {{ todayPodcastExists ? 'Todays podcast is ready' : 'No podcast for today yet' }}
                <span class="date-info">({{ todayDate }})</span>
              </p>
            </div>

            <button
              class="podcast-btn"
              [class.generating]="isGeneratingPodcast"
              [disabled]="isGeneratingPodcast"
              (click)="generatePodcast()"
              [title]="
                todayPodcastExists
                  ? 'Download todays cached podcast'
                  : 'Generate and download todays podcast'
              "
            >
              <span *ngIf="!isGeneratingPodcast">
                <span *ngIf="todayPodcastExists">📥</span>
                <span *ngIf="!todayPodcastExists">🎙️</span>
                {{ todayPodcastExists ? 'Download Podcast' : 'Generate Podcast' }}
              </span>
              <span *ngIf="isGeneratingPodcast">
                <span class="spinner"></span>
                Generating... ({{ generationTimeElapsed }}s)
              </span>
            </button>
            <div *ngIf="isGeneratingPodcast" class="progress-info">
              <div class="progress-bar">
                <div class="progress-fill" [style.width.%]="generationProgress"></div>
              </div>
              <p class="progress-text">Building your personalized Chinese learning content...</p>
            </div>
            <div
              *ngIf="lastGenerationResult"
              class="result-message"
              [class.success]="lastGenerationResult.success"
              [class.error]="!lastGenerationResult.success"
            >
              <span *ngIf="lastGenerationResult.success">
                <span *ngIf="lastGenerationResult.cached">✅</span>
                <span *ngIf="!lastGenerationResult.cached">🎙️</span>
                {{
                  lastGenerationResult.cached
                    ? 'Cached podcast downloaded successfully!'
                    : 'New podcast generated and downloaded!'
                }}
                Check your downloads.
              </span>
              <span *ngIf="!lastGenerationResult.success"
                >❌ Failed to generate podcast. Please try again.</span
              >
            </div>
          </div>
        </div>
      </div>

      <div class="section-container">
        <div class="section-header">
          <h2>Sentence Analyzer</h2>
        </div>
        <div class="section-content">
          <app-sentence-analyzer></app-sentence-analyzer>
        </div>
      </div>

      <div class="section-container">
        <div class="section-header" (click)="toggleSection('addRadicalProp')">
          <h2>Add Radical Props</h2>
          <span class="toggle-icon">{{ visibleSections.addRadicalProp ? '▼' : '►' }}</span>
        </div>
        <div class="section-content" [class.hidden]="!visibleSections.addRadicalProp">
          <app-add-radical-prop></app-add-radical-prop>
        </div>
      </div>

      <div class="section-container">
        <div class="section-header" (click)="toggleSection('characters')">
          <h2>Characters</h2>
          <span class="toggle-icon">{{ visibleSections.characters ? '▼' : '►' }}</span>
        </div>
        <div class="section-content" [class.hidden]="!visibleSections.characters">
          <app-characters></app-characters>
        </div>
      </div>

      <div class="section-container">
        <div class="section-header" (click)="toggleSection('words')">
          <h2>Words</h2>
          <span class="toggle-icon">{{ visibleSections.words ? '▼' : '►' }}</span>
        </div>
        <div class="section-content" [class.hidden]="!visibleSections.words">
          <app-words></app-words>
        </div>
      </div>

      <div class="section-container">
        <div class="section-header" (click)="toggleSection('radicals')">
          <h2>Radicals</h2>
          <span class="toggle-icon">{{ visibleSections.radicals ? '▼' : '►' }}</span>
        </div>
        <div class="section-content" [class.hidden]="!visibleSections.radicals">
          <app-radicals></app-radicals>
        </div>
      </div>

      <div class="section-container">
        <div class="section-header" (click)="toggleSection('actors')">
          <h2>Actors</h2>
          <span class="toggle-icon">{{ visibleSections.actors ? '▼' : '►' }}</span>
        </div>
        <div class="section-content" [class.hidden]="!visibleSections.actors">
          <app-actors></app-actors>
        </div>
      </div>

      <div class="section-container">
        <div class="section-header" (click)="toggleSection('sets')">
          <h2>Sets</h2>
          <span class="toggle-icon">{{ visibleSections.sets ? '▼' : '►' }}</span>
        </div>
        <div class="section-content" [class.hidden]="!visibleSections.sets">
          <app-sets></app-sets>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .memory-palace {
        padding: 2rem;
        max-width: 1200px;
        margin: 0 auto;
      }

      .section-container {
        margin-bottom: 2rem;
        border: 1px solid #e0e0e0;
        border-radius: 8px;
        overflow: hidden;
      }

      .podcast-section {
        border: 2px solid #e67e22;
        background: linear-gradient(135deg, #fff5f0 0%, #ffeee6 100%);
      }

      .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem;
        background-color: #f5f5f5;
        cursor: pointer;
        transition: background-color 0.2s;
      }

      .podcast-section .section-header {
        background: linear-gradient(135deg, #e67e22 0%, #d68910 100%);
        color: white;
        cursor: default;
      }

      .section-header:hover {
        background-color: #e0e0e0;
      }

      .podcast-section .section-header:hover {
        background: linear-gradient(135deg, #e67e22 0%, #d68910 100%);
      }

      .section-header h2 {
        margin: 0;
        font-size: 1.25rem;
        color: #333;
      }

      .podcast-section .section-header h2 {
        color: white;
      }

      .toggle-icon {
        font-size: 1rem;
        color: #666;
      }

      .section-content {
        padding: 1rem;
        background-color: #fff;
        transition: max-height 0.3s ease-out;
      }

      .section-content.hidden {
        display: none;
      }

      .podcast-controls {
        text-align: center;
      }

      .podcast-description {
        margin-bottom: 1.5rem;
        color: #555;
        line-height: 1.6;
      }

      .podcast-description small {
        color: #e67e22;
        font-weight: 600;
      }

      .podcast-status {
        margin-bottom: 1.5rem;
        text-align: center;
      }

      .status-text {
        margin: 0;
        padding: 0.75rem 1rem;
        border-radius: 6px;
        font-weight: 500;
        background-color: #f8f9fa;
        border: 1px solid #e9ecef;
        color: #6c757d;
        transition: all 0.3s ease;
      }

      .status-text.cached {
        background-color: #d4edda;
        border-color: #c3e6cb;
        color: #155724;
      }

      .date-info {
        font-size: 0.9rem;
        opacity: 0.8;
        margin-left: 0.5rem;
      }

      .podcast-btn {
        background: linear-gradient(135deg, #e67e22 0%, #d68910 100%);
        color: white;
        border: none;
        padding: 1rem 2rem;
        border-radius: 8px;
        cursor: pointer;
        font-size: 1.1rem;
        font-weight: 600;
        transition: all 0.3s ease;
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        min-width: 200px;
        justify-content: center;
        box-shadow: 0 4px 12px rgba(230, 126, 34, 0.3);
      }

      .podcast-btn:hover:not(:disabled) {
        background: linear-gradient(135deg, #d68910 0%, #b7791f 100%);
        transform: translateY(-2px);
        box-shadow: 0 6px 16px rgba(230, 126, 34, 0.4);
      }

      .podcast-btn:active {
        transform: translateY(0);
      }

      .podcast-btn:disabled {
        background: linear-gradient(135deg, #95a5a6 0%, #7f8c8d 100%);
        cursor: not-allowed;
        opacity: 0.8;
        transform: none;
        box-shadow: 0 2px 8px rgba(149, 165, 166, 0.3);
      }

      .spinner {
        width: 16px;
        height: 16px;
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-top: 2px solid white;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        display: inline-block;
        margin-right: 0.5rem;
      }

      .progress-info {
        margin-top: 1.5rem;
        text-align: center;
      }

      .progress-bar {
        width: 100%;
        height: 8px;
        background-color: #ecf0f1;
        border-radius: 4px;
        overflow: hidden;
        margin-bottom: 0.5rem;
      }

      .progress-fill {
        height: 100%;
        background: linear-gradient(90deg, #e67e22 0%, #f39c12 100%);
        border-radius: 4px;
        transition: width 0.3s ease;
      }

      .progress-text {
        color: #7f8c8d;
        font-size: 0.9rem;
        margin: 0;
      }

      .result-message {
        margin-top: 1rem;
        padding: 0.75rem 1rem;
        border-radius: 6px;
        font-weight: 500;
        animation: fadeIn 0.3s ease;
      }

      .result-message.success {
        background-color: #d4edda;
        color: #155724;
        border: 1px solid #c3e6cb;
      }

      .result-message.error {
        background-color: #f8d7da;
        color: #721c24;
        border: 1px solid #f5c6cb;
      }

      @keyframes spin {
        0% {
          transform: rotate(0deg);
        }
        100% {
          transform: rotate(360deg);
        }
      }

      @keyframes fadeIn {
        from {
          opacity: 0;
          transform: translateY(-10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
    `,
  ],
})
export class MemoryPalaceComponent implements OnDestroy {
  isGeneratingPodcast = false;
  generationTimeElapsed = 0;
  generationProgress = 0;
  lastGenerationResult: { success: boolean; cached?: boolean } | null = null;
  todayPodcastExists = false;
  todayDate = '';

  private generationTimer: any;
  private completionSubscription: Subscription | null = null;

  visibleSections = {
    addRadicalProp: false,
    characters: true,
    words: true,
    radicals: true,
    actors: true,
    sets: true,
  };

  constructor(private podcastService: PodcastService) {
    // Subscribe to generation completion events
    this.completionSubscription = this.podcastService.onGenerationComplete.subscribe(success => {
      this.onGenerationComplete(success);
    });

    // Check if today's podcast exists on component initialization
    this.checkTodayPodcast();
  }

  ngOnDestroy(): void {
    if (this.completionSubscription) {
      this.completionSubscription.unsubscribe();
    }
    this.resetGenerationState();
  }

  toggleSection(section: keyof typeof this.visibleSections) {
    this.visibleSections[section] = !this.visibleSections[section];
  }

  private checkTodayPodcast(): void {
    this.podcastService.checkTodayPodcastExists().subscribe({
      next: status => {
        this.todayPodcastExists = status.exists;
        this.todayDate = status.date;
        console.log(`📅 Today's podcast (${status.date}) exists: ${status.exists}`);
      },
      error: error => {
        console.error("❌ Error checking today's podcast:", error);
        this.todayPodcastExists = false;
      },
    });
  }

  generatePodcast(): void {
    if (this.isGeneratingPodcast) return;

    this.isGeneratingPodcast = true;
    this.generationTimeElapsed = 0;
    this.generationProgress = 0;
    this.lastGenerationResult = null;

    console.log('🎙️ Starting podcast generation...');

    // Start progress simulation
    this.startProgressTimer();

    this.podcastService.generateAndDownloadPodcast();
  }

  private onGenerationComplete(success: boolean): void {
    this.generationProgress = 100;

    // Check if this was a cached podcast
    const wasCached = this.todayPodcastExists;
    this.lastGenerationResult = { success, cached: wasCached };

    // Update the cached status
    this.todayPodcastExists = true;

    // Small delay to show 100% progress
    setTimeout(() => {
      this.resetGenerationState();

      // Clear the result message after 5 seconds
      setTimeout(() => {
        this.lastGenerationResult = null;
      }, 5000);
    }, 500);
  }

  private startProgressTimer(): void {
    this.generationTimer = setInterval(() => {
      this.generationTimeElapsed++;

      // Simulate progress - accelerate initially, then slow down
      if (this.generationTimeElapsed <= 10) {
        this.generationProgress = this.generationTimeElapsed * 5; // 5% per second for first 10 seconds (50%)
      } else if (this.generationTimeElapsed <= 30) {
        this.generationProgress = 50 + (this.generationTimeElapsed - 10) * 2; // 2% per second for next 20 seconds (40%)
      } else {
        this.generationProgress = 90 + (this.generationTimeElapsed - 30) * 0.5; // 0.5% per second after 30 seconds (slow down)
      }

      // Cap at 98% to avoid showing 100% before completion
      if (this.generationProgress > 98) {
        this.generationProgress = 98;
      }
    }, 1000);
  }

  private resetGenerationState(): void {
    this.isGeneratingPodcast = false;
    this.generationTimeElapsed = 0;
    this.generationProgress = 0;

    if (this.generationTimer) {
      clearInterval(this.generationTimer);
      this.generationTimer = null;
    }
  }
}
