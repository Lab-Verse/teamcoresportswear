import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { RoleEnum } from '../roles/role.enum';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import {
  BasketDto,
  ContactDto,
  PreviewDto,
  StorefrontCheckoutDto,
} from './storefront.dto';
import { StorefrontService } from './storefront.service';
@Controller('storefront')
export class StorefrontController {
  constructor(private readonly service: StorefrontService) {}
  @Get('products') @Public() products(@Query() query: Record<string, string>) {
    return this.service.products(query);
  }
  @Get('products/:slug') @Public() product(@Param('slug') slug: string) {
    return this.service.product(slug);
  }
  @Get('products/:slug/reviews') @Public() reviews(
    @Param('slug') slug: string,
  ) {
    return this.service.reviews(slug);
  }
  @Get('categories') @Public() categories() {
    return this.service.categories();
  }
  @Post('basket') @Public() basket(@Body() dto: BasketDto) {
    return this.service.resolve(dto.items);
  }
  @Post('checkout/preview') preview(@Body() dto: PreviewDto) {
    return this.service.preview(dto);
  }
  @Post('checkout') checkout(
    @CurrentUser() user: { id: string; email: string },
    @Body() dto: StorefrontCheckoutDto,
  ) {
    return this.service.checkout(user, dto);
  }
  @Post('orders/:id/pay') pay(
    @CurrentUser() user: { id: string; email: string },
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.service.pay(user, id);
  }
  @Get('orders/:id/payment') payment(
    @CurrentUser() user: { id: string },
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.service.payment(user.id, id);
  }
  @Post('contact')
  @Public()
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  contact(@Body() dto: ContactDto) {
    return this.service.contact(dto);
  }
  @Get('contacts')
  @UseGuards(RolesGuard)
  @Roles(RoleEnum.ADMIN, RoleEnum.SUPER_ADMIN)
  contacts() {
    return this.service.contacts();
  }
}
