import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService } from '../../services/data.service';
import { RadicalProp } from '../../interfaces/mandarin-blueprint.interface';

@Component({
  selector: 'app-radicals',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="section radicals">
      <h2>Radical Props</h2>
      <div *ngIf="isLoading" class="loading">
        <div class="loading-spinner"></div>
        <p>Loading radicals...</p>
      </div>
      <div *ngIf="!isLoading" class="grid">
        <ng-container *ngFor="let radical of radicals">
          <div class="cell has-data">
            <div class="cell-content">
              <div class="symbol">{{ radical.radical }}</div>
              <div class="value">{{ radical.prop || 'No prop assigned' }}</div>
            </div>
          </div>
        </ng-container>
      </div>
      <div *ngIf="error" class="error">
        <p>{{ error }}</p>
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

      .loading {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 2rem;

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #f3f3f3;
          border-top: 4px solid #81c784;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 1rem;
        }

        p {
          color: #2e7d32;
          font-size: 1rem;
        }
      }

      .error {
        padding: 1rem;
        background-color: #ffebee;
        border: 1px solid #ef9a9a;
        border-radius: 6px;
        margin-top: 1rem;

        p {
          color: #c62828;
          margin: 0;
        }
      }

      @keyframes spin {
        0% {
          transform: rotate(0deg);
        }
        100% {
          transform: rotate(360deg);
        }
      }
    `,
  ],
})
export class RadicalsComponent implements OnInit {
  radicals: RadicalProp[] = [];
  isLoading = true;
  error: string | null = null;

  constructor(private dataService: DataService) {}

  ngOnInit() {
    this.loadRadicals();
  }

  private loadRadicals() {
    this.isLoading = true;
    this.error = null;

    this.dataService.getRadicalProps().subscribe({
      next: radicals => {
        this.radicals = radicals.sort((a, b) => a.radical.localeCompare(b.radical));
        this.isLoading = false;
      },
      error: (error: Error) => {
        console.error('Error fetching radicals:', error);
        this.error = 'Failed to load radicals. Please try again later.';
        this.isLoading = false;
      },
    });
  }
}
