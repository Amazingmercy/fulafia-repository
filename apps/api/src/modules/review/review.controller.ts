import { Controller, Get, Post, Param, Body, UseGuards, Req } from '@nestjs/common';
import { ReviewService } from './review.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole, ReviewAction } from '@fulafia/shared';

@Controller('review')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Get('queue')
  @Roles(UserRole.SUPERVISOR, UserRole.REVIEWER, UserRole.ADMIN)
  async getQueue(@CurrentUser() user: any) {
    return this.reviewService.getReviewQueue(user);
  }

  @Post(':id/action')
  @Roles(UserRole.SUPERVISOR, UserRole.REVIEWER, UserRole.ADMIN)
  async processAction(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body('action') action: ReviewAction,
    @Body('comments') comments: string,
    @Req() req: any,
  ) {
    const ipAddress = req.ip || req.connection?.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.reviewService.processReview(id, user.id, user.role, action, comments, ipAddress, userAgent);
  }
}
