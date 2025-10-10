import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../entities/user.entity';
import { Organization } from '../entities/organization.entity';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { BcryptService } from './bcrypt.service';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Organization]),
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'turbovets-super-secret-key-2024',
      signOptions: { expiresIn: '24h' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, BcryptService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}