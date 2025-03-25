import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { RadicalProp } from '../interfaces/mandarin-blueprint.interface';

export interface MovieGenerationRequest {
  character: string;
  pinyin: string;
  actor: string;
  set: string;
  tone: string;
  toneLocation: string;
  radicalProps: RadicalProp[];
  definition: string;
}

interface MovieGenerationResponse {
  movie: string;
}

@Injectable({
  providedIn: 'root',
})
export class MovieService {
  constructor(private http: HttpClient) {}

  generateMovie(request: MovieGenerationRequest): Observable<MovieGenerationResponse> {
    return this.http.post<MovieGenerationResponse>(`api/ai/movie`, request);
  }
}
