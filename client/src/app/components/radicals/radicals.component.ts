import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService } from '../../services/data.service';
import { RadicalProp } from '../../interfaces/mandarin-blueprint.interface';

@Component({
  selector: 'app-radicals',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './radicals.component.html',
  styleUrls: ['./radicals.component.scss'],
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
        this.radicals = radicals;
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
