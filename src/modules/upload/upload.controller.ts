import {
  BadRequestException,
  Controller,
  Post,
  Req,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { type Request } from 'express';

function imageFileFilter(req: any, file: Express.Multer.File, cb: any) {
  if (!file.mimetype.match(/^image\/(jpg|jpeg|png|webp|gif)$/)) {
    return cb(new BadRequestException('Only image files are allowed!'), false);
  }
  cb(null, true);
}

function editFileName(req: any, file: Express.Multer.File, cb: any) {
  const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
  cb(null, `${unique}${extname(file.originalname).toLowerCase()}`);
}
@ApiTags('Uploads')
@Controller('uploads')
export class UploadController {
  @Post() 
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
        },
      },
      required: ['files'],
    },
  })
  @UseInterceptors(
    FilesInterceptor('files', 10, {
      storage: diskStorage({
        destination: './public/uploads',
        filename: editFileName,
      }),
      fileFilter: imageFileFilter,
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  uploadImage(
    @UploadedFiles() files: Express.Multer.File[],
    @Req() req: Request,
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('At least 1 image is required');
    }

    const baseurl = `${req.protocol}://${req.get('host')}`;

    return {
      success: true,
      count: files.length,
      files: files.map((f) => ({
        filename: f.filename,
        mimetype: f.mimetype,
        size: f.size,
        url: `${baseurl}/public/uploads/${f.filename}`,
      })),
    };
  }
}
