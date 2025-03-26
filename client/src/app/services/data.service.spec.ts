import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { DataService } from './data.service';

describe('DataService', () => {
  let service: DataService;
  let httpMock: HttpTestingController;

  const mockActors = [
    { initial: 'b', name: 'Bill Murray', type: 'male' },
    { initial: 'r', name: 'The Rock', type: 'male' },
    { initial: 'g', name: 'Gordon Ramsay', type: 'male' },
    { initial: 'k', name: 'Kim Jong Un', type: 'male' },
    { initial: 'c', name: 'Christopher Walken', type: 'male' },
    { initial: 's', name: 'Snoop Dogg', type: 'male' },
    { initial: 'zh', name: 'Jim Carrey', type: 'male' },
    { initial: 'ø', name: 'Jackie Chan', type: 'male' },
    { initial: 'sh', name: 'Shaq', type: 'male' },
    { initial: 'm', name: 'Michael Jackson', type: 'male' },
    { initial: 'xi', name: 'Shakira', type: 'female' },
    { initial: 'ni', name: 'Nicole Oringer', type: 'female' },
    { initial: 'ji', name: 'Jamie (your sister)', type: 'female' },
    { initial: 'ru', name: 'Ron Weasley', type: 'fictional' },
    { initial: 'du', name: 'Darth Vader', type: 'fictional' },
    { initial: 'w', name: 'Woody', type: 'fictional' },
    { initial: 'shu', name: 'Shrek', type: 'fictional' },
    { initial: 'yi', name: 'Yoa', type: 'male' },
  ];

  const mockSets = {
    '-an':
      "Anrenee's apartment, outside area with a buzzer and inside area with mailroom and then a lobby hallway that we go up a flight of stairs to her apartment.  Inside is the bedroom and bathroom and living area and kitchen.",
    '-en': 'Cosmos - the name of our college house we lived in',
    '-ong':
      'Bellevue Gym (The nice gym in philly with a lobby and smoothie bar and lots of classes and a workout room and a pool area with a hot tub and sauna)',
    '-e': "Eric's place in Maine (beautiful house in Bath Maine, decent sized yard with a blackstone grill and cold in the winter with a fireplace)",
    '-ou': 'Current Philly house with roommates (in center city philly)',
    '-a': 'Scottsdale coworking space in Arizona (tone 2 use coffee shop, tone 3 use actual office, tone 4 use parking lot,)',
    '-ao':
      '15 ft travel trailer (currently parked in a warehouse in Philly, toured across US/Canada to Las Vegas and Nova Scotia)',
    '-ei': 'High school',
    '-o': "Iowa - Jean's house (Jean was into funny jesus things so there were random jesus pictures and bobbleheads around the house.  Two dogs, a backyard with a broken airstream in it that Jean wanted to fix up.  A larger nicer bathroom on the ground floor.)",
    null: 'Bridgewater home (the home I grew up in, my parents home in new jersey)',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [DataService],
    });
    service = TestBed.inject(DataService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get characters', () => {
    const mockCharacters = [
      { character: '你', pinyin: 'nǐ', definition: 'you' },
      { character: '好', pinyin: 'hǎo', definition: 'good' },
    ];

    service.getCharacters().subscribe(characters => {
      expect(characters).toEqual(mockCharacters);
    });

    const req = httpMock.expectOne('/api/data/characters');
    expect(req.request.method).toBe('GET');
    req.flush(mockCharacters);
  });

  describe('getToneNumber', () => {
    it('should correctly identify tone numbers', () => {
      const cases = [
        { input: 'mā', expected: '1' },
        { input: 'má', expected: '2' },
        { input: 'mǎ', expected: '3' },
        { input: 'mà', expected: '4' },
        { input: 'ma', expected: '5' }, // neutral tone
        { input: 'māo', expected: '1' }, // tone on first vowel
        { input: 'máo', expected: '2' },
        { input: 'mǎo', expected: '3' },
        { input: 'mào', expected: '4' },
      ];

      cases.forEach(({ input, expected }) => {
        expect(service.getToneNumber(input)).toBe(
          expected,
          `Failed to get tone number for ${input}`
        );
      });
    });

    it('should handle edge cases for tone numbers', () => {
      expect(service.getToneNumber('')).toBe('5');
      expect(service.getToneNumber('hello')).toBe('5');
      expect(service.getToneNumber('123')).toBe('5');
    });
  });

  describe('mapFinal', () => {
    it('should map finals according to FINAL_MAPPINGS', () => {
      const cases = [
        { input: 'i', expected: 'e' },
        { input: 'ie', expected: 'e' },
        { input: 'r', expected: 'er' },
        { input: 'u', expected: 'ou' },
        { input: 'ü', expected: 'ou' },
        { input: 'ao', expected: 'ao' }, // unmapped final should remain unchanged
        { input: 'ong', expected: 'ong' }, // unmapped final should remain unchanged
        { input: '', expected: '' }, // empty final should remain empty
      ];

      cases.forEach(({ input, expected }) => {
        const result = service['mapFinal'](input);
        expect(result).toBe(expected, `Failed to map final ${input}`);
      });
    });
  });
});
