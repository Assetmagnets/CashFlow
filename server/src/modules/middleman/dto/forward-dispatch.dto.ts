import { IsString, IsNumber, IsOptional, Min } from 'class-validator';

export class ForwardDispatchDto {
  @IsNumber()
  @Min(0)
  commissionAmount: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
