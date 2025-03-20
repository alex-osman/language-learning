import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { Language } from '@shared/types/languages';

interface CacheEntry {
  blob: Blob;
  timestamp: number;
}

@Injectable({
  providedIn: 'root',
})
export class TtsService {
  private cache = new Map<string, CacheEntry>();
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

  constructor(private http: HttpClient) {}

  private getCacheKey(text: string, targetLanguage: Language): string {
    return `${text}:${targetLanguage}`;
  }

  private cleanOldCache(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.CACHE_DURATION) {
        this.cache.delete(key);
      }
    }
  }

  async generateSpeech(text: string, targetLanguage: Language): Promise<void> {
    try {
      // Clean old cache entries periodically
      this.cleanOldCache();

      // Check cache first
      const cacheKey = this.getCacheKey(text, targetLanguage);
      const cachedEntry = this.cache.get(cacheKey);

      let audioBlob: Blob;

      if (cachedEntry) {
        console.log('Using cached TTS audio');
        audioBlob = cachedEntry.blob;
      } else {
        console.log('Fetching new TTS audio');
        const response = await firstValueFrom(
          this.http.post(
            '/api/ai/tts',
            { text, targetLanguage },
            {
              responseType: 'arraybuffer',
            }
          )
        );

        audioBlob = new Blob([response], { type: 'audio/mpeg' });

        // Cache the result
        this.cache.set(cacheKey, {
          blob: audioBlob,
          timestamp: Date.now(),
        });
      }

      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);

      // Clean up the URL after the audio is done playing
      audio.addEventListener('ended', () => {
        URL.revokeObjectURL(audioUrl);
      });

      await audio.play();
    } catch (error) {
      console.error('Failed to generate speech:', error);
      throw error;
    }
  }
}
