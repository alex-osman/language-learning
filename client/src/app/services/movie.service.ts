import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { RadicalProp } from '../interfaces/mandarin-blueprint.interface';
import { ActorDTO, SetDTO } from './data.service';

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
}
