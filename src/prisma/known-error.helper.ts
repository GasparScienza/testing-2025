import { Prisma } from '@prisma/client';

export function isPrismaKnown(
  e: unknown,
): e is Prisma.PrismaClientKnownRequestError {
  return e instanceof Prisma.PrismaClientKnownRequestError;
}
