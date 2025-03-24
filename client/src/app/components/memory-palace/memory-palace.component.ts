import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MandarinBlueprint } from '../../interfaces/mandarin-blueprint.interface';
import { ActorsComponent } from '../actors/actors.component';
import { SetsComponent } from '../sets/sets.component';
import { CharactersComponent } from '../characters/characters.component';
import { PropsComponent } from '../props/props.component';
import { ORDERED_FINALS, ORDERED_INITIALS } from '../../data/pinyin.constants';
import { MANDARIN_BLUEPRINT_DATA } from '../../data/mandarin-blueprint.data';

@Component({
  selector: 'app-memory-palace',
  standalone: true,
  imports: [CommonModule, ActorsComponent, SetsComponent, CharactersComponent, PropsComponent],
  template: `
    <div class="memory-palace">
      <app-actors [blueprint]="blueprint"> </app-actors>

      <app-sets [blueprint]="blueprint" [orderedFinals]="orderedFinals"> </app-sets>

      <app-characters [blueprint]="blueprint"> </app-characters>

      <app-props [blueprint]="blueprint"> </app-props>
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
  blueprint: MandarinBlueprint = MANDARIN_BLUEPRINT_DATA;

  orderedInitials = ORDERED_INITIALS;
  orderedFinals = ORDERED_FINALS;
}
