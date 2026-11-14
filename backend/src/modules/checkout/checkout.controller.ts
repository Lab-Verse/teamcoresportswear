import {
  Body,
  Controller,
  Post,
  UseGuards,
  GoneException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateCheckoutDto } from './dto/create-checkout.dto';

@ApiTags('Checkout')
@Controller('checkout')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class CheckoutController {
  @Post()
  checkout(@CurrentUser() user: any, @Body() dto: CreateCheckoutDto) {
    void user;
    void dto;
    throw new GoneException(
      'Use /storefront/checkout to calculate authoritative delivery and payment totals',
    );
  }
}
