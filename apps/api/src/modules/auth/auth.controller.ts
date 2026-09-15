import { Controller, Post, Body, Req, UseGuards, Get } from '@nestjs/common';
import { AuthService, RegisterDto, LoginDto } from './auth.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() dto: RegisterDto, @Req() req: any) {
    const ipAddress = req.ip || req.connection?.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.authService.register(dto, ipAddress, userAgent);
  }

  @Post('login')
  async login(@Body() dto: LoginDto, @Req() req: any) {
    const ipAddress = req.ip || req.connection?.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.authService.login(dto, ipAddress, userAgent);
  }

  @Post('refresh')
  async refreshToken(@Body('refreshToken') refreshToken: string, @Req() req: any) {
    const ipAddress = req.ip || req.connection?.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.authService.refreshToken(refreshToken, ipAddress, userAgent);
  }

  @Post('logout')
  async logout(
    @Body('refreshToken') refreshToken: string,
    @Req() req: any,
  ) {
    const ipAddress = req.ip || req.connection?.remoteAddress;
    const userAgent = req.headers['user-agent'];
    // userId derived from the refresh token inside the service — no JWT guard needed
    return this.authService.logout(refreshToken, undefined, ipAddress, userAgent);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@CurrentUser() user: any) {
    return { user };
  }
}
