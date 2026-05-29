import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { memoryStorage } from 'multer';
import { extname } from 'path';
import { FileUploadService } from './file-upload.service';

@Controller('uploads')
export class FileUploadController {
  constructor(private readonly fileUploadService: FileUploadService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      fileFilter: (req, file, callback) => {
        const allowedTypes = /jpeg|jpg|png|gif|pdf|webp/;
        const mimeType = allowedTypes.test(file.mimetype);
        const extName = allowedTypes.test(extname(file.originalname).toLowerCase());

        if (mimeType && extName) {
          return callback(null, true);
        }
        callback(new BadRequestException('Only images and PDF documents are allowed!'), false);
      },
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
      },
    }),
  )
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    
    // Stream directly to Cloudinary instead of using Base64
    return await this.fileUploadService.uploadImage(file);
  }
}
