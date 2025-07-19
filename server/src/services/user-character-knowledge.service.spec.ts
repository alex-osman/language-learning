import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserCharacterKnowledgeService } from './user-character-knowledge.service';
import { UserCharacterKnowledge } from '../entities/user-character-knowledge.entity';
import { Character } from '../entities/character.entity';

describe('UserCharacterKnowledgeService', () => {
  let service: UserCharacterKnowledgeService;
  let userCharacterKnowledgeRepository: Repository<UserCharacterKnowledge>;
  let characterRepository: Repository<Character>;

  const mockUserCharacterKnowledgeRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockCharacterRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserCharacterKnowledgeService,
        {
          provide: getRepositoryToken(UserCharacterKnowledge),
          useValue: mockUserCharacterKnowledgeRepository,
        },
        {
          provide: getRepositoryToken(Character),
          useValue: mockCharacterRepository,
        },
      ],
    }).compile();

    service = module.get<UserCharacterKnowledgeService>(
      UserCharacterKnowledgeService,
    );
    userCharacterKnowledgeRepository = module.get<
      Repository<UserCharacterKnowledge>
    >(getRepositoryToken(UserCharacterKnowledge));
    characterRepository = module.get<Repository<Character>>(
      getRepositoryToken(Character),
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findByUserAndCharacter', () => {
    it('should return user character knowledge when found', async () => {
      const mockUserKnowledge = {
        id: 1,
        userID: 1,
        characterID: 1,
        easinessFactor: 2.5,
        repetitions: 0,
        interval: 0,
        lastReviewDate: new Date(),
        nextReviewDate: new Date(),
        learnedDate: new Date(),
        movie: 'test movie',
        imgUrl: 'test.jpg',
        character: null,
      };

      mockUserCharacterKnowledgeRepository.findOne.mockResolvedValue(
        mockUserKnowledge,
      );

      const result = await service.findByUserAndCharacter(1, 1);
      expect(result).toEqual(mockUserKnowledge);
      expect(mockUserCharacterKnowledgeRepository.findOne).toHaveBeenCalledWith(
        {
          where: { userID: 1, characterID: 1 },
          relations: ['character'],
        },
      );
    });

    it('should return null when user character knowledge not found', async () => {
      mockUserCharacterKnowledgeRepository.findOne.mockResolvedValue(null);

      const result = await service.findByUserAndCharacter(1, 1);
      expect(result).toBeNull();
    });
  });

  describe('createForUser', () => {
    it('should create new user character knowledge', async () => {
      const mockCreated = {
        id: 1,
        userID: 1,
        characterID: 1,
        easinessFactor: 2.5,
        repetitions: 0,
        interval: 0,
      };

      mockUserCharacterKnowledgeRepository.create.mockReturnValue(mockCreated);
      mockUserCharacterKnowledgeRepository.save.mockResolvedValue(mockCreated);

      const result = await service.createForUser(1, 1);
      expect(result).toEqual(mockCreated);
      expect(mockUserCharacterKnowledgeRepository.create).toHaveBeenCalledWith({
        userID: 1,
        characterID: 1,
        easinessFactor: 2.5,
        repetitions: 0,
        interval: 0,
      });
    });
  });

  describe('startLearningForUser', () => {
    it('should start learning for a character', async () => {
      const mockCharacter = {
        id: 1,
        character: '你',
        pinyin: 'ni3',
        definition: 'you',
        easinessFactor: 2.5,
        repetitions: 0,
        interval: 0,
        lastReviewDate: null,
        nextReviewDate: null,
        learnedDate: null,
        movie: null,
        imgUrl: null,
        freq: 1,
      };

      mockCharacterRepository.findOne.mockResolvedValue(mockCharacter);
      mockUserCharacterKnowledgeRepository.create.mockReturnValue({
        id: 1,
        userID: 1,
        characterID: 1,
        easinessFactor: 2.5,
        repetitions: 0,
        interval: 0,
        lastReviewDate: expect.any(Date),
        nextReviewDate: expect.any(Date),
      });
      mockUserCharacterKnowledgeRepository.save.mockResolvedValue({
        easinessFactor: 2.5,
        repetitions: 0,
        interval: 0,
        lastReviewDate: new Date(),
        nextReviewDate: new Date(),
      });

      const result = await service.startLearningForUser(1, 1);
      expect(result).toBeDefined();
      expect(result.id).toBe(1);
      expect(result.character).toBe('你');
      expect(result.pinyin).toBe('nǐ');
      expect(result.definition).toBe('you');
      expect(result.freq).toBe(1);
    });

    it('should throw error when character not found', async () => {
      mockCharacterRepository.findOne.mockResolvedValue(null);

      await expect(service.startLearningForUser(1, 999)).rejects.toThrow(
        'Character with ID 999 not found',
      );
    });
  });
});
