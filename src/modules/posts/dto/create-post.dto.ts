import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreatePostDto {
  @ApiProperty({
    example: 'Hi there',
    description: 'Content for a post',
  })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiPropertyOptional({
    example: '/img.png',
    description: 'Image for a post',
  })
  @IsString()
  @IsOptional()
  imageUrl?: string;
}
