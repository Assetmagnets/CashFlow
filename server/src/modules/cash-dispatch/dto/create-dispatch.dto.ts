import { IsString, IsNumber, IsDateString, IsOptional, Min, MaxLength } from 'class-validator';

export class CreateDispatchDto {
  @IsString()
  siteId: string;

  @IsNumber()
  @Min(1)
  amount: number;

  @IsString()
  @MaxLength(255)
  carrierName: string;

  @IsString()
  @MaxLength(500)
  purpose: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;

  @IsDateString()
  dispatchDate: string;

  @IsOptional()
  @IsString()
  middlemanId?: string;
}

