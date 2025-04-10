import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ActorsComponent } from '../actors/actors.component';
import { CharactersComponent } from '../characters/characters.component';
import { RadicalsComponent } from '../radicals/radicals.component';
import { SetsComponent } from '../sets/sets.component';
import { AddRadicalPropComponent } from '../add-radical-prop/add-radical-prop.component';
import { WordsComponent } from '../words/words.component';

@Component({
  selector: 'app-memory-palace',
  standalone: true,
  imports: [
    CommonModule,
    ActorsComponent,
    SetsComponent,
    CharactersComponent,
    RadicalsComponent,
    AddRadicalPropComponent,
    WordsComponent,
  ],
  template: `
    <div class="memory-palace">
      <div class="section-container">
        <div class="section-header" (click)="toggleSection('addRadicalProp')">
          <h2>Add Radical Props</h2>
          <span class="toggle-icon">{{ visibleSections.addRadicalProp ? '▼' : '►' }}</span>
        </div>
        <div class="section-content" [class.hidden]="!visibleSections.addRadicalProp">
          <app-add-radical-prop></app-add-radical-prop>
        </div>
      </div>

      <div class="section-container">
        <div class="section-header" (click)="toggleSection('characters')">
          <h2>Characters</h2>
          <span class="toggle-icon">{{ visibleSections.characters ? '▼' : '►' }}</span>
        </div>
        <div class="section-content" [class.hidden]="!visibleSections.characters">
          <app-characters></app-characters>
        </div>
      </div>

      <div class="section-container">
        <div class="section-header" (click)="toggleSection('words')">
          <h2>Words</h2>
          <span class="toggle-icon">{{ visibleSections.words ? '▼' : '►' }}</span>
        </div>
        <div class="section-content" [class.hidden]="!visibleSections.words">
          <app-words></app-words>
        </div>
      </div>

      <div class="section-container">
        <div class="section-header" (click)="toggleSection('radicals')">
          <h2>Radicals</h2>
          <span class="toggle-icon">{{ visibleSections.radicals ? '▼' : '►' }}</span>
        </div>
        <div class="section-content" [class.hidden]="!visibleSections.radicals">
          <app-radicals></app-radicals>
        </div>
      </div>

      <div class="section-container">
        <div class="section-header" (click)="toggleSection('actors')">
          <h2>Actors</h2>
          <span class="toggle-icon">{{ visibleSections.actors ? '▼' : '►' }}</span>
        </div>
        <div class="section-content" [class.hidden]="!visibleSections.actors">
          <app-actors></app-actors>
        </div>
      </div>

      <div class="section-container">
        <div class="section-header" (click)="toggleSection('sets')">
          <h2>Sets</h2>
          <span class="toggle-icon">{{ visibleSections.sets ? '▼' : '►' }}</span>
        </div>
        <div class="section-content" [class.hidden]="!visibleSections.sets">
          <app-sets></app-sets>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .memory-palace {
        padding: 2rem;
        max-width: 1200px;
        margin: 0 auto;
      }

      .section-container {
        margin-bottom: 2rem;
        border: 1px solid #e0e0e0;
        border-radius: 8px;
        overflow: hidden;
      }

      .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem;
        background-color: #f5f5f5;
        cursor: pointer;
        transition: background-color 0.2s;
      }

      .section-header:hover {
        background-color: #e0e0e0;
      }

      .section-header h2 {
        margin: 0;
        font-size: 1.25rem;
        color: #333;
      }

      .toggle-icon {
        font-size: 1rem;
        color: #666;
      }

      .section-content {
        padding: 1rem;
        background-color: #fff;
        transition: max-height 0.3s ease-out;
      }

      .section-content.hidden {
        display: none;
      }
    `,
  ],
})
export class MemoryPalaceComponent {
  visibleSections = {
    addRadicalProp: false,
    characters: true,
    words: true,
    radicals: true,
    actors: true,
    sets: true,
  };

  toggleSection(section: keyof typeof this.visibleSections) {
    this.visibleSections[section] = !this.visibleSections[section];
  }
}
