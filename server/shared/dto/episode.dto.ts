export class CreateEpisodeDTO {
  season_id: number;
  mediaId?: number;
  title: string;
  assetUrl?: string;
  knownCache?: number;
}

export class EpisodeDTO {
  id: number;
  title: string;
  scenes?: any[];
  assetUrl: string;
}
