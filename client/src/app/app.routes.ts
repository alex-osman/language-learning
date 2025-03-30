import { Routes } from '@angular/router';
import { SentenceDisplayComponent } from './components/sentence-display/sentence-display.component';
import { InteractiveComponent } from './components/interactive/interactive.component';
import { FrenchInteractiveComponent } from './components/french-interactive/french-interactive.component';
import { MemoryPalaceComponent } from './components/memory-palace/memory-palace.component';
import { PhoneticChartComponent } from './components/phonetic-chart/phonetic-chart.component';
import { FlashcardsComponent } from './components/flashcards/flashcards.component';

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
    path: 'phonetics',
    component: PhoneticChartComponent,
  },
  {
    path: 'flashcards',
    component: FlashcardsComponent,
  },
  {
    path: '',
    redirectTo: '/sentences',
    pathMatch: 'full',
  },
  {
    path: '**',
    redirectTo: '/flashcards',
  },
];
