import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreatePetDTO } from './dto/create-pet.dto';

@Injectable()
export class PetService {
  constructor(private readonly prisma: PrismaService) {}

  async listPets(page = 1, limit = 10) {
    // Calcular offset
    const skip = (page - 1) * limit;

    const [pets, total] = await this.prisma.$transaction([
      this.prisma.pet.findMany({
        where: {
          active: true,
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          notes: true,
        },
      }),
      this.prisma.pet.count({
        where: {
          active: true,
        },
      }),
    ]);

    return {
      data: pets,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async deletePet(id: string, petId: string) {
    const pet = await this.prisma.pet.findFirstOrThrow({
      where: {
        id: petId,
        client: {
          userId: id,
        },
      },
    });

    if (!pet) throw new NotFoundException('Pet not found!');

    await this.prisma.pet.update({
      where: {
        id: petId,
      },
      data: {
        active: false,
      },
    });
  }

  async addPet(id: string, pet: CreatePetDTO) {
    const { name, notes, species, breed } = pet;

    // 1. Encontrar al cliente a partir del usuario autenticado
    const user = await this.prisma.user.findFirstOrThrow({
      where: { id },
      include: { client: true },
    });

    if (!user.client) {
      throw new Error('El usuario no tiene un cliente asociado.');
    }

    // 2. Crear la mascota asociada al cliente
    const newPet = await this.prisma.pet.create({
      data: {
        name,
        specie: `${species}${breed ? ' - ' + breed : ''}`,
        notes: {
          create: [
            {
              description: notes,
            },
          ],
        },
        client: {
          connect: { id: user.client.id },
        },
      },
      include: {
        client: true,
      },
    });

    return newPet;
  }
}
