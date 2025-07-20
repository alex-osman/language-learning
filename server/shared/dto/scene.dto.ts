export class CreateSceneDTO {
  episodeId: number;
  title: string;
  number: number;
}

export class SceneDTO {
  id: number;
  episodeId: number;
  title: string;
  assetUrl: string;
  number: number;
  sentences?: any[];
}
