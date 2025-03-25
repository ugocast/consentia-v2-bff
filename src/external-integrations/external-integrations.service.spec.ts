import { Test, TestingModule } from '@nestjs/testing';
import { ExternalIntegrationsService } from './external-integrations.service';

describe('ExternalIntegrationsService', () => {
  let service: ExternalIntegrationsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ExternalIntegrationsService],
    }).compile();

    service = module.get<ExternalIntegrationsService>(ExternalIntegrationsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
