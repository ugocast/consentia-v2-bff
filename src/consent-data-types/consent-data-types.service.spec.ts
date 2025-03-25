import { Test, TestingModule } from '@nestjs/testing';
import { ConsentDataTypesService } from './consent-data-types.service';

describe('ConsentDataTypesService', () => {
  let service: ConsentDataTypesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ConsentDataTypesService],
    }).compile();

    service = module.get<ConsentDataTypesService>(ConsentDataTypesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
