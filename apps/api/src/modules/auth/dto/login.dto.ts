import { IsString, MinLength, MaxLength } from "class-validator";

export class LoginDto {
  /** tenant slug — subdomain ya da gövde içinde gelir */
  @IsString()
  @MinLength(2)
  @MaxLength(64)
  tenantSlug!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(64)
  username!: string;

  @IsString()
  @MinLength(6)
  @MaxLength(128)
  password!: string;
}
