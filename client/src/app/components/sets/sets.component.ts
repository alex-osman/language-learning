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
        <ng-container *ngFor="let final of orderedFinals">
          <div
            class="cell"
            [class.has-data]="hasSetData(final)"
            [class.no-data]="!hasSetData(final)"
          >
            <div class="cell-content">
              <div class="symbol">{{ final }}</div>
              <div class="value">{{ getSet(final) || 'Not Assigned' }}</div>
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

        &.has-data {
          background-color: #c8e6c9;
          border: 1px solid #81c784;

          .symbol {
            color: #2e7d32;
          }

          .value {
            color: #1b5e20;
          }
        }

        &.no-data {
          background-color: #ffcdd2;
          border: 1px solid #e57373;

          .symbol {
            color: #c62828;
          }

          .value {
            color: #b71c1c;
          }
        }
      }

      .cell-content {
        .symbol {
          font-size: 1.2rem;
          font-weight: bold;
          margin-bottom: 0.5rem;
        }

        .value {
          font-size: 0.9rem;
          word-break: break-word;
        }
      }
    `,
  ],
})
export class SetsComponent {
  @Input() blueprint!: MandarinBlueprint;
  @Input() orderedFinals!: string[];

  getSet(final: string): string | null {
    if (!this.blueprint?.sets) return null;
    const key = `-${final}`;
    return this.blueprint.sets[key] || null;
  }

  hasSetData(final: string): boolean {
    return this.getSet(final) !== null;
  }
}
