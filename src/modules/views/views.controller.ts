import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ViewsService } from './views.service';
import { CreateViewDto } from './dto/create-view.dto';
import { UpdateViewDto } from './dto/update-view.dto';

@Controller('views')
export class ViewsController {
  constructor(private readonly viewsService: ViewsService) {}

  @Post()
  create(@Body() createViewDto: CreateViewDto) {
    return this.viewsService.create(createViewDto);
  }

  @Get()
  findAll() {
    return this.viewsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.viewsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateViewDto: UpdateViewDto) {
    return this.viewsService.update(+id, updateViewDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.viewsService.remove(+id);
  }
}
