import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-interactive-sidebar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="sidebar">
      <div class="sidebar-section">
        <h3>Sidebar</h3>
        <ul>
          <li>To implement....</li>
          <li>To implement....</li>
          <li>To implement....</li>
          <li>To implement....</li>
          <li>To implement....</li>
          <li>To implement....</li>
          <li>To implement....</li>
        </ul>
      </div>

      <div class="sidebar-section">
        <h3>Common Phrases</h3>
        <ul>
          <li>To implement....</li>
          <li>To implement....</li>
          <li>To implement....</li>
          <li>To implement....</li>
          <li>To implement....</li>
          <li>To implement....</li>
          <li>To implement....</li>
        </ul>
      </div>

      <div class="sidebar-section">
        <h3>Learning Tips</h3>
        <ul>
          <li>To implement....</li>
          <li>To implement....</li>
          <li>To implement....</li>
          <li>To implement....</li>
        </ul>
      </div>
    </div>
  `,
  styles: [
    `
      .sidebar {
        background: white;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        padding: 1rem;
        width: 300px;
      }

      .sidebar-section {
        margin-bottom: 1.5rem;

        &:last-child {
          margin-bottom: 0;
        }

        h3 {
          color: #2c3e50;
          font-size: 1.1rem;
          margin-bottom: 0.75rem;
          font-weight: 600;
        }

        ul {
          list-style: none;
          padding: 0;
          margin: 0;

          li {
            margin-bottom: 0.5rem;
            color: #4a5568;
            font-size: 0.95rem;
            line-height: 1.4;

            &:last-child {
              margin-bottom: 0;
            }
          }
        }
      }
    `,
  ],
})
export class InteractiveSidebarComponent {}
