import { Routes } from '@angular/router';
import { SentenceDisplayComponent } from './components/sentence-display/sentence-display.component';
import { InteractiveComponent } from './components/interactive/interactive.component';
import { MemoryPalaceComponent } from './components/memory-palace/memory-palace.component';
import { PhoneticChartComponent } from './components/phonetic-chart/phonetic-chart.component';

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
    path: 'memory-palace',
    component: MemoryPalaceComponent,
  },
  {
    path: 'phonetics',
    component: PhoneticChartComponent,
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
