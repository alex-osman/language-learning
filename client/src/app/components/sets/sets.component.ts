import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService } from '../../services/data.service';

interface SetEntry {
  final: string;
  location: string;
}

type Sets = { [key: string]: string };

@Component({
  selector: 'app-sets',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="section sets">
      <h2>Sets</h2>
      <div *ngIf="isLoading" class="loading">
        <div class="loading-spinner"></div>
        <p>Loading sets...</p>
      </div>
      <div *ngIf="!isLoading" class="grid">
        <ng-container *ngFor="let set of definedSets">
          <div class="cell has-data">
            <div class="cell-content">
              <div class="symbol">{{ set.final }}</div>
              <div class="value">{{ set.location }}</div>
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
export class SetsComponent implements OnInit {
  definedSets: SetEntry[] = [];
  isLoading = true;
  error: string | null = null;

  constructor(private dataService: DataService) {}

  ngOnInit() {
    this.loadSets();
  }

  private loadSets() {
    this.isLoading = true;
    this.error = null;

    this.dataService.getSets().subscribe({
      next: (sets: Sets) => {
        this.definedSets = Object.entries(sets)
          .filter(([key]) => key !== 'null') // Exclude the fallback set
          .map(([key, location]) => ({
            final: key.replace('-', ''), // Remove the hyphen prefix
            location,
          }))
          .sort((a, b) => a.final.localeCompare(b.final)); // Sort by final
        this.isLoading = false;
      },
      error: (error: Error) => {
        console.error('Error fetching sets:', error);
        this.error = 'Failed to load sets. Please try again later.';
        this.isLoading = false;
      },
    });
  }
}
