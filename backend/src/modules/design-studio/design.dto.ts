import {
  IsBoolean,
  IsDefined,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  Length,
  IsIn,
  ValidateNested,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateWholesaleInquiryDto } from '../wholesale/dto/create-wholesale-inquiry.dto';
import { OmitType } from '@nestjs/mapped-types';
import { DesignDocument, TemplateSpec } from './design-contract';
export class SaveDesignDto {
  @IsString() @Length(1, 120) name: string;
  @IsObject() document: DesignDocument;
  @IsInt() @Min(0) version: number;
}
export class TemplateDto {
  @IsString() @Length(2, 120) name: string;
  @IsUUID() productId: string;
  @IsObject() spec: TemplateSpec;
}
export class ContactDto extends OmitType(CreateWholesaleInquiryDto, [
  'items',
] as const) {}
export class SubmitDesignDto {
  @IsUUID() submissionKey: string;
  @IsInt() @Min(1) version: number;
  @IsBoolean() warningsAccepted: boolean;
  @IsDefined() @ValidateNested() @Type(() => ContactDto) contact: ContactDto;
  @IsOptional() @IsDateString() desiredDate?: string;
}
export class ProofDto {
  @IsUUID() assetId: string;
  @IsString() @Length(5, 3000) notes: string;
  @IsString() @Length(5, 3000) capacityNotes: string;
}
export class DecisionDto {
  @IsIn(['approved', 'rejected']) decision: 'approved' | 'rejected';
  @IsString() @MaxLength(2000) notes: string;
}
export class ReviewDto {
  @IsString() @Length(5, 2000) notes: string;
}
