import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CharacterConnectionsGameService, ConnectionInfo } from '../../services/character-connections-game.service';
import { CharacterDTO } from '../../services/data.service';

@Component({
  selector: 'app-character-connections',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './character-connections.component.html',
  styleUrls: ['./character-connections.component.scss']
})
export class CharacterConnectionsComponent implements OnInit {
  // Signals for reactive state
  startCharacter = signal<CharacterDTO | null>(null);
  endCharacter = signal<CharacterDTO | null>(null);
  currentPath = signal<CharacterDTO[]>([]); // Just the characters in order
  inputValue = signal<string>('');
  errorMessage = signal<string | null>(null);
  gameWon = signal<boolean>(false);
  isLoading = signal<boolean>(true);

  // Store connection info for each step (for display)
  connections = signal<ConnectionInfo[]>([]);

  // Computed
  currentSteps = computed(() => this.currentPath().length);

  constructor(private gameService: CharacterConnectionsGameService) {}

  ngOnInit() {
    this.loadAndStart();
  }

  async loadAndStart() {
    try {
      this.isLoading.set(true);
      await this.gameService.loadCharacters();
      this.startNewGame();
    } catch (error) {
      console.error('Failed to load characters:', error);
      this.errorMessage.set('Failed to load characters. Please refresh the page.');
    } finally {
      this.isLoading.set(false);
    }
  }

  startNewGame() {
    const challenge = this.gameService.generateChallenge();
    this.startCharacter.set(challenge.start);
    this.endCharacter.set(challenge.end);
    this.currentPath.set([challenge.start]);
    this.connections.set([]);
    this.errorMessage.set(null);
    this.gameWon.set(false);
    this.inputValue.set('');
  }

  onSubmitCharacter() {
    const input = this.inputValue().trim();
    if (!input) return;

    // Look up the character
    const character = this.gameService.getCharacter(input);

    if (!character) {
      this.errorMessage.set(`Character "${input}" not found in database`);
      return;
    }

    // Don't allow duplicate consecutive characters
    const currentPath = this.currentPath();
    const previousChar = currentPath[currentPath.length - 1];

    if (previousChar.character === character.character) {
      this.errorMessage.set('Cannot add the same character twice in a row');
      return;
    }

    // Find what connects them (for display only)
    const connection = this.gameService.findConnection(previousChar, character);

    // Add to path
    this.currentPath.update(path => [...path, character]);
    this.connections.update(conns => [...conns, connection]);
    this.inputValue.set('');
    this.errorMessage.set(null);

    // Check if we reached the end
    if (character.character === this.endCharacter()?.character) {
      this.gameWon.set(true);
    }
  }

  undoLastMove() {
    if (this.currentPath().length <= 1) return; // Can't remove start
    this.currentPath.update(path => path.slice(0, -1));
    this.connections.update(conns => conns.slice(0, -1));
    this.errorMessage.set(null);
  }

  // Helper to get connection info for display
  getConnectionDisplay(connectionIndex: number): string {
    const conns = this.connections();
    if (connectionIndex >= conns.length) return '';

    const conn = conns[connectionIndex];
    const parts: string[] = [];

    if (conn.sharedRadicals.length > 0) {
      parts.push(`Radical: ${conn.sharedRadicals.join(', ')}`);
    }

    if (conn.samePinyin) {
      parts.push(`Sound: ${conn.pinyinSound}`);
    }

    if (parts.length === 0) {
      return '⚠️ No obvious connection';
    }

    return parts.join(' • ');
  }
}
