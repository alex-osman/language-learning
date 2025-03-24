import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MANDARIN_BLUEPRINT_DATA } from '../../data/mandarin-blueprint.data';
import {
  INITIALS,
  ORDERED_FINALS,
  ORDERED_INITIALS,
  VALID_COMBINATIONS,
} from '../../data/pinyin.constants';
import { MandarinBlueprint, Actor } from '../../interfaces/mandarin-blueprint.interface';

interface PhoneticCell {
  initial: string;
  finals: string[];
  examples?: { [key: string]: string };
}

@Component({
  selector: 'app-phonetic-chart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './phonetic-chart.component.html',
  styleUrls: ['./phonetic-chart.component.scss'],
})
export class PhoneticChartComponent {
  blueprint = MANDARIN_BLUEPRINT_DATA;
  selectedCell: { initial: string; final: string } | null = null;
  orderedInitials = ORDERED_INITIALS;
  orderedFinals = ORDERED_FINALS;
  initials = INITIALS;

  // Check if a combination exists based on the table
  hasCombination(initial: string, final: string): boolean {
    const combination = initial.replace('-', '') + final;
    return VALID_COMBINATIONS.has(combination);
  }

  // Get category for an initial
  getCategoryForInitial(initial: string): string {
    for (const [category, initials] of Object.entries(this.initials)) {
      if (initials.includes(initial)) {
        return category;
      }
    }
    return '';
  }

  // Get actor for an initial
  getActor(initial: string): string {
    const cleanInitial = initial.replace('-', '').toUpperCase();
    const actor = this.blueprint.actors.find(a => a.initial === cleanInitial);
    if (!actor) {
      return '(No actor assigned)';
    }
    return actor.name;
  }

  // Get set location for a final
  getSet(final: string): string {
    const key = `-${final}`;
    if (!(key in this.blueprint.sets)) {
      return '(No location assigned)';
    }
    return this.blueprint.sets[key] || this.blueprint.sets['null'];
  }

  // Handle cell click
  onCellClick(initial: string, final: string): void {
    if (this.hasCombination(initial, final)) {
      this.selectedCell = { initial, final };
    }
  }

  // Clear selection
  clearSelection(): void {
    this.selectedCell = null;
  }
}
