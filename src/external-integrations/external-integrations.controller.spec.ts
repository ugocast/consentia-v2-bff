import { Test, TestingModule } from '@nestjs/testing';
import { ExternalIntegrationsController } from './external-integrations.controller';

describe('ExternalIntegrationsController', () => {
  let controller: ExternalIntegrationsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ExternalIntegrationsController],
    }).compile();

    controller = module.get<ExternalIntegrationsController>(ExternalIntegrationsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
