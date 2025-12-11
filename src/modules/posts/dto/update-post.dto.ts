import { PartialType } from '@nestjs/mapped-types';
import { CreatePostDto } from './create-post.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class UpdatePostDto extends PartialType(CreatePostDto) {
  @ApiProperty({
    example: 'Hi there',
    description: 'Content for a post',
  })
  @IsString()
  @IsNotEmpty()
  content: string;
}
