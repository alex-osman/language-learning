import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SentenceDisplayComponent } from './components/sentence-display/sentence-display.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, SentenceDisplayComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'chinois';
}
