import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Req, UseGuards,
} from '@nestjs/common';
import { DiscoveryService } from './discovery.service';
import { AuthGuard } from '../auth/auth.guard';
import { CreateDiscoveryItemDto, UpdateDiscoveryItemDto } from './discovery.dto';

@Controller('discovery')
@UseGuards(AuthGuard)
export class DiscoveryController {
  constructor(private readonly discoveryService: DiscoveryService) {}

  @Get()
  findAll(@Req() req: any) {
    return this.discoveryService.findAllForUser(req.user.id, req.user.email);
  }

  @Post()
  create(@Req() req: any, @Body() dto: CreateDiscoveryItemDto) {
    return this.discoveryService.create(req.user.id, req.user.email, dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Req() req: any, @Body() dto: UpdateDiscoveryItemDto) {
    return this.discoveryService.update(id, req.user.id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: any) {
    return this.discoveryService.remove(id, req.user.id);
  }
}
