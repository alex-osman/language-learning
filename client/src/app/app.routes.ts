import { Routes } from '@angular/router';
import { CharactersPageComponent } from './characters-page/characters-page.component';
import { EpisodeGalleryComponent } from './components/episode-gallery/episode-gallery.component';
import { EpisodeOverviewComponent } from './components/episode-overview/episode-overview.component';
import { FlashcardsComponent } from './components/flashcards/flashcards.component';
import { FrenchInteractiveComponent } from './components/french-interactive/french-interactive.component';
import { InteractiveComponent } from './components/interactive/interactive.component';
import { LearningComponent } from './components/learning/learning.component';
import { LoginComponent } from './components/login/login.component';
import { MediaGalleryComponent } from './components/media-gallery/media-gallery.component';
import { MemoryPalaceComponent } from './components/memory-palace/memory-palace.component';
import { ProfileComponent } from './components/profile/profile.component';
// Scene components removed - episodes now connect directly to sentences
import { SentenceDisplayComponent } from './components/sentence-display/sentence-display.component';
import { SentenceFlashcardComponent } from './components/sentence-flashcard/sentence-flashcard.component';
import { RandomSentenceFlashcardComponent } from './components/random-sentence-flashcard/random-sentence-flashcard.component';
import { SentenceGalleryComponent } from './components/sentence-gallery/sentence-gallery.component';
import { VideoPlayerComponent } from './components/video-player/video-player.component';
import { CharacterConnectionsComponent } from './components/character-connections/character-connections.component';
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
    path: 'characters',
    component: CharactersPageComponent,
  },
  {
    path: 'character-connections',
    component: CharacterConnectionsComponent,
    title: 'Character Connections',
  },
  {
    path: 'flashcards',
    component: FlashcardsComponent,
  },
  {
    path: 'sentence-flashcard/:episodeId',
    component: SentenceFlashcardComponent,
    title: 'Sentence Practice',
  },
  {
    path: 'random-sentence-flashcard',
    component: RandomSentenceFlashcardComponent,
    title: 'Random Sentence Practice',
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
    path: 'media/:mediaId/episodes',
    component: EpisodeGalleryComponent,
  },
  {
    path: 'media/:mediaId/episodes/:episodeId',
    component: EpisodeOverviewComponent,
  },
  {
    path: 'media/:mediaId/episodes/:episodeId/video',
    component: VideoPlayerComponent,
  },
  {
    path: 'media/:mediaId/episodes/:episodeId/sentences',
    component: SentenceGalleryComponent,
  },
  {
    path: '',
    redirectTo: '/profile',
    pathMatch: 'full',
  },
  {
    path: '**',
    redirectTo: '/memory-palace',
  },
];
