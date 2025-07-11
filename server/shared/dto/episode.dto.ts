export class CreateEpisodeDTO {
  seasonId: number;
  mediaId?: number;
  title: string;
  number: number;
}

export class EpisodeDTO {
  id: number;
  seasonId: number;
  mediaId?: number;
  title: string;
  number: number;
  scenes?: any[];
}
