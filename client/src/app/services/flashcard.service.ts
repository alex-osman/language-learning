import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CharacterDTO } from './data.service';

@Injectable({
  providedIn: 'root',
})
export class FlashcardService {
  private apiUrl = '/api/flashcards';

  constructor(private http: HttpClient) {}

  /**
   * Get all characters that are due for review today
   */
  getDueCards(): Observable<CharacterDTO[]> {
    return this.http.get<CharacterDTO[]>(`${this.apiUrl}/due`);
  }

  /**
   * Submit a review for a character
   * @param characterId The ID of the character
   * @param quality The quality rating (0-5) of the review
   */
  reviewCard(characterId: number, quality: number): Observable<CharacterDTO> {
    return this.http.post<CharacterDTO>(`${this.apiUrl}/${characterId}/review`, { quality });
  }

  /**
   * Start learning a new character
   * @param characterId The ID of the character to start learning
   */
  startLearning(characterId: number): Observable<CharacterDTO> {
    return this.http.post<CharacterDTO>(`${this.apiUrl}/${characterId}/learn`, {});
  }

  /**
   * Reset learning progress for a character
   * @param characterId The ID of the character to reset
   */
  resetLearning(characterId: number): Observable<CharacterDTO> {
    return this.http.post<CharacterDTO>(`${this.apiUrl}/${characterId}/reset`, {});
  }
}
