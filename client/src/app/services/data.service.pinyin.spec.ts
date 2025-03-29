import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { DataService } from './data.service';

describe('DataService - Pinyin Functions', () => {
  let service: DataService;
  let httpMock: HttpTestingController;

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
