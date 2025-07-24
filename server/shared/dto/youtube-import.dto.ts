export class CreateYouTubeImportDTO {
  youtubeUrl: string;
  seasonId: number;
  title?: string;
  preferredLanguage?: string;
  dryRun?: boolean;
}
