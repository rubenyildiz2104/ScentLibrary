import { Controller, Get, Param, Query, Patch, Body, UseGuards } from '@nestjs/common';
import { PerfumesService } from './perfumes.service';
import { AuthGuard } from '../auth/auth.guard';

@Controller('perfumes')
export class PerfumesController {
  constructor(private readonly perfumesService: PerfumesService) {}

  @Get()
  findAll(@Query('page') page?: string, @Query('limit') limit?: string, @Query('gender') gender?: string) {
    return this.perfumesService.findAll(Number(page) || 1, Number(limit) || 50, gender);
  }

  @Get('search')
  search(@Query('q') query: string, @Query('page') page?: string, @Query('limit') limit?: string) {
    if (!query) return [];
    return this.perfumesService.search(query, Number(page) || 1, Number(limit) || 50);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.perfumesService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(AuthGuard)
  update(@Param('id') id: string, @Body() data: any) {
    return this.perfumesService.update(id, data);
  }
}
