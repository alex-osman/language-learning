import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { DataService } from '../../services/data.service';
import {
  INITIALS,
  ORDERED_FINALS,
  ORDERED_INITIALS,
  VALID_COMBINATIONS,
} from '../../data/pinyin.constants';

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
export class PhoneticChartComponent implements OnInit {
  selectedCell: { initial: string; final: string } | null = null;
  orderedInitials = ORDERED_INITIALS;
  orderedFinals = ORDERED_FINALS;
  initials = INITIALS;
  private actors: { initial: string; name: string }[] = [];
  private sets: { [key: string]: string } = {};

  constructor(private dataService: DataService) {}

  ngOnInit() {
    this.loadData();
  }

  private loadData() {
    // Load actors and sets data
    this.dataService.getActors().subscribe(actors => {
      this.actors = actors;
    });

    this.dataService.getSets().subscribe(sets => {
      this.sets = sets;
    });
  }

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
    const actor = this.actors.find(a => a.initial === cleanInitial);
    if (!actor) {
      return '(No actor assigned)';
    }
    return actor.name;
  }

  // Get set location for a final
  getSet(final: string): string {
    const key = `-${final}`;
    if (!(key in this.sets)) {
      return '(No location assigned)';
    }
    return this.sets[key] || this.sets['null'];
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
