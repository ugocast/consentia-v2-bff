import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  cc?: string[];
  bcc?: string[];
  replyTo?: string;
  from?: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly resend: Resend;
  private readonly defaultFromEmail: string;

  constructor(private configService: ConfigService) {
    const resendApiKey = this.configService.get<string>('RESEND_API_KEY');
    
    if (!resendApiKey) {
      this.logger.warn('RESEND_API_KEY is not set. Email sending will not work.');
    }
    
    this.resend = new Resend(resendApiKey);
    this.defaultFromEmail = this.configService.get<string>('RESEND_FROM_EMAIL') || 'onboarding@consentia.io';
  }

  /**
   * Send a generic email
   */
  async sendEmail(options: EmailOptions) {
    try {
      const { to, subject, html, text, cc, bcc, replyTo, from } = options;
      
      const { data, error } = await this.resend.emails.send({
        from: from || this.defaultFromEmail,
        to,
        subject,
        html,
        text,
        cc,
        bcc,
        replyTo,
      });

      if (error) {
        this.logger.error(`Failed to send email: ${error.message}`, error);
        return { success: false, error };
      }

      this.logger.log(`Email sent successfully to ${to} with ID: ${data?.id}`);
      return { success: true, data };
    } catch (error) {
      this.logger.error(`Exception while sending email: ${error.message}`, error);
      return { success: false, error };
    }
  }

  /**
   * Send an invitation email
   */
  async sendInvitationEmail(params: {
    email: string;
    inviterName: string;
    companyName: string;
    role: string;
    invitationLink: string;
    expirationDate: Date;
    customMessage?: string;
  }) {
    const { email, inviterName, companyName, role, invitationLink, expirationDate, customMessage } = params;

    const formattedExpirationDate = expirationDate.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Invitación a ${companyName}</h2>
        <p>Hola,</p>
        <p>${inviterName} te ha invitado a unirte a ${companyName} como ${role} en la plataforma Consentia.</p>
        ${customMessage ? `<p>Mensaje: "${customMessage}"</p>` : ''}
        <p>Para aceptar esta invitación, haz clic en el siguiente botón:</p>
        <p style="text-align: center; margin: 25px 0;">
          <a href="${invitationLink}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">
            Aceptar Invitación
          </a>
        </p>
        <p>O copia y pega el siguiente enlace en tu navegador:</p>
        <p>${invitationLink}</p>
        <p>Esta invitación expirará el ${formattedExpirationDate}.</p>
        <p>Si tienes alguna pregunta, puedes responder a este correo.</p>
        <p>Saludos,<br>El equipo de Consentia</p>
      </div>
    `;

    const text = `
      Invitación a ${companyName}
      
      Hola,
      
      ${inviterName} te ha invitado a unirte a ${companyName} como ${role} en la plataforma Consentia.
      ${customMessage ? `\nMensaje: "${customMessage}"` : ''}
      
      Para aceptar esta invitación, visita el siguiente enlace:
      ${invitationLink}
      
      Esta invitación expirará el ${formattedExpirationDate}.
      
      Si tienes alguna pregunta, puedes responder a este correo.
      
      Saludos,
      El equipo de Consentia
    `;

    return this.sendEmail({
      to: email,
      subject: `Invitación a ${companyName} en Consentia`,
      html,
      text,
    });
  }

  /**
   * Send an email verification
   */
  async sendVerificationEmail(params: {
    email: string;
    name: string;
    verificationLink: string;
    expirationHours: number;
  }) {
    const { email, name, verificationLink, expirationHours } = params;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Verifica tu correo electrónico</h2>
        <p>Hola ${name},</p>
        <p>Gracias por registrarte en Consentia. Para completar tu registro, necesitamos verificar tu dirección de correo electrónico.</p>
        <p>Por favor, haz clic en el siguiente botón para verificar tu correo:</p>
        <p style="text-align: center; margin: 25px 0;">
          <a href="${verificationLink}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">
            Verificar Email
          </a>
        </p>
        <p>O copia y pega el siguiente enlace en tu navegador:</p>
        <p>${verificationLink}</p>
        <p>Este enlace expirará en ${expirationHours} horas.</p>
        <p>Si no solicitaste esta verificación, puedes ignorar este correo.</p>
        <p>Saludos,<br>El equipo de Consentia</p>
      </div>
    `;

    const text = `
      Verifica tu correo electrónico
      
      Hola ${name},
      
      Gracias por registrarte en Consentia. Para completar tu registro, necesitamos verificar tu dirección de correo electrónico.
      
      Por favor, visita el siguiente enlace para verificar tu correo:
      ${verificationLink}
      
      Este enlace expirará en ${expirationHours} horas.
      
      Si no solicitaste esta verificación, puedes ignorar este correo.
      
      Saludos,
      El equipo de Consentia
    `;

    return this.sendEmail({
      to: email,
      subject: `Verifica tu correo electrónico - Consentia`,
      html,
      text,
    });
  }

  /**
   * Send a password reset email
   */
  async sendPasswordResetEmail(params: {
    email: string;
    resetLink: string;
    expirationMinutes: number;
  }) {
    const { email, resetLink, expirationMinutes } = params;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Restablecimiento de contraseña</h2>
        <p>Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en Consentia.</p>
        <p>Por favor, haz clic en el siguiente botón para crear una nueva contraseña:</p>
        <p style="text-align: center; margin: 25px 0;">
          <a href="${resetLink}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">
            Restablecer Contraseña
          </a>
        </p>
        <p>O copia y pega el siguiente enlace en tu navegador:</p>
        <p>${resetLink}</p>
        <p>Este enlace expirará en ${expirationMinutes} minutos.</p>
        <p>Si no solicitaste este restablecimiento de contraseña, puedes ignorar este correo.</p>
        <p>Saludos,<br>El equipo de Consentia</p>
      </div>
    `;

    const text = `
      Restablecimiento de contraseña
      
      Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en Consentia.
      
      Por favor, visita el siguiente enlace para crear una nueva contraseña:
      ${resetLink}
      
      Este enlace expirará en ${expirationMinutes} minutos.
      
      Si no solicitaste este restablecimiento de contraseña, puedes ignorar este correo.
      
      Saludos,
      El equipo de Consentia
    `;

    return this.sendEmail({
      to: email,
      subject: `Restablecimiento de contraseña - Consentia`,
      html,
      text,
    });
  }

  /**
   * Send a consent request email
   */
  async sendConsentRequestEmail(params: {
    email: string;
    firstName?: string;
    lastName?: string;
    companyName: string;
    policyTitle: string;
    purpose: string;
    consentLink: string;
    expirationDate: Date;
  }) {
    const { email, firstName, lastName, companyName, policyTitle, purpose, consentLink, expirationDate } = params;

    const name = firstName ? (lastName ? `${firstName} ${lastName}` : firstName) : 'Estimado/a usuario/a';

    const formattedExpirationDate = expirationDate.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Solicitud de Consentimiento</h2>
        <p>Hola ${name},</p>
        <p><strong>${companyName}</strong> solicita tu consentimiento para el siguiente propósito:</p>
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 4px; margin: 15px 0;">
          <p style="margin: 0; font-style: italic;">${purpose}</p>
        </div>
        <p>Esta solicitud está basada en la política: <strong>${policyTitle}</strong>.</p>
        <p>Por favor, revisa y responde a esta solicitud haciendo clic en el siguiente botón:</p>
        <p style="text-align: center; margin: 25px 0;">
          <a href="${consentLink}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">
            Revisar Solicitud
          </a>
        </p>
        <p>O copia y pega el siguiente enlace en tu navegador:</p>
        <p>${consentLink}</p>
        <p>Esta solicitud estará disponible hasta el ${formattedExpirationDate}.</p>
        <p>Al acceder al enlace, podrás revisar todos los detalles y decidir si otorgar o rechazar el consentimiento.</p>
        <p>Si tienes alguna pregunta, puedes contactar a ${companyName} respondiendo a este correo.</p>
        <p>Saludos,<br>${companyName} a través de Consentia</p>
      </div>
    `;

    const text = `
      Solicitud de Consentimiento
      
      Hola ${name},
      
      ${companyName} solicita tu consentimiento para el siguiente propósito:
      
      "${purpose}"
      
      Esta solicitud está basada en la política: ${policyTitle}.
      
      Por favor, revisa y responde a esta solicitud visitando el siguiente enlace:
      ${consentLink}
      
      Esta solicitud estará disponible hasta el ${formattedExpirationDate}.
      
      Al acceder al enlace, podrás revisar todos los detalles y decidir si otorgar o rechazar el consentimiento.
      
      Si tienes alguna pregunta, puedes contactar a ${companyName} respondiendo a este correo.
      
      Saludos,
      ${companyName} a través de Consentia
    `;

    return this.sendEmail({
      to: email,
      subject: `Solicitud de Consentimiento - ${companyName}`,
      html,
      text,
    });
  }

  /**
   * Send a portal access email to data subjects
   */
  async sendPortalAccessEmail(params: {
    email: string;
    name: string;
    portalLink: string;
    expirationHours: number;
    companyName?: string;
  }) {
    const { email, name, portalLink, expirationHours, companyName } = params;
    const company = companyName ? ` de ${companyName}` : '';

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Acceso al Portal de Datos Personales</h2>
        <p>Hola ${name},</p>
        <p>Has solicitado acceso al portal de gestión de datos personales${company}. Con este portal podrás:</p>
        <ul>
          <li>Ver todos tus consentimientos otorgados</li>
          <li>Revocar consentimientos</li>
          <li>Solicitar la eliminación de tus datos</li>
          <li>Acceder a tus datos personales</li>
        </ul>
        <p>Por favor, haz clic en el siguiente botón para acceder al portal:</p>
        <p style="text-align: center; margin: 25px 0;">
          <a href="${portalLink}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">
            Acceder al Portal
          </a>
        </p>
        <p>O copia y pega el siguiente enlace en tu navegador:</p>
        <p>${portalLink}</p>
        <p>Este enlace expirará en ${expirationHours} horas por razones de seguridad.</p>
        <p>Si no solicitaste este acceso, puedes ignorar este correo.</p>
        <p>Saludos,<br>El equipo de Consentia</p>
      </div>
    `;

    const text = `
      Acceso al Portal de Datos Personales
      
      Hola ${name},
      
      Has solicitado acceso al portal de gestión de datos personales${company}. Con este portal podrás:
      
      - Ver todos tus consentimientos otorgados
      - Revocar consentimientos
      - Solicitar la eliminación de tus datos
      - Acceder a tus datos personales
      
      Por favor, visita el siguiente enlace para acceder al portal:
      ${portalLink}
      
      Este enlace expirará en ${expirationHours} horas por razones de seguridad.
      
      Si no solicitaste este acceso, puedes ignorar este correo.
      
      Saludos,
      El equipo de Consentia
    `;

    return this.sendEmail({
      to: email,
      subject: `Acceso al Portal de Datos Personales${company} - Consentia`,
      html,
      text,
    });
  }
} 