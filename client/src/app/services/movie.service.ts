import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface MovieGenerationRequest {
  character: string;
  pinyin: string;
  actor: string;
  set: string;
  tone: string;
  toneLocation: string;
  radicalProps: string[];
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
