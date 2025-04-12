import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { EmailService } from './email.service';

// Mock para Resend
jest.mock('resend', () => {
  return {
    Resend: jest.fn().mockImplementation(() => ({
      emails: {
        send: jest.fn().mockImplementation(() => 
          Promise.resolve({ 
            data: { id: 'mock-email-id' }, 
            error: null 
          })
        ),
      },
    })),
  };
});

describe('EmailService', () => {
  let service: EmailService;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'RESEND_API_KEY') return 'mock-api-key';
              if (key === 'RESEND_FROM_EMAIL') return 'test@consentia.io';
              return null;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<EmailService>(EmailService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendEmail', () => {
    it('should send an email successfully', async () => {
      const result = await service.sendEmail({
        to: 'recipient@example.com',
        subject: 'Test Subject',
        html: '<p>Test content</p>',
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual({ id: 'mock-email-id' });
    });

    it('should handle errors when sending fails', async () => {
      // Mock para simular un error
      jest.spyOn(service['resend'].emails, 'send').mockImplementationOnce(() => 
        Promise.resolve({ 
          data: null, 
          error: { message: 'Failed to send', name: 'invalid_parameter' as any, statusCode: 500 } 
        })
      );

      const result = await service.sendEmail({
        to: 'recipient@example.com',
        subject: 'Test Subject',
        html: '<p>Test content</p>',
      });

      expect(result.success).toBe(false);
      expect(result.error).toEqual({ message: 'Failed to send', name: 'invalid_parameter', statusCode: 500 });
    });
  });

  describe('sendInvitationEmail', () => {
    it('should send an invitation email with correct parameters', async () => {
      const spy = jest.spyOn(service, 'sendEmail');
      
      await service.sendInvitationEmail({
        email: 'user@example.com',
        inviterName: 'John Doe',
        companyName: 'Test Company',
        role: 'ADMIN',
        invitationLink: 'https://example.com/invite/token',
        expirationDate: new Date('2023-12-31'),
        customMessage: 'Please join our team',
      });

      expect(spy).toHaveBeenCalledWith(expect.objectContaining({
        to: 'user@example.com',
        subject: 'Invitación a Test Company en Consentia',
        html: expect.stringContaining('<h2 style="color: #333;">Invitación a Test Company</h2>'),
        text: expect.stringContaining('Invitación a Test Company'),
      }));
    });
  });

  describe('sendVerificationEmail', () => {
    it('should send a verification email with correct parameters', async () => {
      const spy = jest.spyOn(service, 'sendEmail');
      
      await service.sendVerificationEmail({
        email: 'user@example.com',
        name: 'John Doe',
        verificationLink: 'https://example.com/verify/token',
        expirationHours: 24,
      });

      expect(spy).toHaveBeenCalledWith(expect.objectContaining({
        to: 'user@example.com',
        subject: 'Verifica tu correo electrónico - Consentia',
        html: expect.stringContaining('<h2 style="color: #333;">Verifica tu correo electrónico</h2>'),
        text: expect.stringContaining('Verifica tu correo electrónico'),
      }));
    });
  });

  describe('sendPasswordResetEmail', () => {
    it('should send a password reset email with correct parameters', async () => {
      const spy = jest.spyOn(service, 'sendEmail');
      
      await service.sendPasswordResetEmail({
        email: 'user@example.com',
        resetLink: 'https://example.com/reset/token',
        expirationMinutes: 30,
      });

      expect(spy).toHaveBeenCalledWith(expect.objectContaining({
        to: 'user@example.com',
        subject: 'Restablecimiento de contraseña - Consentia',
        html: expect.stringContaining('<h2 style="color: #333;">Restablecimiento de contraseña</h2>'),
        text: expect.stringContaining('Restablecimiento de contraseña'),
      }));
    });
  });
}); 