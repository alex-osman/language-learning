export class CreateSeasonDTO {
  mediaId: number;
  title: string;
  number: number;
}

export class SeasonDTO {
  id: number;
  mediaId: number;
  title: string;
  number: number;
  episodes?: any[];
}
