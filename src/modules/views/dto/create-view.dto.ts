import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateViewDto {
  @ApiProperty({
    example: 'post-id123',
    description: 'Post ID to mark as viewed',
  })
  @IsString()
  postId: string;
}
