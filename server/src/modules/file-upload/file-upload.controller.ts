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

@Controller('uploads')
export class FileUploadController {
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
        fileSize: 4 * 1024 * 1024, // 4MB limit to fit within Vercel's 4.5MB serverless payload limit
      },
    }),
  )
  uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    const base64 = file.buffer.toString('base64');
    const dataUrl = `data:${file.mimetype};base64,${base64}`;
    return {
      fileName: file.originalname,
      originalName: file.originalname,
      filePath: dataUrl,
      mimeType: file.mimetype,
      size: file.size,
    };
  }
}
