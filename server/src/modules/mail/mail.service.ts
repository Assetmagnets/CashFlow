import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import * as nodemailer from 'nodemailer';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger(MailService.name);

  constructor(private prisma: PrismaService) {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  @OnEvent('notification.created')
  async handleNotificationCreated(payload: any) {
    try {
      if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        this.logger.warn('SMTP credentials not provided. Skipping email notification.');
        return;
      }

      // Fetch the user's email address
      const user = await this.prisma.user.findUnique({
        where: { id: payload.userId },
        select: { email: true, name: true },
      });

      if (!user || !user.email) {
        this.logger.warn(`Could not find email for user ID: ${payload.userId}`);
        return;
      }

      const mailOptions = {
        from: process.env.SMTP_FROM || '"CashFlow Notifications" <no-reply@cashflow.com>',
        to: user.email,
        subject: `New Notification: ${payload.title}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
            <h2 style="color: #f59e0b;">CashFlow Site Manager</h2>
            <p style="color: #333; font-size: 16px;">Hello <strong>${user.name}</strong>,</p>
            <div style="background-color: #f8fafc; padding: 15px; border-left: 4px solid #f59e0b; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #0f172a;">${payload.title}</h3>
              <p style="margin-bottom: 0; color: #475569; white-space: pre-wrap;">${payload.message}</p>
            </div>
            <p style="color: #64748b; font-size: 14px;">Please log in to your dashboard to view the full details.</p>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;" />
            <p style="color: #94a3b8; font-size: 12px; text-align: center;">This is an automated message from the CashFlow System. Please do not reply.</p>
          </div>
        `,
      };

      const info = await this.transporter.sendMail(mailOptions);
      this.logger.log(`Email sent successfully to ${user.email} (Message ID: ${info.messageId})`);
    } catch (error: any) {
      this.logger.error(`Failed to send email to user ${payload.userId}: ${error.message}`);
    }
  }

  async sendPasswordResetEmail(email: string, name: string, otp: string) {
    try {
      if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        this.logger.warn('SMTP credentials not provided. Skipping password reset email.');
        return;
      }

      const mailOptions = {
        from: process.env.SMTP_FROM || '"CashFlow Security" <no-reply@cashflow.com>',
        to: email,
        subject: 'Your Password Reset OTP',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
            <h2 style="color: #f59e0b;">CashFlow Site Manager</h2>
            <p style="color: #333; font-size: 16px;">Hello <strong>${name}</strong>,</p>
            <p style="color: #475569; font-size: 15px;">We received a request to reset your password. Please use the following One-Time Password (OTP) to proceed.</p>
            
            <div style="text-align: center; margin: 30px 0; background-color: #f8fafc; padding: 20px; border-radius: 10px; border: 1px dashed #cbd5e1;">
              <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #0f172a;">${otp}</span>
            </div>
            
            <p style="color: #ef4444; font-size: 14px; font-weight: bold;">This OTP will expire in exactly 5 minutes.</p>
            <p style="color: #475569; font-size: 14px;">If you didn't request this, please ignore this email.</p>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;" />
            <p style="color: #94a3b8; font-size: 12px; text-align: center;">This is an automated message from the CashFlow Security System. Please do not reply.</p>
          </div>
        `,
      };

      const info = await this.transporter.sendMail(mailOptions);
      this.logger.log(`Password reset OTP sent successfully to ${email} (Message ID: ${info.messageId})`);
    } catch (error: any) {
      this.logger.error(`Failed to send password reset OTP to ${email}: ${error.message}`);
    }
  }
}
