import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type ProgressType = 'linear' | 'circular';
export type ProgressTheme =
  | 'primary'
  | 'secondary'
  | 'success'
  | 'warning'
  | 'info'
  | 'purple'
  | 'orange';

export interface ProgressSegment {
  value: number; // 0-100
  color: string; // CSS color value
  label?: string; // Optional label for this segment
}

@Component({
  selector: 'app-progress-indicator',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- Linear Progress Bar -->
    <div *ngIf="type === 'linear'" class="progress-container" [class]="'theme-' + theme">
      <div class="progress-bar" [style.height.px]="height">
        <!-- Multi-segment progress -->
        <div *ngIf="segments && segments.length > 0" class="progress-segments">
          <div
            *ngFor="let segment of segments; let i = index"
            class="progress-segment"
            [style.width.%]="segment.value"
            [style.background-color]="segment.color"
            [style.left.%]="getSegmentLeftPosition(i)"
            [style.transition]="animated ? 'width 0.3s ease' : 'none'"
          ></div>
        </div>
        <!-- Single value progress (backward compatibility) -->
        <div
          *ngIf="!segments || segments.length === 0"
          class="progress-fill"
          [style.width.%]="value"
          [style.transition]="animated ? 'width 0.3s ease' : 'none'"
        ></div>
      </div>
      <div *ngIf="showLabel" class="progress-label">
        <ng-container *ngIf="segments && segments.length > 0">
          <span *ngFor="let segment of segments; let last = last">
            {{ segment.value }}% {{ segment.label || labelText }}
            <span *ngIf="!last"> | </span>
          </span>
        </ng-container>
        <ng-container *ngIf="!segments || segments.length === 0">
          {{ value }}% {{ labelText }}
        </ng-container>
      </div>
    </div>

    <!-- Circular Progress -->
    <div *ngIf="type === 'circular'" class="circular-progress-container" [class]="'theme-' + theme">
      <svg [attr.width]="size" [attr.height]="size" [attr.viewBox]="'0 0 ' + size + ' ' + size">
        <!-- Background circle -->
        <circle
          [attr.cx]="size / 2"
          [attr.cy]="size / 2"
          [attr.r]="radius"
          fill="none"
          stroke="#f0f0f0"
          [attr.stroke-width]="strokeWidth"
        />
        <!-- Progress circle -->
        <circle
          [attr.cx]="size / 2"
          [attr.cy]="size / 2"
          [attr.r]="radius"
          fill="none"
          [attr.stroke]="strokeColor"
          [attr.stroke-width]="strokeWidth"
          stroke-linecap="round"
          [attr.stroke-dasharray]="circumference"
          [attr.stroke-dashoffset]="strokeDashoffset"
          [attr.transform]="'rotate(-90 ' + size / 2 + ' ' + size / 2 + ')'"
          [style.transition]="animated ? 'stroke-dashoffset 0.3s ease' : 'none'"
        />
      </svg>
      <div *ngIf="showLabel" class="circular-progress-text">{{ totalValue }}%</div>
    </div>
  `,
  styles: [
    `
      /* Linear Progress Styles */
      .progress-container {
        width: 100%;
      }

      .progress-bar {
        width: 100%;
        background-color: #eee;
        border-radius: 5px;
        overflow: hidden;
        margin-bottom: 0.3rem;
        position: relative;
      }

      .progress-segments {
        position: relative;
        height: 100%;
        width: 100%;
      }

      .progress-segment {
        position: absolute;
        height: 100%;
        border-radius: 0;
        transition: width 0.3s ease;
      }

      .progress-segment:first-child {
        border-radius: 5px 0 0 5px;
      }

      .progress-segment:last-child {
        border-radius: 0 5px 5px 0;
      }

      .progress-fill {
        height: 100%;
        border-radius: 5px 0 0 5px;
        transition: width 0.3s ease;
      }

      .progress-label {
        font-size: 0.9rem;
        color: #666;
        text-align: center;
      }

      /* Circular Progress Styles */
      .circular-progress-container {
        position: relative;
        display: inline-block;
      }

      .circular-progress-text {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        font-size: 20px;
        font-weight: 600;
        color: #333;
        text-align: center;
      }

      /* Theme Colors */
      .theme-primary .progress-fill {
        background: linear-gradient(90deg, #2196f3 0%, #90caf9 100%);
      }

      .theme-secondary .progress-fill {
        background: linear-gradient(90deg, #4caf50 0%, #81c784 100%);
      }

      .theme-success .progress-fill {
        background: linear-gradient(90deg, #4caf50 0%, #81c784 100%);
      }

      .theme-warning .progress-fill {
        background: linear-gradient(90deg, #ff9800 0%, #ffe0b2 100%);
      }

      .theme-info .progress-fill {
        background: linear-gradient(90deg, #2196f3 0%, #90caf9 100%);
      }

      .theme-purple .progress-fill {
        background: linear-gradient(90deg, #ab47bc 0%, #ce93d8 100%);
      }

      .theme-orange .progress-fill {
        background: linear-gradient(90deg, #e67e22 0%, #f39c12 100%);
      }
    `,
  ],
})
export class ProgressIndicatorComponent {
  @Input() type: ProgressType = 'linear';
  @Input() value: number = 0; // 0-100 (for backward compatibility)
  @Input() segments?: ProgressSegment[]; // New: array of progress segments
  @Input() theme: ProgressTheme = 'primary';
  @Input() showLabel: boolean = true;
  @Input() labelText: string = 'known';
  @Input() animated: boolean = true;

  // Linear progress specific
  @Input() height: number = 10;

  // Circular progress specific
  @Input() size: number = 80;
  @Input() strokeWidth: number = 8;

  get totalValue(): number {
    if (this.segments && this.segments.length > 0) {
      return this.segments.reduce((sum, segment) => sum + segment.value, 0);
    }
    return this.value;
  }

  get radius(): number {
    return (this.size - this.strokeWidth) / 2;
  }

  get circumference(): number {
    return 2 * Math.PI * this.radius;
  }

  get strokeDashoffset(): number {
    return this.circumference * (1 - this.totalValue / 100);
  }

  get strokeColor(): string {
    switch (this.theme) {
      case 'primary':
        return '#2196f3';
      case 'secondary':
        return '#4caf50';
      case 'success':
        return '#4caf50';
      case 'warning':
        return '#ff9800';
      case 'info':
        return '#2196f3';
      case 'purple':
        return '#ab47bc';
      case 'orange':
        return '#e67e22';
      default:
        return '#2196f3';
    }
  }

  getSegmentLeftPosition(index: number): number {
    if (!this.segments || index === 0) {
      return 0;
    }

    let leftPosition = 0;
    for (let i = 0; i < index; i++) {
      leftPosition += this.segments[i].value;
    }
    return leftPosition;
  }
}
