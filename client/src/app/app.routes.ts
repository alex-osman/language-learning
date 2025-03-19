import { Routes } from '@angular/router';
import { SentenceDisplayComponent } from './components/sentence-display/sentence-display.component';
import { InteractiveComponent } from './components/interactive/interactive.component';

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
    path: '',
    redirectTo: '/sentences',
    pathMatch: 'full',
  },
  {
    path: '**',
    redirectTo: '/sentences',
  },
];
