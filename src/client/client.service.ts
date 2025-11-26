import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { FindClientsDto } from './dto/page.dto';

@Injectable()
export class ClientService {
  private readonly logger = new Logger(ClientService.name);
  constructor(private readonly prisma: PrismaService) { }

  async findAll(dto: FindClientsDto) {
    const {
      page = 1,
      limit = 10,
      q,
      sortBy = 'createdAt',
      order = 'desc',
    } = dto;
    const skip = (page - 1) * limit;

    this.logger.debug?.(
      `ClientService.findAll page=${page}, limit=${limit}, q=${q}, sortBy=${sortBy}, order=${order}`,
    );

    // WHERE dinámico
    const where: Prisma.ClientWhereInput = {};

    if (q?.trim()) {
      const term = q.trim();
      const or: Prisma.ClientWhereInput[] = [
        { name: { contains: term, mode: 'insensitive' } },
        { surname: { contains: term, mode: 'insensitive' } },
        { user: { email: { contains: term, mode: 'insensitive' } } },
        { user: { active: true } },
      ];

      // si q es numérico, intentamos buscar por dni (BigInt)
      if (/^\d+$/.test(term)) {
        try {
          const dni = BigInt(term);
          or.push({ dni }); // equals exacto por ser BigInt
        } catch {
          this.logger.warn(`Invalid numeric term for dni: term=${term}`);
          throw new NotFoundException();
        }
      }

      where.OR = or;
    }

    // orderBy soportando campo relacionado (email)
    const orderBy: Prisma.ClientOrderByWithRelationInput =
      sortBy === 'email'
        ? { user: { email: order } }
        : sortBy === 'dni'
          ? { dni: order }
          : sortBy === 'name'
            ? { name: order }
            : sortBy === 'surname'
              ? { surname: order }
              : { id: order };

    const [total, data] = await this.prisma.$transaction([
      this.prisma.client.count({ where }),
      this.prisma.client.findMany({
        where,
        include: { user: { select: { email: true, createdAt: true } } },
        orderBy,
        skip,
        take: limit,
      }),
    ]);


    this.logger.log(
      `ClientService.findAll result: total=${total}, page=${page}, limit=${limit}`,
    );

    return {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      data,
    };
  }

  async findOne(id: string) {
    this.logger.log(`ClientService.findOne id=${id}`);
    return await this.prisma.client.findFirstOrThrow({
      where: {
        id,
      },
    });
  }

  async remove(id: string) {
    const user = await this.prisma.user.findFirstOrThrow({
      where: { id, active: true },
    });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    this.logger.log(`User soft-deleted, id=${id}`);
    return await this.prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        active: false,
      },
    });
  }
}
