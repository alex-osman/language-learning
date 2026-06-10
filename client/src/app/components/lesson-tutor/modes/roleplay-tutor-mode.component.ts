import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RoleplayConfig, RoleplayTranscriptTurn } from '../content/lesson-tutor-content.types';

@Component({
  selector: 'app-roleplay-tutor-mode',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './roleplay-tutor-mode.component.html',
})
export class RoleplayTutorModeComponent implements OnChanges, OnInit {
  @Input({ required: true }) config!: RoleplayConfig;
  @Input() transcript: RoleplayTranscriptTurn[] = [];
  @Input() isLoading = false;
  @Input() error: string | null = null;

  @Output() submitLearnerMessage = new EventEmitter<string>();
  @Output() retry = new EventEmitter<void>();
  @Output() reset = new EventEmitter<void>();

  draft = '';
  speakingIndex: number | null = null;

  private meijiaVoice: SpeechSynthesisVoice | null = null;
  private tingtingVoice: SpeechSynthesisVoice | null = null;

  ngOnInit(): void {
    this.loadVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = () => this.loadVoices();
    }
  }

  private loadVoices(): void {
    const all = window.speechSynthesis.getVoices();
    this.meijiaVoice = all.find((v) => v.name.toLowerCase().replace('-', '') === 'meijia') ?? null;
    this.tingtingVoice = all.find((v) => v.name.toLowerCase().replace('-', '') === 'tingting') ?? null;
  }

  speak(index: number, text: string): void {
    window.speechSynthesis.cancel();
    if (this.speakingIndex === index) { this.speakingIndex = null; return; }
    const utt = new SpeechSynthesisUtterance(text);
    utt.lang = 'zh-CN';
    utt.rate = 1.0;
    const voice = index % 2 === 0 ? this.meijiaVoice : this.tingtingVoice;
    if (voice) utt.voice = voice;
    utt.onend = () => { this.speakingIndex = null; };
    utt.onerror = () => { this.speakingIndex = null; };
    this.speakingIndex = index;
    window.speechSynthesis.speak(utt);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['config'] && this.config && this.transcript.length === 0) {
      this.reset.emit();
    }
  }

  submit(): void {
    const message = this.draft.trim();
    if (!message || this.isLoading) return;
    this.submitLearnerMessage.emit(message);
    this.draft = '';
  }

  togglePinyin(turn: RoleplayTranscriptTurn): void {
    turn.showPinyin = !turn.showPinyin;
  }

  toggleEnglish(turn: RoleplayTranscriptTurn): void {
    turn.showEnglish = !turn.showEnglish;
  }
}
