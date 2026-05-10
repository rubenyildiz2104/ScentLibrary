import { Module } from '@nestjs/common';
import { PerfumesController } from './perfumes.controller';
import { PerfumesService } from './perfumes.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PerfumesController],
  providers: [PerfumesService]
})
export class PerfumesModule {}
