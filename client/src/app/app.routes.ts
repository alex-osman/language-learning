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
import { EpisodeOverviewComponent } from './components/episode-overview/episode-overview.component';
import { SceneGalleryComponent } from './components/scene-gallery/scene-gallery.component';
import { SceneOverviewComponent } from './components/scene-overview/scene-overview.component';
import { SentenceFlashcardComponent } from './components/sentence-flashcard/sentence-flashcard.component';
import { LoginComponent } from './components/login/login.component';
import { ProfileComponent } from './components/profile/profile.component';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent,
  },
  {
    path: 'profile',
    component: ProfileComponent,
    canActivate: [authGuard],
  },
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
    path: 'sentence-flashcard/:sceneId',
    component: SentenceFlashcardComponent,
    title: 'Sentence Practice',
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
    path: 'media/:mediaId/seasons/:seasonId/episodes/:episodeId',
    component: EpisodeOverviewComponent,
  },
  {
    path: 'media/:mediaId/seasons/:seasonId/episodes/:episodeId/scenes',
    component: SceneGalleryComponent,
  },
  {
    path: 'media/:mediaId/seasons/:seasonId/episodes/:episodeId/scenes/:sceneId',
    component: SceneOverviewComponent,
  },
  {
    path: 'media/:mediaId/seasons/:seasonId/episodes/:episodeId/scenes/:sceneId/sentences',
    component: SentenceGalleryComponent,
  },
  {
    path: '',
    redirectTo: '/login',
    pathMatch: 'full',
  },
  {
    path: '**',
    redirectTo: '/memory-palace',
  },
];
