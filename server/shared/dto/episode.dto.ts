export class CreateEpisodeDTO {
  season_id: number;
  mediaId?: number;
  title: string;
  assetUrl?: string;
}

export class EpisodeDTO {
  id: number;
  title: string;
  sentences?: any[];
  assetUrl: string;
}
