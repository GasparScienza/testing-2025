import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { DateTime } from 'luxon';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateDateJobDTO } from './dto/create-date.dto';

@Injectable()
export class DateService {
  constructor(private readonly prisma: PrismaService) {}

  async getDates() {
    return await this.prisma.date.findMany();
  }

  private buildDateTimes(dto: CreateDateJobDTO) {
    const tz = dto.timezone ?? 'America/Argentina/Buenos_Aires';
    const dayStart = DateTime.fromISO(dto.day, { zone: tz }).startOf('day');
    if (!dayStart.isValid) throw new BadRequestException('day inválido');

    const [startH, startM] = dto.startTime.split(':').map(Number);
    const [endH, endM] = dto.endTime.split(':').map(Number);

    const startsAt = dayStart.set({
      hour: startH,
      minute: startM,
      second: 0,
      millisecond: 0,
    });
    const endsAt = dayStart.set({
      hour: endH,
      minute: endM,
      second: 0,
      millisecond: 0,
    });

    if (!startsAt.isValid || !endsAt.isValid) {
      throw new BadRequestException('startTime/endTime inválidos');
    }
    if (endsAt <= startsAt) {
      throw new BadRequestException('endTime debe ser mayor que startTime');
    }

    const now = DateTime.now().setZone(tz);
    if (startsAt < now) {
      throw new BadRequestException(
        'No se puede crear un turno en una fecha/hora anterior a la actual',
      );
    }

    return {
      tz,
      day: dayStart.toUTC().toJSDate(),
      startsAt: startsAt.toUTC().toJSDate(),
      endsAt: endsAt.toUTC().toJSDate(),
    };
  }

  async findExisting(dto: CreateDateJobDTO) {
    const { day, startsAt, endsAt } = this.buildDateTimes(dto);

    return await this.prisma.date.findFirst({
      where: {
        day,
        startsAt: { gte: startsAt },
        endsAt: { lte: endsAt },
      },
    });
  }

  async findOverlapping(dto: CreateDateJobDTO) {
    const { day, startsAt, endsAt } = this.buildDateTimes(dto);

    return await this.prisma.date.findFirst({
      where: {
        day,
        startsAt: { lt: endsAt },
        endsAt: { gt: startsAt },
      },
    });
  }

  private async create(dto: CreateDateJobDTO) {
    const { day, startsAt, endsAt } = this.buildDateTimes(dto);
    const result = await this.prisma.date.create({
      data: {
        day,
        startsAt,
        endsAt,
        client: { connect: { userId: dto.clientId } },
      },
    });
    return result;
  }

  async createDate(dto: CreateDateJobDTO) {
    const existing = await this.findExisting(dto);
    if (existing) throw new ConflictException('Ya existe este turno');

    const overlap = await this.findOverlapping(dto);
    if (overlap) {
      throw new BadRequestException(
        'Ya existe un turno que se solapa con el intervalo solicitado.',
      );
    }

    const date = await this.create(dto);
    return { created: true, date };
  }
}
