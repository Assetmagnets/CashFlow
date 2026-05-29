import { IsString, IsNumber, IsDateString, IsOptional, Min, MinLength, MaxLength, IsObject } from 'class-validator';

export class CreateExpenseDto {
  @IsString()
  siteId: string;

  @IsString()
  categoryId: string;

  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsString()
  @MinLength(2)
  @MaxLength(255)
  vendorName: string;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  description?: string;

  @IsDateString()
  expenseDate: string;

  @IsOptional()
  @IsObject()
  receipt?: {
    fileName: string;
    originalName: string;
    filePath: string;
    mimeType: string;
    size: number;
  };
}

