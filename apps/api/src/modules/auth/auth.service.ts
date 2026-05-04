import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import argon2 from "argon2";
import { PrismaService } from "../prisma/prisma.service";
import type { JwtPayload } from "./auth.types";

interface LoginInput {
  tenantSlug: string;
  username: string;
  password: string;
}

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService
  ) {}

  async login(input: LoginInput): Promise<TokenPair & { user: JwtPayload }> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug: input.tenantSlug },
      select: { id: true, isActive: true },
    });
    if (!tenant || !tenant.isActive) {
      throw new UnauthorizedException("Restoran bulunamadı veya devre dışı.");
    }

    const user = await this.prisma.user.findUnique({
      where: {
        tenantId_username: { tenantId: tenant.id, username: input.username },
      },
    });
    if (!user || !user.isActive) {
      throw new UnauthorizedException("Geçersiz kullanıcı adı veya şifre.");
    }

    const ok = await argon2.verify(user.passwordHash, input.password);
    if (!ok) {
      throw new UnauthorizedException("Geçersiz kullanıcı adı veya şifre.");
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const payload: JwtPayload = {
      sub: user.id,
      tenantId: user.tenantId,
      restaurantId: user.restaurantId,
      role: user.role,
      username: user.username,
    };

    return {
      ...(await this.signTokens(payload)),
      user: payload,
    };
  }

  async refresh(refreshToken: string): Promise<TokenPair> {
    let payload: JwtPayload;
    try {
      payload = await this.jwt.verifyAsync<JwtPayload>(refreshToken, {
        secret: this.config.getOrThrow<string>("JWT_REFRESH_SECRET"),
      });
    } catch {
      throw new UnauthorizedException("Geçersiz refresh token.");
    }
    return this.signTokens(payload);
  }

  private async signTokens(payload: JwtPayload): Promise<TokenPair> {
    const accessTtl = this.config.get<string>("JWT_ACCESS_TTL") ?? "15m";
    const refreshTtl = this.config.get<string>("JWT_REFRESH_TTL") ?? "30d";

    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync({ ...payload }, {
        secret: this.config.getOrThrow<string>("JWT_ACCESS_SECRET"),
        expiresIn: accessTtl as unknown as number,
      }),
      this.jwt.signAsync({ ...payload }, {
        secret: this.config.getOrThrow<string>("JWT_REFRESH_SECRET"),
        expiresIn: refreshTtl as unknown as number,
      }),
    ]);
    return { accessToken, refreshToken };
  }
}
