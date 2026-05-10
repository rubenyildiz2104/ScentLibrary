import { Test, TestingModule } from '@nestjs/testing';
import { PerfumesService } from './perfumes.service';

describe('PerfumesService', () => {
  let service: PerfumesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PerfumesService],
    }).compile();

    service = module.get<PerfumesService>(PerfumesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
