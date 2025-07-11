import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-character-tile',
  standalone: true,
  imports: [],
  templateUrl: './character-tile.component.html',
  styleUrl: './character-tile.component.scss',
})
export class CharacterTileComponent {
  @Input() character!: string;
  @Input() highlighted: boolean = false;
}
