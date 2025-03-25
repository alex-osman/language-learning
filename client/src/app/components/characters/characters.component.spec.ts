import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CharactersComponent } from './characters.component';
import { DataService } from '../../services/data.service';
import { MovieService } from '../../services/movie.service';
import { of } from 'rxjs';
import { RadicalProp } from '../../interfaces/mandarin-blueprint.interface';

describe('CharactersComponent', () => {
  let component: CharactersComponent;
  let fixture: ComponentFixture<CharactersComponent>;
  let dataService: jasmine.SpyObj<DataService>;
  let movieService: jasmine.SpyObj<MovieService>;

  const mockRadicalProps: RadicalProp[] = [
    { radical: '手', prop: 'hand' },
    { radical: '人', prop: 'person' },
  ];

  const mockCharacters = [
    {
      character: '我',
      pinyin: 'wǒ',
      definition: 'I, me',
      props: [mockRadicalProps[0]],
    },
    {
      character: '你',
      pinyin: 'nǐ',
      definition: 'you',
      props: [mockRadicalProps[1]],
    },
  ];

  const mockMovieScene = {
    initial: 'w',
    final: 'o',
    actor: 'Will Smith',
    set: 'Office',
    tone: '3',
  };

  beforeEach(async () => {
    const dataServiceSpy = jasmine.createSpyObj('DataService', [
      'getCharacters',
      'getTones',
      'getMovieScene',
      'getRadicalProps',
    ]);
    const movieServiceSpy = jasmine.createSpyObj('MovieService', ['generateMovie']);

    dataServiceSpy.getCharacters.and.returnValue(of(mockCharacters));
    dataServiceSpy.getTones.and.returnValue(of({ '1': 'Door', '2': 'Floor', '3': 'Wall' }));
    dataServiceSpy.getMovieScene.and.returnValue(Promise.resolve(mockMovieScene));
    dataServiceSpy.getRadicalProps.and.returnValue(of(mockRadicalProps));
    movieServiceSpy.generateMovie.and.returnValue(of({ movie: 'generated-movie-url' }));

    await TestBed.configureTestingModule({
      imports: [CharactersComponent],
      providers: [
        { provide: DataService, useValue: dataServiceSpy },
        { provide: MovieService, useValue: movieServiceSpy },
      ],
    }).compileComponents();

    dataService = TestBed.inject(DataService) as jasmine.SpyObj<DataService>;
    movieService = TestBed.inject(MovieService) as jasmine.SpyObj<MovieService>;
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CharactersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load characters on init', () => {
    expect(dataService.getCharacters).toHaveBeenCalled();
    expect(component.characters).toEqual(mockCharacters);
  });

  it('should check if character has data', () => {
    expect(component.hasCharacterData(mockCharacters[0])).toBeTrue();
    expect(component.hasCharacterData({ character: '好' })).toBeFalse();
  });

  it('should handle character hover', async () => {
    await component.onCharacterHover(mockCharacters[0]);
    expect(dataService.getMovieScene).toHaveBeenCalledWith('wǒ');
    expect(component.selectedCharacter).toBe(mockCharacters[0]);
    expect(component.movieScene).toBe(mockMovieScene);
  });

  it('should clear selection', () => {
    component.selectedCharacter = mockCharacters[0];
    component.movieScene = mockMovieScene;
    component.clearSelection();
    expect(component.selectedCharacter).toBeNull();
    expect(component.movieScene).toBeNull();
  });

  it('should generate movie', () => {
    component.selectedCharacter = mockCharacters[0];
    component.movieScene = mockMovieScene;
    component.generateMovie();

    expect(movieService.generateMovie).toHaveBeenCalledWith(
      jasmine.objectContaining({
        character: '我',
        pinyin: 'wǒ',
        actor: 'Will Smith',
        set: 'Office',
        tone: '3',
      })
    );
  });
});
