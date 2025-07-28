import { CommonModule } from '@angular/common';
import { Component, OnDestroy } from '@angular/core';
import { ActorsComponent } from '../actors/actors.component';
import { CharactersComponent } from '../characters/characters.component';
import { RadicalsComponent } from '../radicals/radicals.component';
import { SetsComponent } from '../sets/sets.component';
import { AddRadicalPropComponent } from '../add-radical-prop/add-radical-prop.component';
import { SentenceAnalyzerComponent } from '../sentence-analyzer/sentence-analyzer.component';
import { ProgressIndicatorComponent } from '../progress-indicator/progress-indicator.component';
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
    SentenceAnalyzerComponent,
    ProgressIndicatorComponent,
  ],
  templateUrl: './memory-palace.component.html',
  styleUrls: ['./memory-palace.component.scss'],
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
