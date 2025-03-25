import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService, SetDTO } from '../../services/data.service';

@Component({
  selector: 'app-sets',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sets.component.html',
  styleUrls: ['./sets.component.scss'],
})
export class SetsComponent implements OnInit {
  definedSets: SetDTO[] = [];
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
      next: (sets: SetDTO[]) => {
        this.definedSets = sets;
        this.isLoading = false;
        console.log(this.definedSets);
      },
      error: (error: Error) => {
        console.error('Error fetching sets:', error);
        this.error = 'Failed to load sets. Please try again later.';
        this.isLoading = false;
      },
    });
  }
}
