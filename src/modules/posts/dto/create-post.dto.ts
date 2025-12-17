import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';

class PostImageDto {
  @IsString()
  url: string;
}

export class CreatePostDto {
  @ApiProperty({
    example: 'Hi there',
    description: 'Content for a post',
  })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiPropertyOptional({
    example: [{ url: '/image.png' }],
    type: [Object],
    description: 'Image for a post',
  })
  @IsString()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => PostImageDto)
  imageUrls?: PostImageDto[];
}
