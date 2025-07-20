import { Component } from '@angular/core';
import { CharactersComponent } from '../components/characters/characters.component';

@Component({
  selector: 'app-characters-page',
  imports: [CharactersComponent],
  templateUrl: './characters-page.component.html',
  styleUrl: './characters-page.component.scss',
})
export class CharactersPageComponent {}
