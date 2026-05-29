import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { MailService } from '../mail/mail.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private mailService: MailService,
  ) {}

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = this.jwtService.sign(payload);

    const { password: _, ...userWithoutPassword } = user;
    return {
      accessToken,
      user: userWithoutPassword,
    };
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return user;
  }

  // Create HMAC signature using the server's private JWT_SECRET
  private generateOtpHash(otp: string): string {
    const secret = process.env.JWT_SECRET || 'fallback_secret';
    return crypto.createHmac('sha256', secret).update(otp).digest('hex');
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Don't leak if email exists or not, just return success
      return { message: 'If that email exists, an OTP has been sent.', otpSessionToken: '' };
    }

    // SECURITY PATCH: Use cryptographically secure random number generator instead of Math.random
    const otp = crypto.randomInt(100000, 999999).toString();
    
    // SECURITY PATCH: Use server-secret HMAC instead of bcrypt to prevent offline dictionary attacks on the leaked JWT
    const otpHash = this.generateOtpHash(otp);

    // Sign a temporary token valid for 5 minutes containing the OTP HMAC
    const payload = { sub: user.id, email: user.email, type: 'reset-password', otpHash };
    const otpSessionToken = this.jwtService.sign(payload, { expiresIn: '5m' });

    await this.mailService.sendPasswordResetEmail(user.email, user.name, otp);

    return { 
      message: 'An OTP has been sent to your email.',
      otpSessionToken 
    };
  }

  async resetPassword(otpSessionToken: string, otp: string, newPassword: string) {
    try {
      const payload = this.jwtService.verify(otpSessionToken);
      if (payload.type !== 'reset-password' || !payload.otpHash) {
        throw new UnauthorizedException('Invalid session token');
      }

      // SECURITY PATCH: Reconstruct the HMAC locally using the server secret
      const expectedHash = this.generateOtpHash(otp);
      
      // SECURITY PATCH: Use timingSafeEqual to prevent side-channel timing attacks
      const expectedBuffer = Buffer.from(expectedHash, 'hex');
      const providedBuffer = Buffer.from(payload.otpHash, 'hex');
      
      if (expectedBuffer.length !== providedBuffer.length || !crypto.timingSafeEqual(expectedBuffer, providedBuffer)) {
        throw new UnauthorizedException('Invalid or expired OTP');
      }

      const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
      if (!user) {
        throw new UnauthorizedException('Invalid user');
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await this.prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword },
      });

      return { message: 'Password has been successfully reset' };
    } catch (error: any) {
      if (error instanceof UnauthorizedException) throw error;
      throw new UnauthorizedException('Invalid or expired OTP session');
    }
  }
}
