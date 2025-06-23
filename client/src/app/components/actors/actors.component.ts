import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActorDTO, DataService } from '../../services/data.service';

interface ActorGroup {
  type: string;
  title: string;
  actors: ActorDTO[];
}

@Component({
  selector: 'app-actors',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './actors.component.html',
  styleUrls: ['./actors.component.scss'],
})
export class ActorsComponent implements OnInit {
  actorGroups: ActorGroup[] = [];
  isLoading = true;
  error: string | null = null;

  // Define the groups with their display titles
  private readonly groups: { type: string; title: string }[] = [
    { type: 'male', title: 'Male Actors' },
    { type: 'female', title: 'Female Actors' },
    { type: 'fictional', title: 'Fictional Actors' },
  ];

  constructor(private dataService: DataService) {}

  ngOnInit() {
    this.loadActors();
  }

  private loadActors() {
    this.isLoading = true;
    this.error = null;

    this.dataService.getActors().subscribe({
      next: actors => {
        const validActors = actors.filter(actor => actor.initial !== 'null');

        // Group actors by type
        this.actorGroups = this.groups
          .map(group => ({
            ...group,
            actors: validActors
              .filter(actor => actor.type === group.type)
              .sort((a, b) => a.initial?.localeCompare(b.initial) ?? 0),
          }))
          .filter(group => group.actors.length > 0); // Only include groups with actors

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
