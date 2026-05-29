import { IsString, IsNumber, IsOptional, Min, MaxLength } from 'class-validator';

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
  @MaxLength(1000)
  notes?: string;
}
