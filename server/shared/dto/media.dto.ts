export class CreateMediaDTO {
  title: string;
  type: 'tv' | 'movie';
  imageUrl?: string;
}

export class MediaDTO {
  id: number;
  title: string;
  type: 'tv' | 'movie';
  imageUrl?: string;
  seasons?: any[];
  episodes?: any[];
}
