import { Routes } from '@angular/router';
import { SentenceDisplayComponent } from './components/sentence-display/sentence-display.component';
import { InteractiveComponent } from './components/interactive/interactive.component';
import { FrenchInteractiveComponent } from './components/french-interactive/french-interactive.component';
import { MemoryPalaceComponent } from './components/memory-palace/memory-palace.component';
import { FlashcardsComponent } from './components/flashcards/flashcards.component';
import { SentenceGalleryComponent } from './components/sentence-gallery/sentence-gallery.component';
import { LearningComponent } from './components/learning/learning.component';
import { MediaGalleryComponent } from './components/media-gallery/media-gallery.component';
import { SeasonGalleryComponent } from './components/season-gallery/season-gallery.component';
import { EpisodeGalleryComponent } from './components/episode-gallery/episode-gallery.component';
import { SceneGalleryComponent } from './components/scene-gallery/scene-gallery.component';

export const routes: Routes = [
  {
    path: 'sentences',
    component: SentenceDisplayComponent,
  },
  {
    path: 'interactive',
    component: InteractiveComponent,
  },
  {
    path: 'french',
    component: FrenchInteractiveComponent,
  },
  {
    path: 'memory-palace',
    component: MemoryPalaceComponent,
  },
  {
    path: 'flashcards',
    component: FlashcardsComponent,
  },
  {
    path: 'sentence-gallery',
    component: SentenceGalleryComponent,
  },
  {
    path: 'learning',
    component: LearningComponent,
  },
  // Hierarchical gallery routes
  {
    path: 'media',
    component: MediaGalleryComponent,
  },
  {
    path: 'media/:mediaId/seasons',
    component: SeasonGalleryComponent,
  },
  {
    path: 'media/:mediaId/seasons/:seasonId/episodes',
    component: EpisodeGalleryComponent,
  },
  {
    path: 'media/:mediaId/seasons/:seasonId/episodes/:episodeId/scenes',
    component: SceneGalleryComponent,
  },
  {
    path: 'media/:mediaId/seasons/:seasonId/episodes/:episodeId/scenes/:sceneId/sentences',
    component: SentenceGalleryComponent,
  },
  {
    path: '',
    redirectTo: '/flashcards',
    pathMatch: 'full',
  },
  {
    path: '**',
    redirectTo: '/flashcards',
  },
];
