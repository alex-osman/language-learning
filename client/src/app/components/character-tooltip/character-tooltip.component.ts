import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

interface CharacterInfo {
  char: string;
  pinyin?: string;
  translation?: string;
}

interface Position {
  x: number;
  y: number;
}

@Component({
  selector: 'app-character-tooltip',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './character-tooltip.component.html',
  styleUrl: './character-tooltip.component.scss',
})
export class CharacterTooltipComponent {
  @Input() character!: CharacterInfo;
  @Input() position!: Position;

  get tooltipStyle() {
    return {
      position: 'fixed',
      left: `${this.position.x}px`,
      top: `${this.position.y}px`,
      zIndex: 1000,
    };
  }
}