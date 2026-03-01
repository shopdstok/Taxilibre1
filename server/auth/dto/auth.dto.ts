import { IsEmail, IsString, IsEnum, IsOptional, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @MinLength(6)
  password: string;
}

export class RegisterDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  name: string;

  @ApiProperty({ enum: ['PASSENGER', 'DRIVER', 'ADMIN'] })
  @IsEnum(['PASSENGER', 'DRIVER', 'ADMIN'])
  role: 'PASSENGER' | 'DRIVER' | 'ADMIN';

  @ApiProperty({ example: '+33600000000' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({ example: 'fr' })
  @IsString()
  @IsOptional()
  language?: string;

  @ApiProperty({ example: 'FR' })
  @IsString()
  @IsOptional()
  country?: string;

  @ApiProperty({ enum: ['TAXI', 'VTC'], required: false })
  @IsEnum(['TAXI', 'VTC'])
  @IsOptional()
  driverType?: 'TAXI' | 'VTC';

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  taxiLicense?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  vtcLicense?: string;
}
