import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { isPrismaKnown } from 'src/prisma/known-error.helper';
import { PrismaService } from '../prisma/prisma.service';
import { SignInDto } from './dto/sign-in.dto';
import { SignUpDTO } from './dto/sign-up.dto';

const SALT_ROUNDS = 12;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async signIn(body: SignInDto) {
    const { email, password: pass } = body;
    const user = await this.prisma.user.findUnique({
      where: {
        email: email.toLocaleLowerCase().trim(),
      },
    });
    if (!user) throw new UnauthorizedException('Credenciales inválidas');

    const isMatch = await bcrypt.compare(pass, user.password);
    if (!isMatch) throw new UnauthorizedException('Credenciales inválidas');

    const payload = { sub: user.id, role: user.role };
    return await this.jwtService.signAsync(payload);
  }

  async signUp(body: SignUpDTO) {
    const { email, password, name, surname, address, dni, postalCode } = body;

    const normalizedEmail = email.toLowerCase().trim();
    const hash = await bcrypt.hash(password, SALT_ROUNDS);

    try {
      const created = await this.prisma.user.create({
        data: {
          email: normalizedEmail,
          password: hash,
          role: 'USER',
          client: {
            create: {
              name,
              surname,
              address,
              postalCode,
              dni: BigInt(String(dni)),
            },
          },
        },
        include: { client: true },
      });

      return await this.jwtService.signAsync(
        { sub: created.id, role: created.role },
        {
          secret: this.configService.getOrThrow<string>('SECRET_JWT'),
        },
      );
    } catch (e: unknown) {
      const errorMsg = 'Email or dni already used';
      if (isPrismaKnown(e) && e.code === 'P2002') {
        throw new BadRequestException(
          e && e.code === 'P2002' ? errorMsg : 'Error in signup',
        );
      }
      throw e;
    }
  }

  async getData(id: string) {
    return await this.prisma.user.findUniqueOrThrow({
      where: {
        id,
      },
      omit: { password: true },
    });
  }
}
