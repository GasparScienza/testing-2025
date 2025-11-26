export class LoginDto {
    email: string;
    password: string;
    turnstileToken: string;
}

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TurnstileService {
    private readonly SECRET_KEY;

    constructor(private readonly configService: ConfigService) {
        this.SECRET_KEY = configService.getOrThrow('CAPTCHA_SECRET_KEY')
    }

    async validate(token: string, remoteIp?: string): Promise<void> {
        if (!token) {
            throw new UnauthorizedException('Captcha token missing');
        }

        const params = new URLSearchParams();
        params.append('secret', this.SECRET_KEY);
        params.append('response', token);
        if (remoteIp) {
            params.append('remoteip', remoteIp);
        }

        const response = await fetch(
            'https://challenges.cloudflare.com/turnstile/v0/siteverify',
            {
                method: 'POST',
                body: params,
            },
        );
        const result = await response.json();

        if (!result.success) {
            throw new UnauthorizedException('Captcha verification failed');
        }
    }
}
