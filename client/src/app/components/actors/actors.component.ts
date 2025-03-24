import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MandarinBlueprint, Actor } from '../../interfaces/mandarin-blueprint.interface';

@Component({
  selector: 'app-actors',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="section actors">
      <h2>Actors</h2>
      <div class="grid">
        <ng-container *ngFor="let actor of actorEntries">
          <div class="cell has-data">
            <div class="cell-content">
              <div class="symbol">{{ actor.initial }}</div>
              <div class="value">{{ actor.name }}</div>
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
export class ActorsComponent {
  @Input() blueprint!: MandarinBlueprint;

  get actorEntries(): Actor[] {
    if (!this.blueprint?.actors) return [];
    return this.blueprint.actors
      .filter(actor => actor.initial !== 'null') // Exclude the null fallback actor
      .sort((a, b) => a.initial.localeCompare(b.initial)); // Sort by initial
  }
}
