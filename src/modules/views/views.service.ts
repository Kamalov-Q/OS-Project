import { Injectable } from '@nestjs/common';
import { CreateViewDto } from './dto/create-view.dto';
import { UpdateViewDto } from './dto/update-view.dto';

@Injectable()
export class ViewsService {
  create(createViewDto: CreateViewDto) {
    return 'This action adds a new view';
  }

  findAll() {
    return `This action returns all views`;
  }

  findOne(id: number) {
    return `This action returns a #${id} view`;
  }

  update(id: number, updateViewDto: UpdateViewDto) {
    return `This action updates a #${id} view`;
  }

  remove(id: number) {
    return `This action removes a #${id} view`;
  }
}
