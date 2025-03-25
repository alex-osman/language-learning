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

  describe('getMovieScene', () => {
    it('should correctly parse simple pinyin (bā)', async () => {
      const promise = service.getMovieScene('bā');
      const actorsReq = httpMock.expectOne('/api/data/actors');
      actorsReq.flush(mockActors);

      const setsReq = httpMock.expectOne('/api/data/sets');
      setsReq.flush(mockSets);

      const result = await promise;
      expect(result).toBeTruthy();
      expect(result?.initial).toBe('b');
      expect(result?.final).toBe('a');
      expect(result?.actor).toBe('Bill Murray');
      expect(result?.set).toBe(mockSets['-a']);
      expect(result?.tone).toBe('1');
    });

    it('should correctly parse shi initial (识 - shí)', async () => {
      const promise = service.getMovieScene('shí');
      const actorsReq = httpMock.expectOne('/api/data/actors');
      actorsReq.flush(mockActors);

      const setsReq = httpMock.expectOne('/api/data/sets');
      setsReq.flush(mockSets);

      const result = await promise;
      expect(result).toBeTruthy();
      expect(result?.initial).toBe('sh');
      expect(result?.final).toBe('');
      expect(result?.actor).toBe('Shaq');
      expect(result?.set).toBe(mockSets['null']);
      expect(result?.tone).toBe('2');
    });

    it('should correctly parse xi initial (兄 - xiōng)', async () => {
      const promise = service.getMovieScene('xiōng');
      const actorsReq = httpMock.expectOne('/api/data/actors');
      actorsReq.flush(mockActors);

      const setsReq = httpMock.expectOne('/api/data/sets');
      setsReq.flush(mockSets);

      const result = await promise;
      expect(result).toBeTruthy();
      expect(result?.initial).toBe('xi');
      expect(result?.final).toBe('ong');
      expect(result?.actor).toBe('Shakira');
      expect(result?.set).toBe(mockSets['-ong']);
      expect(result?.tone).toBe('1');
    });

    it('should use fallback actor for no initial (二 - èr)', async () => {
      const promise = service.getMovieScene('èr');
      const actorsReq = httpMock.expectOne('/api/data/actors');
      actorsReq.flush(mockActors);

      const setsReq = httpMock.expectOne('/api/data/sets');
      setsReq.flush(mockSets);

      const result = await promise;
      expect(result).toBeTruthy();
      expect(result?.initial).toBe('ø');
      expect(result?.final).toBe('er');
      expect(result?.actor).toBe('Jackie Chan');
      expect(result?.set).toBe(mockSets['null']);
      expect(result?.tone).toBe('4');
    });

    it('should correctly parse compound final (小 - xiǎo)', async () => {
      const promise = service.getMovieScene('xiǎo');
      const actorsReq = httpMock.expectOne('/api/data/actors');
      actorsReq.flush(mockActors);

      const setsReq = httpMock.expectOne('/api/data/sets');
      setsReq.flush(mockSets);

      const result = await promise;
      expect(result).toBeTruthy();
      expect(result?.initial).toBe('xi');
      expect(result?.final).toBe('ao');
      expect(result?.actor).toBe('Shakira');
      expect(result?.set).toBe(mockSets['-ao']);
      expect(result?.tone).toBe('3');
    });

    it('should correctly parse special initial mapping (家 - jiā)', async () => {
      const promise = service.getMovieScene('jiā');
      const actorsReq = httpMock.expectOne('/api/data/actors');
      actorsReq.flush(mockActors);

      const setsReq = httpMock.expectOne('/api/data/sets');
      setsReq.flush(mockSets);

      const result = await promise;
      expect(result).toBeTruthy();
      expect(result?.initial).toBe('ji');
      expect(result?.final).toBe('a');
      expect(result?.actor).toBe('Jamie (your sister)');
      expect(result?.set).toBe(mockSets['-a']);
      expect(result?.tone).toBe('1');
    });

    it('should correctly parse zhi with no final (知 - zhī)', async () => {
      const promise = service.getMovieScene('zhī');
      const actorsReq = httpMock.expectOne('/api/data/actors');
      actorsReq.flush(mockActors);

      const setsReq = httpMock.expectOne('/api/data/sets');
      setsReq.flush(mockSets);

      const result = await promise;
      expect(result).toBeTruthy();
      expect(result?.initial).toBe('zh');
      expect(result?.final).toBe('');
      expect(result?.actor).toBe('Jim Carrey');
      expect(result?.set).toBe(mockSets['null']);
      expect(result?.tone).toBe('1');
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
  });
});
