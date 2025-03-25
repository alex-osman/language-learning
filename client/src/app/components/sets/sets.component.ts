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
  templateUrl: './sets.component.html',
  styleUrls: ['./sets.component.scss'],
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
          .map(([key, location]) => ({
            final: key,
            location,
          }))
          .sort((a, b) => a.final.localeCompare(b.final));
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
