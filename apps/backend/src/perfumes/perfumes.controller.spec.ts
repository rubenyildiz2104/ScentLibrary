import { Test, TestingModule } from '@nestjs/testing';
import { PerfumesController } from './perfumes.controller';

describe('PerfumesController', () => {
  let controller: PerfumesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PerfumesController],
    }).compile();

    controller = module.get<PerfumesController>(PerfumesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
