import { EasinessColorService } from './easiness-color.service';

/**
 * Interface for objects that have character data with easiness factor
 */
export interface CharacterWithEasiness {
  easinessFactor?: number;
  repetitions?: number;
  interval?: number;
}

/**
 * Interface for analyzed character results
 */
export interface AnalyzedCharacterResult {
  charData?: CharacterWithEasiness;
}

/**
 * Utility functions for character styling based on easiness factor
 */
export class CharacterStylingUtils {
  /**
   * Get gradient background and border styles based on character's easiness factor
   * @param easinessColorService The injected easiness color service
   * @param item Character or analyzed character with easiness data
   * @returns Object with background-color and border-color styles
   */
  static getEasinessGradientStyle(
    easinessColorService: EasinessColorService,
    item: CharacterWithEasiness | AnalyzedCharacterResult
  ): { [key: string]: string } {
    let charData: CharacterWithEasiness | undefined;

    // Handle both direct character objects and analyzed character results
    if ('charData' in item) {
      charData = item.charData;
    } else {
      charData = item as CharacterWithEasiness;
    }

    // If no character data or no learning progress, use fallback styling
    if (!charData || (charData.repetitions === 0 && charData.interval === 0)) {
      return {
        'background-color': '#e0e0e0',
        'border-color': '#bdbdbd',
      };
    }

    return easinessColorService.getGradientStyles(charData.easinessFactor);
  }

  /**
   * Get text color styles based on character's easiness factor
   * @param easinessColorService The injected easiness color service
   * @param item Character or analyzed character with easiness data
   * @returns Object with color style
   */
  static getEasinessTextStyle(
    easinessColorService: EasinessColorService,
    item: CharacterWithEasiness | AnalyzedCharacterResult
  ): { [key: string]: string } {
    let charData: CharacterWithEasiness | undefined;

    // Handle both direct character objects and analyzed character results
    if ('charData' in item) {
      charData = item.charData;
    } else {
      charData = item as CharacterWithEasiness;
    }

    // If no character data or no learning progress, use fallback styling
    if (!charData || (charData.repetitions === 0 && charData.interval === 0)) {
      return {
        color: '#757575',
      };
    }

    return easinessColorService.getTextColor(charData.easinessFactor);
  }
}
