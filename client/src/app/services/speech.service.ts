import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SpeechService {
  private synth = window.speechSynthesis;
  private isSpeaking = new BehaviorSubject<boolean>(false);
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private currentText: string = '';
  private currentSentence = new BehaviorSubject<string | null>(null);
  public currentSentence$ = this.currentSentence.asObservable();

  constructor() {
    // Load voices when they become available
    if (this.synth.onvoiceschanged !== undefined) {
      this.synth.onvoiceschanged = () => {
        this.loadVoices();
      };
    }
  }

  private loadVoices(): SpeechSynthesisVoice[] {
    return this.synth.getVoices().filter(voice => voice.lang.startsWith('zh'));
  }

  private getBestVoice(lang: string): SpeechSynthesisVoice | null {
    if (lang === 'zh-CN') {
      return this.loadVoices().find(voice => voice.name === 'Meijia') || null;
    }
    const voices = this.loadVoices();
    // Prefer voices with "Google" or "Premium" in the name as they tend to be better quality
    return (
      voices.find(
        voice =>
          voice.lang.startsWith(lang) &&
          (voice.name.includes('Google') || voice.name.includes('Premium'))
      ) ||
      voices.find(voice => voice.lang.startsWith(lang)) ||
      null
    );
  }

  async playSentence(id: number): Promise<void> {
    const text = `${id}`;
    await this.speak(text);
  }

  async speak(text: string, lang: string = 'zh-CN'): Promise<void> {
    return new Promise((resolve, reject) => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;

      // Get the best available voice
      const voice = this.getBestVoice(lang);
      if (voice) {
        utterance.voice = voice;
      }

      // Adjust for more natural speaking
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      // Event handlers
      utterance.onstart = () => {
        // Update state after speech actually starts
        this.currentText = text;
        this.currentSentence.next(text);
        this.isSpeaking.next(true);
        resolve();
      };

      utterance.onend = () => {
        this.resetState();
      };

      utterance.onerror = event => {
        this.resetState();
        reject(event);
      };

      // Store the new utterance before canceling current speech
      this.currentUtterance = utterance;

      // Cancel any current speech without resetting state
      if (this.synth) {
        this.synth.cancel();
      }

      // Start the new speech
      this.synth.speak(utterance);
    });
  }

  stop(): void {
    if (this.synth) {
      this.synth.cancel();
    }
    this.resetState();
  }

  private resetState(): void {
    this.isSpeaking.next(false);
    this.currentText = '';
    this.currentSentence.next(null);
    this.currentUtterance = null;
  }

  get speaking$(): Observable<boolean> {
    return this.isSpeaking.asObservable();
  }

  get isSupported(): boolean {
    return 'speechSynthesis' in window;
  }

  isCurrentlySpoken(text: string): boolean {
    return this.currentSentence.value === text;
  }
}
