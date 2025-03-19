import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-language-controls',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './language-controls.component.html',
  styleUrls: ['./language-controls.component.scss']
})
export class LanguageControlsComponent {
  @Input() languages: string[] = [];
  @Input() selectedLanguages: string[] = [];
  @Output() selectedLanguagesChange = new EventEmitter<string[]>();

  selectAll() {
    const newSelection = [...this.languages];
    this.selectedLanguagesChange.emit(newSelection);
  }

  clearAll() {
    this.selectedLanguagesChange.emit([]);
  }

  toggleLanguage(lang: string) {
    const newSelection = [...this.selectedLanguages];
    const index = newSelection.indexOf(lang);
    
    if (index === -1) {
      newSelection.push(lang);
    } else {
      newSelection.splice(index, 1);
    }
    
    this.selectedLanguagesChange.emit(newSelection);
  }

  isSelected(lang: string): boolean {
    return this.selectedLanguages.includes(lang);
  }
} 