import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Req, UseGuards,
} from '@nestjs/common';
import { CollectionService } from './collection.service';
import { AuthGuard } from '../auth/auth.guard';
import { CreateCollectionItemDto, UpdateCollectionItemDto } from './collection.dto';

@Controller('collection')
@UseGuards(AuthGuard)
export class CollectionController {
  constructor(private readonly collectionService: CollectionService) {}

  @Get()
  findAll(@Req() req: any) {
    return this.collectionService.findAllForUser(req.user.id, req.user.email);
  }

  @Post()
  create(@Req() req: any, @Body() dto: CreateCollectionItemDto) {
    return this.collectionService.create(req.user.id, req.user.email, dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Req() req: any, @Body() dto: UpdateCollectionItemDto) {
    return this.collectionService.update(id, req.user.id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: any) {
    return this.collectionService.remove(id, req.user.id);
  }
}
