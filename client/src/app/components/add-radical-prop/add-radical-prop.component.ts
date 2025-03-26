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
    `,
  ],
})
export class AddRadicalPropComponent {
  radical = '';
  prop = '';
  message = '';
  messageClass = '';

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
          this.radical = '';
          this.prop = '';
          // You might want to emit an event here to refresh the radicals list
        },
        error: error => {
          this.message = 'Error adding radical prop: ' + error.message;
          this.messageClass = 'error';
        },
      });
  }
}
