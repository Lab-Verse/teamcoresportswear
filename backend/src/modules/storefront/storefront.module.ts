import { Module } from '@nestjs/common';
import { StripeModule } from '../stripe/stripe.module';
import { StorefrontController } from './storefront.controller';
import { StorefrontService } from './storefront.service';
@Module({
  imports: [StripeModule],
  controllers: [StorefrontController],
  providers: [StorefrontService],
  exports: [StorefrontService],
})
export class StorefrontModule {}
