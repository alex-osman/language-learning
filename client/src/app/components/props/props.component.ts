import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MandarinBlueprint } from '../../interfaces/mandarin-blueprint.interface';

interface RadicalProp {
  radical: string;
  prop?: string;
}

@Component({
  selector: 'app-props',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="section props">
      <h2>Level 3 Props Progress</h2>
      <div class="progress-stats">{{ propsProgress }}</div>
      <div class="grid">
        <ng-container *ngFor="let radical of filteredRadicals">
          <div
            class="cell"
            [class.has-data]="hasPropData(radical)"
            [class.no-data]="!hasPropData(radical)"
          >
            <div class="cell-content">
              <div class="radical">{{ radical.radical }}</div>
              <div class="prop">{{ getProp(radical) || 'Not Assigned' }}</div>
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

      .progress-stats {
        text-align: center;
        padding: 0.5rem;
        margin: 1rem 0;
        border-top: 1px solid #e0e0e0;
        border-bottom: 1px solid #e0e0e0;
        color: #666;
      }

      .cell {
        border-radius: 6px;
        padding: 1rem;
        transition: all 0.2s ease;

        &.has-data {
          background-color: #fff3e0;
          border: 1px solid #ffb74d;

          .radical {
            color: #e65100;
          }

          .prop {
            color: #ef6c00;
          }
        }

        &.no-data {
          background-color: #f5f5f5;
          border: 1px solid #e0e0e0;

          .radical {
            color: #757575;
          }

          .prop {
            color: #9e9e9e;
          }
        }
      }

      .cell-content {
        .radical {
          font-size: 1.5rem;
          font-weight: bold;
          margin-bottom: 0.5rem;
        }

        .prop {
          font-size: 0.9rem;
          word-break: break-word;
        }
      }
    `,
  ],
})
export class PropsComponent {
  @Input() blueprint!: MandarinBlueprint;

  private readonly MAX_INCOMPLETE_ITEMS = 20;

  get filteredRadicals(): RadicalProp[] {
    if (!this.blueprint?.radicalProps) return [];
    const radicals = this.blueprint.radicalProps;
    const complete = radicals.filter(radical => this.hasPropData(radical));
    const incomplete = radicals
      .filter(radical => !this.hasPropData(radical))
      .slice(0, this.MAX_INCOMPLETE_ITEMS);
    return [...complete, ...incomplete];
  }

  get propsProgress(): string {
    if (!this.blueprint?.radicalProps) return '0 / 0 props assigned';
    const total = this.blueprint.radicalProps.length;
    const complete = this.blueprint.radicalProps.filter(prop => prop.prop).length;
    return `${complete} / ${total} props assigned`;
  }

  hasPropData(radical: RadicalProp): boolean {
    return !!radical?.prop;
  }

  getProp(radical: RadicalProp): string {
    return radical?.prop || '';
  }
}
