import { IsString, IsNumber, IsDateString, IsOptional, Min } from 'class-validator';

export class CreateDispatchDto {
  @IsString()
  siteId: string;

  @IsNumber()
  @Min(1)
  amount: number;

  @IsString()
  carrierName: string;

  @IsString()
  purpose: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsDateString()
  dispatchDate: string;

  @IsOptional()
  @IsString()
  middlemanId?: string;
}

