import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { PerfumesModule } from './perfumes/perfumes.module';
import { AuthModule } from './auth/auth.module';
import { CollectionModule } from './collection/collection.module';
import { DiscoveryModule } from './discovery/discovery.module';

@Module({
  imports: [PrismaModule, PerfumesModule, AuthModule, CollectionModule, DiscoveryModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
