import { Directive, ElementRef, EventEmitter, HostListener, Output } from '@angular/core';

export interface CharacterHoverEvent {
  character: string;
  element: HTMLElement;
  rect: DOMRect;
}

@Directive({
  selector: '[appCharacterHover]',
  standalone: true
})
export class CharacterHoverDirective {
  @Output() characterHover = new EventEmitter<CharacterHoverEvent>();
  @Output() characterLeave = new EventEmitter<void>();

  constructor(private el: ElementRef) {}

  @HostListener('mouseenter', ['$event'])
  onMouseEnter(event: MouseEvent) {
    const element = this.el.nativeElement;
    const character = element.textContent?.trim() || '';
    
    if (character && /[\u4e00-\u9fff]/.test(character)) { // Only for Chinese characters
      const rect = element.getBoundingClientRect();
      this.characterHover.emit({ character, element, rect });
    }
  }

  @HostListener('mouseleave')
  onMouseLeave() {
    this.characterLeave.emit();
  }
}