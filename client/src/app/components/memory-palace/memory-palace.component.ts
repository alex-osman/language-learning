import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ORDERED_FINALS, ORDERED_INITIALS } from '../../data/pinyin.constants';
import { ActorsComponent } from '../actors/actors.component';
import { CharactersComponent } from '../characters/characters.component';
import { RadicalsComponent } from '../radicals/radicals.component';
import { SetsComponent } from '../sets/sets.component';

@Component({
  selector: 'app-memory-palace',
  standalone: true,
  imports: [CommonModule, ActorsComponent, SetsComponent, CharactersComponent, RadicalsComponent],
  template: `
    <div class="memory-palace">
      <app-actors> </app-actors>
      <app-sets> </app-sets>
      <app-radicals />
      <app-characters> </app-characters>
    </div>
  `,
  styles: [
    `
      .memory-palace {
        padding: 2rem;
        max-width: 1200px;
        margin: 0 auto;

        > * {
          margin-bottom: 3rem;

          &:last-child {
            margin-bottom: 0;
          }
        }
      }
    `,
  ],
})
export class MemoryPalaceComponent {
  orderedInitials = ORDERED_INITIALS;
  orderedFinals = ORDERED_FINALS;
}
