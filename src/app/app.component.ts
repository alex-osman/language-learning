import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SentenceDisplayComponent } from './components/sentence-display/sentence-display.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, SentenceDisplayComponent],
  template: `
    <app-sentence-display></app-sentence-display>
  `,
  styles: [],
})
export class AppComponent {
  title = 'chinois';
}
