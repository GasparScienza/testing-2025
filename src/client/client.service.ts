import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { FindClientsDto } from './dto/page.dto';

@Injectable()
export class ClientService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(dto: FindClientsDto) {
    const {
      page = 1,
      limit = 10,
      q,
      sortBy = 'createdAt',
      order = 'desc',
    } = dto;
    const skip = (page - 1) * limit;

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
        } catch {}
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

    return {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      data,
    };
  }

  async findOne(id: string) {
    return await this.prisma.client.findFirstOrThrow({
      where: {
        id,
      },
    });
  }

  // update(id: number, updateClientDto: UpdateClientDto) {
  //   return `This action updates a #${id} client`;
  // }

  async remove(id: string) {
    const user = await this.prisma.user.findFirstOrThrow({
      where: { id, active: true },
    });
    if (!user) throw new NotFoundException('Usuario no encontrado');
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
