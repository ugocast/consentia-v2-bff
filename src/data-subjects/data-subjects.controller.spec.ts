import { Test, TestingModule } from '@nestjs/testing';
import { DataSubjectsController } from './data-subjects.controller';

describe('DataSubjectsController', () => {
  let controller: DataSubjectsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DataSubjectsController],
    }).compile();

    controller = module.get<DataSubjectsController>(DataSubjectsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
