import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { RadicalProp } from '../interfaces/mandarin-blueprint.interface';
import { ActorDTO, CharacterDTO, SetDTO } from './data.service';

export interface MovieGenerationRequest {
  character: string;
  pinyin: string;
  actor: ActorDTO;
  set: SetDTO;
  tone: string;
  toneLocation: string;
  radicalProps: RadicalProp[];
  definition: string;
  userInput?: string;
}

interface MovieGenerationResponse {
  movie: string;
  imageUrl?: string;
}

@Injectable({
  providedIn: 'root',
})
export class MovieService {
  constructor(private http: HttpClient) {}

  generateMovie(characterId: number, userInput?: string): Observable<MovieGenerationResponse> {
    return this.http.post<MovieGenerationResponse>(`api/ai/movie/${characterId}`, {
      userInput: userInput || '',
    });
  }

  // Get the next character that needs a movie
  getNextCharacterForMovie(): Observable<CharacterDTO> {
    return this.http.get<CharacterDTO>('api/characters/next-for-movie');
  }

  // Save a movie for a character
  saveCharacterMovie(
    characterId: number,
    movieText: string,
    imageUrl?: string
  ): Observable<CharacterDTO> {
    return this.http.post<CharacterDTO>(`api/characters/${characterId}/movie`, {
      movie: movieText,
      imageUrl,
    });
  }

  // Generate image from the movie description
  generateMovieImage(
    characterId: number,
    movieDescription: string
  ): Observable<{ imageUrl: string }> {
    return this.http.post<{ imageUrl: string }>('api/ai/generate-image', {
      characterId,
      prompt: movieDescription,
    });
  }

  // Update character radicals
  updateCharacterRadicals(characterId: number, radicals: string): Observable<CharacterDTO> {
    return this.http.put<CharacterDTO>(`api/characters/${characterId}/radicals`, {
      radicals,
    });
  }
}
