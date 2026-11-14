import { Type, Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsDefined,
  IsEmail,
  IsInt,
  IsISO31661Alpha2,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
export class BasketLineDto {
  @IsUUID() variantId: string;
  @IsInt() @Min(1) @Max(1000000) quantity: number;
}
export class BasketDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => BasketLineDto)
  items: BasketLineDto[];
}
export class AddressDto {
  @IsString() @Length(3, 300) shippingLine1: string;
  @IsString() @Length(2, 100) shippingCity: string;
  @Transform(({ value }) =>
    typeof value === 'string' ? value.toUpperCase() : value,
  )
  @IsISO31661Alpha2()
  shippingCountry: string;
  @IsOptional() @IsString() @MaxLength(100) shippingState?: string;
  @IsOptional() @IsString() @MaxLength(20) shippingPostalCode?: string;
}
export class PreviewDto extends BasketDto {
  @IsDefined() @ValidateNested() @Type(() => AddressDto) address: AddressDto;
}
export class StorefrontCheckoutDto extends PreviewDto {
  @IsUUID() idempotencyKey: string;
}
export class ContactDto {
  @IsString() @Length(2, 200) name: string;
  @IsEmail() @MaxLength(320) email: string;
  @IsString() @Length(3, 200) subject: string;
  @IsString() @Length(10, 5000) message: string;
}
