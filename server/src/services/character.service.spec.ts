import { Test, TestingModule } from '@nestjs/testing';
import { CharacterService } from './character.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Character } from '../entities/character.entity';
import { ActorService } from './actor.service';
import { SetService } from './set.service';
import { RadicalPropService } from './radical-prop.service';

describe('CharacterService', () => {
  let service: CharacterService;

  // Create a mock repository for Character entity
  const mockCharacterRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    findOneOrFail: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  // Create mock services
  const mockActorService = {};
  const mockSetService = {};
  const mockRadicalPropService = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CharacterService,
        {
          provide: getRepositoryToken(Character),
          useValue: mockCharacterRepository,
        },
        {
          provide: ActorService,
          useValue: mockActorService,
        },
        {
          provide: SetService,
          useValue: mockSetService,
        },
        {
          provide: RadicalPropService,
          useValue: mockRadicalPropService,
        },
      ],
    }).compile();

    service = module.get<CharacterService>(CharacterService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('parsePinyin', () => {
    const testCases = [
      { input: 'er', expected: { initial: 'ø', final: 'er' } },
      { input: 'ba', expected: { initial: 'b', final: 'a' } },
      { input: 'shi', expected: { initial: 'sh', final: '' } },
      { input: 'xiao', expected: { initial: 'xi', final: 'ao' } },
      { input: 'shuang', expected: { initial: 'shu', final: 'ang' } },
      { input: 'kuang', expected: { initial: 'ku', final: 'ang' } },
      { input: 'zhi', expected: { initial: 'zh', final: '' } },
      { input: 'jia', expected: { initial: 'ji', final: 'a' } },
      { input: 'ru', expected: { initial: 'ru', final: '' } },
      { input: 'hua', expected: { initial: 'hu', final: 'a' } },
      { input: 'luan', expected: { initial: 'lu', final: 'an' } },
      { input: 'yue', expected: { initial: 'yu', final: 'e' } },
      { input: 'ming', expected: { initial: 'mi', final: 'ng' } },
      { input: 'ju', expected: { initial: 'ju', final: '' } },
      { input: 'zi', expected: { initial: 'z', final: '' } },
      { input: 'cun', expected: { initial: 'cu', final: 'n' } },
      { input: 'guo', expected: { initial: 'gu', final: 'o' } },
      { input: 'fu', expected: { initial: 'fu', final: '' } },
      { input: 'xi', expected: { initial: 'xi', final: '' } },
      { input: 'bu', expected: { initial: 'bu', final: '' } },
      { input: 'mu', expected: { initial: 'mu', final: '' } },
      { input: 'mian', expected: { initial: 'mi', final: 'an' } },
    ];

    testCases.forEach(({ input, expected }) => {
      it(`should correctly parse ${input}`, () => {
        const result = service.parsePinyin(input);
        expect(result).toEqual(expected);
      });
    });
  });

  describe('removeToneMarks', () => {
    it('should remove tone marks from vowels', () => {
      const cases = [
        { input: 'bā', expected: 'ba' },
        { input: 'shí', expected: 'shi' },
        { input: 'nǐ', expected: 'ni' },
        { input: 'hào', expected: 'hao' },
      ];

      cases.forEach(({ input, expected }) => {
        const result = service.removeToneMarks(input);
        expect(result).toBe(expected);
      });
    });
  });

  describe('getToneNumber', () => {
    it('should correctly identify tone numbers', () => {
      const cases = [
        { input: 'mā', expected: 1 },
        { input: 'má', expected: 2 },
        { input: 'mǎ', expected: 3 },
        { input: 'mà', expected: 4 },
        { input: 'ma', expected: 5 }, // neutral tone
      ];

      cases.forEach(({ input, expected }) => {
        expect(service.getToneNumber(input)).toBe(expected);
      });
    });
  });
});
