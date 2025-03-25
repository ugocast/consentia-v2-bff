import { Test, TestingModule } from '@nestjs/testing';
import { BulkOperationsController } from './bulk-operations.controller';

describe('BulkOperationsController', () => {
  let controller: BulkOperationsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BulkOperationsController],
    }).compile();

    controller = module.get<BulkOperationsController>(BulkOperationsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
