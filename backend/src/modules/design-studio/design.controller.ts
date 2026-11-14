import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { Response } from 'express';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RoleEnum } from '../roles/role.enum';
import { Actor, DesignService } from './design.service';
import {
  DecisionDto,
  ProofDto,
  ReviewDto,
  SaveDesignDto,
  SubmitDesignDto,
  TemplateDto,
} from './design.dto';
@Controller('design-studio')
export class DesignController {
  constructor(private service: DesignService) {}
  @Public() @Get('templates') templates() {
    return this.service.templates();
  }
  @Public() @Get('availability') availability() {
    return { enabled: this.service.enabled() };
  }
  @Public() @Get('templates/:id/images/:side') async garment(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('side') side: string,
    @Res() res: Response,
  ) {
    res
      .set({
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=3600',
        'X-Content-Type-Options': 'nosniff',
      })
      .send(await this.service.garmentImage(id, side));
  }
  @Get('projects') list(@CurrentUser() actor: Actor) {
    return this.service.list(actor);
  }
  @Post('projects') create(
    @CurrentUser() actor: Actor,
    @Body() dto: SaveDesignDto,
  ) {
    return this.service.save(actor, dto);
  }
  @Get('projects/:id') detail(
    @CurrentUser() actor: Actor,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.service.detail(id, actor);
  }
  @Patch('projects/:id') save(
    @CurrentUser() actor: Actor,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SaveDesignDto,
  ) {
    return this.service.save(actor, dto, id);
  }
  @Post('projects/:id/submit') submit(
    @CurrentUser() actor: Actor,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SubmitDesignDto,
  ) {
    return this.service.submit(id, actor, dto);
  }
  @Post('assets')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024, files: 1 },
    }),
  )
  upload(
    @CurrentUser() actor: Actor,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.service.upload(actor, file);
  }
  @Get('assets/:id') async asset(
    @CurrentUser() actor: Actor,
    @Param('id', ParseUUIDPipe) id: string,
    @Query('original') original: string,
    @Res() res: Response,
  ) {
    const bytes = await this.service.asset(id, actor, original === 'true');
    res
      .set({
        'Cache-Control': 'private, no-store',
        'X-Content-Type-Options': 'nosniff',
        'Content-Type':
          original === 'true' ? 'application/octet-stream' : 'image/png',
        'Content-Disposition': `${original === 'true' ? 'attachment' : 'inline'}; filename="${id}${original === 'true' ? '.original' : '.png'}"`,
      })
      .send(bytes);
  }
  @Post('proofs/:id/decision') decide(
    @CurrentUser() actor: Actor,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: DecisionDto,
  ) {
    return this.service.decide(id, actor, dto);
  }
  @Get('revisions/:id/specification') specification(
    @CurrentUser() actor: Actor,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.service.specification(id, actor);
  }
  @Get('revisions/:id/preview/:side') async preview(
    @CurrentUser() actor: Actor,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('side') side: string,
    @Res() res: Response,
  ) {
    const svg = await this.service.preview(id, actor, side);
    res
      .set({
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'private, no-store',
        'X-Content-Type-Options': 'nosniff',
        'Content-Security-Policy':
          "sandbox; default-src 'none'; img-src data:; style-src 'unsafe-inline'",
      })
      .send(svg);
  }
  @Get('admin/templates')
  @UseGuards(RolesGuard)
  @Roles(RoleEnum.ADMIN, RoleEnum.SUPER_ADMIN)
  adminTemplates() {
    return this.service.templates(true);
  }
  @Get('admin/mail')
  @UseGuards(RolesGuard)
  @Roles(RoleEnum.ADMIN, RoleEnum.SUPER_ADMIN)
  mailStatus() {
    return this.service.mailStatus();
  }
  @Post('admin/mail/:id/retry')
  @UseGuards(RolesGuard)
  @Roles(RoleEnum.ADMIN, RoleEnum.SUPER_ADMIN)
  retryMail(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.retryMail(id);
  }
  @Post('admin/templates')
  @UseGuards(RolesGuard)
  @Roles(RoleEnum.ADMIN, RoleEnum.SUPER_ADMIN)
  template(@CurrentUser() actor: Actor, @Body() dto: TemplateDto) {
    return this.service.createTemplate(actor, dto);
  }
  @Post('admin/templates/:id/publish')
  @UseGuards(RolesGuard)
  @Roles(RoleEnum.ADMIN, RoleEnum.SUPER_ADMIN)
  publish(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.publish(id);
  }
  @Post('admin/templates/:id/retire')
  @UseGuards(RolesGuard)
  @Roles(RoleEnum.ADMIN, RoleEnum.SUPER_ADMIN)
  retire(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.publish(id, true);
  }
  @Post('admin/revisions/:id/proofs')
  @UseGuards(RolesGuard)
  @Roles(RoleEnum.ADMIN, RoleEnum.SUPER_ADMIN)
  proof(
    @CurrentUser() actor: Actor,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ProofDto,
  ) {
    return this.service.proof(id, actor, dto);
  }
  @Post('admin/revisions/:id/changes')
  @UseGuards(RolesGuard)
  @Roles(RoleEnum.ADMIN, RoleEnum.SUPER_ADMIN)
  changes(
    @CurrentUser() actor: Actor,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReviewDto,
  ) {
    return this.service.changes(id, actor, dto.notes);
  }
  @Post('admin/revisions/:id/release')
  @UseGuards(RolesGuard)
  @Roles(RoleEnum.ADMIN, RoleEnum.SUPER_ADMIN)
  release(@CurrentUser() actor: Actor, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.release(id, actor);
  }
}
