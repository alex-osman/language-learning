import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CharactersComponent } from './characters.component';
import { DataService } from '../../services/data.service';
import { MovieService } from '../../services/movie.service';
import { PinyinService } from '../../services/pinyin.service';
import { HttpClientModule } from '@angular/common/http';
import { of } from 'rxjs';

describe('CharactersComponent', () => {
  let component: CharactersComponent;
  let fixture: ComponentFixture<CharactersComponent>;
  let dataService: jasmine.SpyObj<DataService>;
  let movieService: jasmine.SpyObj<MovieService>;
  let pinyinService: jasmine.SpyObj<PinyinService>;

  beforeEach(async () => {
    dataService = jasmine.createSpyObj('DataService', [
      'getCharacters',
      'getTones',
      'getRadicalProps',
      'getMovieScene',
    ]);
    movieService = jasmine.createSpyObj('MovieService', ['generateMovie']);
    pinyinService = jasmine.createSpyObj('PinyinService', [
      'getAudioUrls',
      'playAudioFile',
      'stop',
    ]);

    // Setup default return values
    dataService.getCharacters.and.returnValue(of([]));
    dataService.getTones.and.returnValue(of({}));
    dataService.getRadicalProps.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [CharactersComponent, HttpClientModule],
      providers: [
        { provide: DataService, useValue: dataService },
        { provide: MovieService, useValue: movieService },
        { provide: PinyinService, useValue: pinyinService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CharactersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load characters on init', () => {
    const mockCharacters = [
      { character: '你', pinyin: 'nǐ', definition: 'you' },
      { character: '好', pinyin: 'hǎo', definition: 'good' },
    ];
    dataService.getCharacters.and.returnValue(of(mockCharacters));

    component.ngOnInit();

    expect(component.characters).toEqual(mockCharacters);
    expect(component.isLoading).toBeFalse();
  });
});
