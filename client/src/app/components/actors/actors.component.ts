import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Actor } from '../../interfaces/mandarin-blueprint.interface';
import { DataService } from '../../services/data.service';

@Component({
  selector: 'app-actors',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="section actors">
      <h2>Actors</h2>
      <div *ngIf="isLoading" class="loading">
        <div class="loading-spinner"></div>
        <p>Loading actors...</p>
      </div>
      <div *ngIf="!isLoading" class="grid">
        <ng-container *ngFor="let actor of actors">
          <div class="cell has-data">
            <div class="cell-content">
              <div class="symbol">{{ actor.initial }}</div>
              <div class="value">{{ actor.name }}</div>
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
export class ActorsComponent implements OnInit {
  actors: Actor[] = [];
  isLoading = true;
  error: string | null = null;

  constructor(private dataService: DataService) {}

  ngOnInit() {
    this.loadActors();
  }

  private loadActors() {
    this.isLoading = true;
    this.error = null;

    this.dataService.getActors().subscribe({
      next: actors => {
        this.actors = actors
          .filter(actor => actor.initial !== 'null')
          .sort((a, b) => a.initial.localeCompare(b.initial));
        this.isLoading = false;
      },
      error: error => {
        console.error('Error fetching actors:', error);
        this.error = 'Failed to load actors. Please try again later.';
        this.isLoading = false;
      },
    });
  }
}
