import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Roles } from 'src/auth/decorators/role.decorator';
import { AuthGuard, RequestWithUser } from 'src/auth/guards/auth.guard';
import { RolesGuard } from 'src/auth/guards/role.guard';
import { CreatePetDTO } from './dto/create-pet.dto';
import { PetService } from './pet.service';

@Controller('pets')
export class PetController {
  constructor(private readonly petService: PetService) {}

  @Get()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('ADMIN')
  async listPets(
    @Req() req: RequestWithUser,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    return this.petService.listPets(Number(page), Number(limit));
  }

  @Post()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('USER')
  async addPet(@Req() req: RequestWithUser, @Body() body: CreatePetDTO) {
    const userId = req.user?.sub;
    if (!userId) throw new NotFoundException('Usuario no encontrado');
    return await this.petService.addPet(userId, body);
  }

  @Delete(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('USER')
  async deletePet(@Req() req: RequestWithUser, @Param('id') id: string) {
    const userId = req.user?.sub;
    if (!userId) throw new NotFoundException('Usuario no encontrado');
    return await this.petService.deletePet(userId, id);
  }
}
