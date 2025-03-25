import { Test, TestingModule } from '@nestjs/testing';
import { DataSubjectsService } from './data-subjects.service';

describe('DataSubjectsService', () => {
  let service: DataSubjectsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DataSubjectsService],
    }).compile();

    service = module.get<DataSubjectsService>(DataSubjectsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
