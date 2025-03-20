import { Routes } from '@angular/router';
import { SentenceDisplayComponent } from './components/sentence-display/sentence-display.component';
import { InteractiveComponent } from './components/interactive/interactive.component';
import { FrenchInteractiveComponent } from './components/french-interactive/french-interactive.component';

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
    path: '',
    redirectTo: '/sentences',
    pathMatch: 'full',
  },
  {
    path: '**',
    redirectTo: '/sentences',
  },
];
