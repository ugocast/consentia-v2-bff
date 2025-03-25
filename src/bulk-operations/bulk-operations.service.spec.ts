import { Test, TestingModule } from '@nestjs/testing';
import { BulkOperationsService } from './bulk-operations.service';

describe('BulkOperationsService', () => {
  let service: BulkOperationsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BulkOperationsService],
    }).compile();

    service = module.get<BulkOperationsService>(BulkOperationsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
