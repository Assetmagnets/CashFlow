import { IsString, IsNumber, IsOptional, Min } from 'class-validator';

export class CreateTransferDto {
  @IsString()
  fromSiteId: string;

  @IsString()
  toSiteId: string;

  @IsNumber()
  @Min(1)
  amount: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
