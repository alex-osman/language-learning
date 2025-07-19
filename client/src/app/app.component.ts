import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  title = 'chinois';
  mobileMenuOpen = false;

  constructor(private router: Router, public authService: AuthService) {
    // Close mobile menu on route change
    this.router.events.pipe(filter(event => event instanceof NavigationEnd)).subscribe(() => {
      this.mobileMenuOpen = false;
    });
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  // Close the mobile menu when clicking outside
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    // Get references to the elements
    const toggleButton = document.querySelector('.mobile-menu-toggle');
    const navLinks = document.querySelector('.nav-links');

    // Check if the click is outside the menu and the toggle button
    if (
      this.mobileMenuOpen &&
      toggleButton &&
      navLinks &&
      !toggleButton.contains(event.target as Node) &&
      !navLinks.contains(event.target as Node)
    ) {
      this.mobileMenuOpen = false;
    }
  }
}
