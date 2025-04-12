export * from './auth.dto';
// Exportamos selectivamente para evitar duplicados
import { 
  RegisterResponseDto, 
  LoginResponseDto, 
  LogoutResponseDto, 
  RefreshTokenResponseDto, 
  ResetPasswordResponseDto, 
  UpdatePasswordResponseDto, 
  AuthErrorResponseDto, 
  VerifyEmailResponseDto,
  VerifyTokenResponseDto
} from './standard-response.dto';

export { 
  RegisterResponseDto, 
  LoginResponseDto, 
  LogoutResponseDto, 
  RefreshTokenResponseDto, 
  ResetPasswordResponseDto, 
  UpdatePasswordResponseDto, 
  AuthErrorResponseDto, 
  VerifyEmailResponseDto,
  VerifyTokenResponseDto
}; 