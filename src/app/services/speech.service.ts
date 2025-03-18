import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
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

    // Add a safety check interval to ensure speaking status stays accurate
    setInterval(() => {
      if (this.isSpeaking.value && !this.synth.speaking) {
        this.isSpeaking.next(false);
      }
    }, 100);
  }

  private loadVoices(): SpeechSynthesisVoice[] {
    return this.synth.getVoices().filter(voice => 
      voice.lang.startsWith('zh') || voice.lang.startsWith('en')
    );
  }

  private getBestVoice(lang: string): SpeechSynthesisVoice | null {
    const voices = this.loadVoices();
    // Prefer voices with "Google" or "Premium" in the name as they tend to be better quality
    return voices.find(voice => 
      voice.lang.startsWith(lang) && 
      (voice.name.includes('Google') || voice.name.includes('Premium'))
    ) || voices.find(voice => voice.lang.startsWith(lang)) || null;
  }

  async speak(text: string, lang: string = 'zh-CN'): Promise<void> {
    this.stop(); // Stop any existing speech
    this.currentSentence.next(text); // Set current sentence
    this.currentText = text;
    
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
      this.isSpeaking.next(true);
    };

    utterance.onend = () => {
      this.isSpeaking.next(false);
      this.currentUtterance = null;
      this.currentText = '';
    };

    utterance.onerror = (event) => {
      this.isSpeaking.next(false);
      this.currentUtterance = null;
      this.currentText = '';
    };

    utterance.onpause = () => {
      this.isSpeaking.next(false);
    };

    utterance.onresume = () => {
      this.isSpeaking.next(true);
    };

    this.currentUtterance = utterance;
    this.synth.speak(utterance);
  }

  stop(): void {
    if (this.synth) {
      this.synth.cancel();
      this.isSpeaking.next(false);
      this.currentUtterance = null;
      this.currentText = '';
      this.currentSentence.next(null);
    }
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
