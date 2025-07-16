export class CreateEpisodeDTO {
  seasonId: number;
  mediaId?: number;
  title: string;
  number: number;
}

export class EpisodeDTO {
  id: number;
  title: string;
  scenes?: any[];
  assetUrl: string;
}
