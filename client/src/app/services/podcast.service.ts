import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class PodcastService {
  private apiUrl = '/api/radio';
  private generationComplete = new Subject<boolean>();

  constructor(private http: HttpClient) {}

  /**
   * Observable that emits when podcast generation is complete
   */
  get onGenerationComplete(): Observable<boolean> {
    return this.generationComplete.asObservable();
  }

  /**
   * Generate and download the latest podcast
   */
  generateAndDownloadPodcast(): void {
    const headers = new HttpHeaders({
      Accept: 'audio/mpeg',
    });

    console.log('🎙️ Requesting podcast generation...');

    this.http
      .get(`${this.apiUrl}/latest-podcast`, {
        headers,
        responseType: 'blob',
        observe: 'response',
      })
      .subscribe({
        next: response => {
          console.log('✅ Podcast received successfully');

          // Create a blob URL and download the file
          const blob = response.body as Blob;
          const url = window.URL.createObjectURL(blob);

          // Create a temporary link element and trigger download
          const link = document.createElement('a');
          link.href = url;
          link.download = 'chinese-learning-podcast.mp3';
          document.body.appendChild(link);
          link.click();

          // Clean up
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);

          console.log('📥 Podcast download triggered');

          // Notify completion
          this.generationComplete.next(true);
        },
        error: error => {
          console.error('❌ Error generating podcast:', error);
          alert('Failed to generate podcast. Please try again.');

          // Notify completion (even on error)
          this.generationComplete.next(false);
        },
      });
  }

  /**
   * Check if podcast generation is supported
   */
  isPodcastAvailable(): Observable<boolean> {
    // Simple ping to check if the endpoint is available
    return new Observable(observer => {
      this.http
        .get(`${this.apiUrl}/latest-podcast`, {
          responseType: 'blob',
          observe: 'response',
        })
        .subscribe({
          next: () => {
            observer.next(true);
            observer.complete();
          },
          error: () => {
            observer.next(false);
            observer.complete();
          },
        });
    });
  }
}
