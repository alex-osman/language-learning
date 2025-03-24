import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MandarinBlueprint } from '../../interfaces/mandarin-blueprint.interface';

@Component({
  selector: 'app-sets',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="section sets">
      <h2>Sets</h2>
      <div class="grid">
        <ng-container *ngFor="let set of definedSets">
          <div class="cell has-data">
            <div class="cell-content">
              <div class="symbol">{{ set.final }}</div>
              <div class="value">{{ set.location }}</div>
            </div>
          </div>
        </ng-container>
      </div>
    </div>
  `,
  styles: [
    `
      .grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 1rem;
      }

      .cell {
        border-radius: 6px;
        padding: 1rem;
        transition: all 0.2s ease;
        background-color: #c8e6c9;
        border: 1px solid #81c784;

        .symbol {
          color: #2e7d32;
          font-size: 1.2rem;
          font-weight: bold;
          margin-bottom: 0.5rem;
        }

        .value {
          color: #1b5e20;
          font-size: 0.9rem;
          word-break: break-word;
        }
      }
    `,
  ],
})
export class SetsComponent {
  @Input() blueprint!: MandarinBlueprint;

  get definedSets(): { final: string; location: string }[] {
    if (!this.blueprint?.sets) return [];
    return Object.entries(this.blueprint.sets)
      .filter(([key]) => key !== 'null') // Exclude the fallback set
      .map(([key, location]) => ({
        final: key.replace('-', ''), // Remove the hyphen prefix
        location,
      }))
      .sort((a, b) => a.final.localeCompare(b.final)); // Sort by final
  }
}
