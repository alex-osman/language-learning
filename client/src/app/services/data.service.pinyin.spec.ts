import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { DataService } from './data.service';
import { of, throwError } from 'rxjs';
import { HttpTestingController } from '@angular/common/http/testing';

describe('DataService - Pinyin Functions', () => {
  let service: DataService;
  let httpMock: HttpTestingController;

  const mockActors = [
    { initial: 'b', name: 'Bill Murray', type: 'male' },
    { initial: 'r', name: 'The Rock', type: 'male' },
    { initial: 'sh', name: 'Shaq', type: 'male' },
    { initial: 'xi', name: 'Shakira', type: 'female' },
    { initial: 'yi', name: 'Yoa', type: 'male' },
    { initial: 'ø', name: 'Jackie Chan', type: 'male' },
  ];

  const mockSets = {
    '-a': 'Set A',
    '-e': 'Set E',
    '-ao': 'Set AO',
    null: 'Default Set',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [DataService],
    });
    service = TestBed.inject(DataService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  describe('removeToneMarks', () => {
    it('should remove tone marks from vowels', () => {
      const cases = [
        { input: 'bā', expected: 'ba' },
        { input: 'shí', expected: 'shi' },
        { input: 'nǐ', expected: 'ni' },
        { input: 'hào', expected: 'hao' },
        { input: 'xiōng', expected: 'xiong' },
        { input: 'èr', expected: 'er' },
        { input: 'lǜ', expected: 'lü' },
      ];

      cases.forEach(({ input, expected }) => {
        const result = service['removeToneMarks'](input);
        expect(result).toBe(expected, `Failed to remove tone marks from ${input}`);
      });
    });

    it('should handle empty string and non-pinyin input', () => {
      expect(service['removeToneMarks']('')).toBe('');
      expect(service['removeToneMarks']('hello123')).toBe('hello123');
      expect(service['removeToneMarks']('!@#$%')).toBe('!@#$%');
    });
  });

  describe('parsePinyin', () => {
    const cases = [
      { input: 'er', expected: { initial: 'ø', final: 'er' } },
      { input: 'ba', expected: { initial: 'b', final: 'a' } },
      { input: 'shi', expected: { initial: 'sh', final: '' } },
      { input: 'xiao', expected: { initial: 'xi', final: 'ao' } },
      { input: 'shuang', expected: { initial: 'shu', final: 'ang' } },
      { input: 'kuang', expected: { initial: 'ku', final: 'ang' } },
      { input: 'zhi', expected: { initial: 'zh', final: '' } },
      { input: 'jia', expected: { initial: 'ji', final: 'a' } },
      { input: 'ru', expected: { initial: 'ru', final: '' } },
    ];

    cases.forEach(({ input, expected }) => {
      it(`should correctly parse ${input}`, () => {
        const result = service['parsePinyin'](input);
        expect(result).toEqual(expected, `Failed to parse ${input}`);
      });
    });

    it('should handle edge cases', () => {
      // Empty string
      expect(service['parsePinyin']('')).toEqual({ initial: '', final: '' });

      // Single character
      expect(service['parsePinyin']('a')).toEqual({ initial: 'a', final: '' });

      // Invalid pinyin
      expect(service['parsePinyin']('xyz')).toEqual({ initial: 'x', final: 'yz' });

      // Special cases with 'w' and 'y'
      expect(service['parsePinyin']('wu')).toEqual({ initial: 'w', final: '' });
    });

    it('should correctly parse yi initial (乙 - yī)', async () => {
      const promise = service.getMovieScene('yī');
      const actorsReq = httpMock.expectOne('/api/data/actors');
      actorsReq.flush(mockActors);

      const setsReq = httpMock.expectOne('/api/data/sets');
      setsReq.flush(mockSets);

      const result = await promise;
      expect(result).toBeTruthy();
      expect(result?.initial).toBe('yi');
      expect(result?.final).toBe('');
      expect(result?.actor).toBe('Yoa');
      expect(result?.set).toBe(mockSets['null']);
      expect(result?.tone).toBe('1');
    });

    it('should correctly parse ri (日 - rì)', async () => {
      const promise = service.getMovieScene('rì');
      const actorsReq = httpMock.expectOne('/api/data/actors');
      actorsReq.flush(mockActors);

      const setsReq = httpMock.expectOne('/api/data/sets');
      setsReq.flush(mockSets);

      const result = await promise;
      expect(result).toBeTruthy();
      expect(result?.initial).toBe('r');
      expect(result?.final).toBe('');
      expect(result?.actor).toBe('The Rock');
      expect(result?.set).toBe(mockSets['null']);
      expect(result?.tone).toBe('4');
    });
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

  describe('findActor', () => {
    it('should find exact matching actor', () => {
      expect(service['findActor']('b', mockActors)).toBe('Bill Murray');
      expect(service['findActor']('sh', mockActors)).toBe('Shaq');
      expect(service['findActor']('xi', mockActors)).toBe('Shakira');
    });

    it('should use fallback actor when no match found', () => {
      expect(service['findActor']('z', mockActors)).toBe('Jackie Chan');
    });
  });

  describe('getSetLocation', () => {
    it('should find matching set', () => {
      expect(service['getSetLocation']('a', mockSets)).toBe('Set A');
      expect(service['getSetLocation']('e', mockSets)).toBe('Set E');
      expect(service['getSetLocation']('ao', mockSets)).toBe('Set AO');
    });

    it('should use null set when no final', () => {
      expect(service['getSetLocation']('', mockSets)).toBe('Default Set');
    });

    it('should use null set when no matching set found', () => {
      expect(service['getSetLocation']('xyz', mockSets)).toBe('Default Set');
    });
  });

  describe('getMovieScene', () => {
    const mockActors = [
      { initial: 'b', name: 'Bill Murray', type: 'male' },
      { initial: 'sh', name: 'Shaq', type: 'male' },
      { initial: 'xi', name: 'Shakira', type: 'female' },
      { initial: 'ø', name: 'Jackie Chan', type: 'male' },
    ];

    const mockSets = {
      '-a': 'Set A',
      '-e': 'Set E',
      '-ao': 'Set AO',
      null: 'Default Set',
    };

    let actorsSpy: jasmine.Spy;
    let setsSpy: jasmine.Spy;

    beforeEach(() => {
      actorsSpy = spyOn(service, 'getActors').and.returnValue(of(mockActors));
      setsSpy = spyOn(service, 'getSets').and.returnValue(of(mockSets));
    });

    it('should handle complete pinyin processing', async () => {
      const result = await service.getMovieScene('bā');
      expect(result).toEqual({
        initial: 'b',
        final: 'a',
        actor: 'Bill Murray',
        set: 'Set A',
        tone: '1',
      });
    });

    it('should handle missing data gracefully', async () => {
      actorsSpy.and.returnValue(of(null as any));
      let result = await service.getMovieScene('bā');
      expect(result).toBeNull();

      actorsSpy.and.returnValue(of(mockActors));
      setsSpy.and.returnValue(of(null as any));
      result = await service.getMovieScene('bā');
      expect(result).toBeNull();
    });

    it('should handle API errors gracefully', async () => {
      actorsSpy.and.returnValue(throwError(() => new Error('API Error')));
      const result = await service.getMovieScene('bā');
      expect(result).toBeNull();
    });
  });
});
