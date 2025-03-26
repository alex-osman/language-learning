import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-add-radical-prop',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="add-radical-prop">
      <h3>Add New Radical Property</h3>
      <div class="form-group">
        <input type="text" [(ngModel)]="radical" placeholder="Enter radical" class="input" />
        <input type="text" [(ngModel)]="prop" placeholder="Enter prop description" class="input" />
        <button (click)="addRadicalProp()" class="button">Add Radical Prop</button>
      </div>
      <div *ngIf="message" [class]="messageClass">
        {{ message }}
      </div>

      <div class="character-section">
        <h3>Add Character Using This Radical</h3>
        <div class="form-group">
          <input type="text" [(ngModel)]="character" placeholder="Enter character" class="input" />
          <input type="text" [(ngModel)]="pinyin" placeholder="Enter pinyin" class="input" />
          <input
            type="text"
            [(ngModel)]="definition"
            placeholder="Enter definition"
            class="input"
          />
          <button (click)="addCharacter()" class="button">Add Character</button>
        </div>
        <div *ngIf="characterMessage" [class]="characterMessageClass">
          {{ characterMessage }}
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .add-radical-prop {
        background: #f5f5f5;
        padding: 1.5rem;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }

      h3 {
        margin-top: 0;
        margin-bottom: 1rem;
        color: #333;
      }

      .form-group {
        display: flex;
        gap: 1rem;
        margin-bottom: 1rem;
      }

      .input {
        padding: 0.5rem;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 1rem;
        flex: 1;
      }

      .button {
        padding: 0.5rem 1rem;
        background-color: #4caf50;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 1rem;
        transition: background-color 0.2s;
        white-space: nowrap;

        &:hover {
          background-color: #45a049;
        }
      }

      .success {
        color: #4caf50;
        margin-top: 0.5rem;
      }

      .error {
        color: #f44336;
        margin-top: 0.5rem;
      }

      .character-section {
        margin-top: 2rem;
        padding-top: 1.5rem;
        border-top: 1px solid #ddd;
      }
    `,
  ],
})
export class AddRadicalPropComponent {
  // Radical prop fields
  radical = '';
  prop = '';
  message = '';
  messageClass = '';

  // Character fields
  character = '';
  pinyin = '';
  definition = '';
  characterMessage = '';
  characterMessageClass = '';

  constructor(private http: HttpClient) {}

  addRadicalProp() {
    if (!this.radical || !this.prop) {
      this.message = 'Both radical and prop are required';
      this.messageClass = 'error';
      return;
    }

    this.http
      .post('/api/data/radicalProps', {
        radical: this.radical,
        prop: this.prop,
      })
      .subscribe({
        next: () => {
          this.message = 'Radical prop added successfully!';
          this.messageClass = 'success';
          // Don't clear the radical field as it might be needed for character creation
          this.prop = '';
        },
        error: error => {
          this.message = 'Error adding radical prop: ' + error.message;
          this.messageClass = 'error';
        },
      });
  }

  addCharacter() {
    if (!this.character || !this.pinyin || !this.definition) {
      this.characterMessage = 'Character, pinyin, and definition are required';
      this.characterMessageClass = 'error';
      return;
    }

    this.http
      .post('/api/data/characters', {
        character: this.character,
        pinyin: this.pinyin,
        definition: this.definition,
        radicals: this.radical, // Use the radical from above if it exists
      })
      .subscribe({
        next: () => {
          this.characterMessage = 'Character added successfully!';
          this.characterMessageClass = 'success';
          this.character = '';
          this.pinyin = '';
          this.definition = '';
          this.radical = ''; // Now we can clear the radical
        },
        error: error => {
          this.characterMessage = 'Error adding character: ' + error.message;
          this.characterMessageClass = 'error';
        },
      });
  }
}
