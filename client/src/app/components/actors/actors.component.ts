import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Actor } from '../../interfaces/mandarin-blueprint.interface';
import { DataService } from '../../services/data.service';

@Component({
  selector: 'app-actors',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './actors.component.html',
  styleUrls: ['./actors.component.scss'],
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
