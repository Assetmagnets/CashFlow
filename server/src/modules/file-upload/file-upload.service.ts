import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';

@Injectable()
export class FileUploadService {
  private readonly logger = new Logger(FileUploadService.name);

  constructor() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  async uploadImage(file: Express.Multer.File): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!process.env.CLOUDINARY_CLOUD_NAME) {
        return reject(new BadRequestException('Cloudinary is not configured.'));
      }

      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'cashflow_receipts',
          resource_type: 'auto', // Automatically detects if it's an image or raw file (PDF)
        },
        (error, result) => {
          if (error) {
            this.logger.error('Cloudinary upload failed', error);
            return reject(new BadRequestException('File upload to cloud failed.'));
          }

          resolve({
            fileName: file.originalname,
            originalName: file.originalname,
            filePath: result?.secure_url,
            mimeType: file.mimetype,
            size: result?.bytes || file.size,
          });
        },
      );

      // Pipe the buffer to Cloudinary
      uploadStream.end(file.buffer);
    });
  }
}
