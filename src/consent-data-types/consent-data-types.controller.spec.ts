import { Test, TestingModule } from '@nestjs/testing';
import { ConsentDataTypesController } from './consent-data-types.controller';

describe('ConsentDataTypesController', () => {
  let controller: ConsentDataTypesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ConsentDataTypesController],
    }).compile();

    controller = module.get<ConsentDataTypesController>(ConsentDataTypesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
