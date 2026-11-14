import { Module } from '@nestjs/common';
import { GuardsModule } from '../../common/modules/guards.module';
import { DesignService } from './design.service';
import { DesignController } from './design.controller';
import { DesignMailService } from './design-mail.service';
@Module({
  imports: [GuardsModule],
  controllers: [DesignController],
  providers: [DesignService, DesignMailService],
  exports: [DesignService],
})
export class DesignModule {}
