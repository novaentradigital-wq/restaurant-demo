import { UserRole } from "@prisma/client";

export interface JwtPayload {
  /** user id */
  sub: string;
  tenantId: string;
  restaurantId: string | null;
  role: UserRole;
  username: string;
}

export interface AuthenticatedUser extends JwtPayload {}

declare module "express" {
  interface Request {
    user?: AuthenticatedUser;
  }
}
