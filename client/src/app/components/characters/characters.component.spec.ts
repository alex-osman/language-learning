import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CharactersComponent } from './characters.component';
import { MandarinBlueprint } from '../../interfaces/mandarin-blueprint.interface';

describe('CharactersComponent', () => {
  let component: CharactersComponent;
  let fixture: ComponentFixture<CharactersComponent>;

  const mockBlueprint: MandarinBlueprint = {
    sets: {
      '-an': "Anrenee's apartment",
      '-ou': 'Current Philly house',
      null: 'Bridgewater home',
    },
    tones: {
      '1': 'Outside',
      '2': 'Kitchen',
      '3': 'Living room',
      '4': 'Bathroom',
      '5': 'Bedroom',
    },
    actors: [
      { initial: 'w', name: 'Woody', type: 'fictional' },
      { initial: 'zh', name: 'Jim Carrey', type: 'male' },
      { initial: 'ji', name: 'Jamie', type: 'female' },
      { initial: 'du', name: 'Darth Vader', type: 'fictional' },
      { initial: 'b', name: 'Bill Murray', type: 'male' },
      { initial: 'ø', name: 'Jackie Chan', type: 'male' },
    ],
    radicalProps: [],
    characters: [],
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CharactersComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CharactersComponent);
    component = fixture.componentInstance;
    component.blueprint = mockBlueprint;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('onCharacterHover', () => {
    it('should handle "wu" syllable correctly', () => {
      const char = { character: '午', pinyin: 'wǔ', definition: 'noon' };
      component.onCharacterHover(char);

      expect(component.movieScene).toBeTruthy();
      expect(component.movieScene?.actor).toBe('Woody');
      expect(component.movieScene?.set).toBe('Bridgewater home');
      expect(component.movieScene?.initial).toBe('w');
      expect(component.movieScene?.final).toBe('');
      expect(component.movieScene?.tone).toBe('3');
    });

    it('should handle "ji" syllable correctly', () => {
      const char = { character: '几', pinyin: 'jǐ', definition: 'how many' };
      component.onCharacterHover(char);

      expect(component.movieScene).toBeTruthy();
      expect(component.movieScene?.actor).toBe('Jamie');
      expect(component.movieScene?.initial).toBe('ji');
    });

    it('should handle "dui" syllable correctly', () => {
      const char = { character: '兑', pinyin: 'duì', definition: 'exchange' };
      component.onCharacterHover(char);

      expect(component.movieScene).toBeTruthy();
      expect(component.movieScene?.actor).toBe('Darth Vader');
      expect(component.movieScene?.initial).toBe('du');
    });

    it('should handle "zhi" syllable correctly', () => {
      const char = { character: '只', pinyin: 'zhǐ', definition: 'only' };
      component.onCharacterHover(char);

      expect(component.movieScene).toBeTruthy();
      expect(component.movieScene?.actor).toBe('Jim Carrey');
      expect(component.movieScene?.set).toBe('Bridgewater home');
      expect(component.movieScene?.initial).toBe('zh');
      expect(component.movieScene?.final).toBe('');
      expect(component.movieScene?.tone).toBe('3');
    });

    it('should handle regular syllable correctly', () => {
      const char = { character: '班', pinyin: 'bān', definition: 'class' };
      component.onCharacterHover(char);

      expect(component.movieScene).toBeTruthy();
      expect(component.movieScene?.actor).toBe('Bill Murray');
      expect(component.movieScene?.set).toBe("Anrenee's apartment");
      expect(component.movieScene?.initial).toBe('b');
      expect(component.movieScene?.final).toBe('an');
      expect(component.movieScene?.tone).toBe('1');
    });

    it('should use fallback actor when initial not found', () => {
      const char = { character: '哈', pinyin: 'hā', definition: 'ha' };
      component.onCharacterHover(char);

      expect(component.movieScene).toBeTruthy();
      expect(component.movieScene?.actor).toBe('Jackie Chan');
    });

    it('should handle missing pinyin', () => {
      const char = { character: '好' };
      component.onCharacterHover(char);

      expect(component.movieScene).toBeNull();
    });

    it('should clear selection', () => {
      const char = { character: '午', pinyin: 'wǔ', definition: 'noon' };
      component.onCharacterHover(char);
      component.clearSelection();

      expect(component.movieScene).toBeNull();
      expect(component.selectedCharacter).toBeNull();
    });
  });

  describe('getToneNumber', () => {
    it('should return correct tone numbers', () => {
      expect(component.getToneNumber('wū')).toBe('1');
      expect(component.getToneNumber('wú')).toBe('2');
      expect(component.getToneNumber('wǔ')).toBe('3');
      expect(component.getToneNumber('wù')).toBe('4');
      expect(component.getToneNumber('wu')).toBe('5');
    });
  });

  describe('progress tracking', () => {
    it('should calculate progress correctly', () => {
      component.blueprint.characters = [
        { character: '午', pinyin: 'wǔ', definition: 'noon' },
        { character: '好' },
        { character: '你', pinyin: 'nǐ', definition: 'you' },
      ];
      fixture.detectChanges();

      expect(component.charactersProgress).toBe('2 / 3 characters complete');
    });
  });
});
