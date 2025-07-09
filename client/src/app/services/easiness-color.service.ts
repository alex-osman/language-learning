import { Injectable } from '@angular/core';

export interface ColorScheme {
  name: string;
  hardestHue: number; // HSL hue for hardest (e.g., 0 for red)
  easiestHue: number; // HSL hue for easiest (e.g., 240 for blue)
  saturation: number; // HSL saturation percentage
  lightness: number; // HSL lightness percentage
}

export interface EasinessColorOptions {
  minEasiness?: number;
  maxEasiness?: number;
  colorScheme?: ColorScheme;
  fallbackColor?: string;
}

@Injectable({
  providedIn: 'root',
})
export class EasinessColorService {
  private readonly DEFAULT_COLOR_SCHEME: ColorScheme = {
    name: 'red-to-blue',
    hardestHue: 0, // Red
    easiestHue: 240, // Blue
    saturation: 45,
    lightness: 92,
  };

  private readonly DEFAULT_OPTIONS: Required<EasinessColorOptions> = {
    minEasiness: 1.3,
    maxEasiness: 2.5,
    colorScheme: this.DEFAULT_COLOR_SCHEME,
    fallbackColor: '#e3f2fd',
  };

  /**
   * Get gradient background and border styles based on easiness factor
   * @param easinessFactor The easiness factor (typically 1.3 to 2.5+)
   * @param options Optional configuration for color calculation
   * @returns Object with background-color and border-color styles
   */
  getGradientStyles(
    easinessFactor: number | undefined,
    options: EasinessColorOptions = {}
  ): { [key: string]: string } {
    const config = { ...this.DEFAULT_OPTIONS, ...options };

    // Return fallback color if no easiness factor
    if (!easinessFactor) {
      return {
        'background-color': config.fallbackColor,
        'border-color': this.darkenColor(config.fallbackColor, 20),
      };
    }

    const normalizedEasiness = this.normalizeEasiness(
      easinessFactor,
      config.minEasiness,
      config.maxEasiness
    );
    const hue = this.calculateHue(normalizedEasiness, config.colorScheme);

    const backgroundColor = `hsl(${hue}, ${config.colorScheme.saturation}%, ${config.colorScheme.lightness}%)`;
    const borderColor = `hsl(${hue}, ${config.colorScheme.saturation + 10}%, ${
      config.colorScheme.lightness - 22
    }%)`;

    return {
      'background-color': backgroundColor,
      'border-color': borderColor,
    };
  }

  /**
   * Get text color based on easiness factor
   * @param easinessFactor The easiness factor (typically 1.3 to 2.5+)
   * @param options Optional configuration for color calculation
   * @returns Object with color style
   */
  getTextColor(
    easinessFactor: number | undefined,
    options: EasinessColorOptions = {}
  ): { [key: string]: string } {
    const config = { ...this.DEFAULT_OPTIONS, ...options };

    // Return default text color if no easiness factor
    if (!easinessFactor) {
      return {
        color: '#1565c0',
      };
    }

    const normalizedEasiness = this.normalizeEasiness(
      easinessFactor,
      config.minEasiness,
      config.maxEasiness
    );
    const hue = this.calculateHue(normalizedEasiness, config.colorScheme);
    const textColor = `hsl(${hue}, ${config.colorScheme.saturation + 20}%, 35%)`;

    return {
      color: textColor,
    };
  }

  /**
   * Get just the background color as a string (useful for other styling needs)
   * @param easinessFactor The easiness factor
   * @param options Optional configuration
   * @returns CSS color string
   */
  getBackgroundColor(
    easinessFactor: number | undefined,
    options: EasinessColorOptions = {}
  ): string {
    const styles = this.getGradientStyles(easinessFactor, options);
    return styles['background-color'];
  }

  /**
   * Create a custom color scheme
   * @param name Name of the color scheme
   * @param hardestHue HSL hue for hardest characters (0-360)
   * @param easiestHue HSL hue for easiest characters (0-360)
   * @param saturation HSL saturation percentage
   * @param lightness HSL lightness percentage
   * @returns ColorScheme object
   */
  createColorScheme(
    name: string,
    hardestHue: number,
    easiestHue: number,
    saturation: number = 45,
    lightness: number = 92
  ): ColorScheme {
    return {
      name,
      hardestHue,
      easiestHue,
      saturation,
      lightness,
    };
  }

  private normalizeEasiness(
    easinessFactor: number,
    minEasiness: number,
    maxEasiness: number
  ): number {
    return Math.max(0, Math.min(1, (easinessFactor - minEasiness) / (maxEasiness - minEasiness)));
  }

  private calculateHue(normalizedEasiness: number, colorScheme: ColorScheme): number {
    return (
      colorScheme.hardestHue +
      normalizedEasiness * (colorScheme.easiestHue - colorScheme.hardestHue)
    );
  }

  private darkenColor(color: string, percentage: number): string {
    // Simple darkening for hex colors - could be enhanced for HSL
    if (color.startsWith('#')) {
      const num = parseInt(color.slice(1), 16);
      const amt = Math.round(2.55 * percentage);
      const R = (num >> 16) - amt;
      const G = ((num >> 8) & 0x00ff) - amt;
      const B = (num & 0x0000ff) - amt;
      return `#${(
        0x1000000 +
        (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
        (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
        (B < 255 ? (B < 1 ? 0 : B) : 255)
      )
        .toString(16)
        .slice(1)}`;
    }
    return color; // Return as-is if not hex
  }
}
