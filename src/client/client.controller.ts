import {
  Controller,
  Delete,
  Get,
  Logger,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Roles } from 'src/auth/decorators/role.decorator';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { RolesGuard } from 'src/auth/guards/role.guard';
import { ClientService } from './client.service';
import { FindClientsDto } from './dto/page.dto';

@Controller('client')
@UseGuards(AuthGuard, RolesGuard)
@Roles('ADMIN')
export class ClientController {
  constructor(private readonly clientService: ClientService) { }
  private readonly logger = new Logger(ClientController.name);

  @Get()
  findAll(@Query() dto: FindClientsDto) {
    this.logger.log(
      `findAll called with page=${dto.page ?? 1}, limit=${dto.limit ?? 10}, q=${dto.q ?? ''
      }, sortBy=${dto.sortBy ?? 'createdAt'}, order=${dto.order ?? 'desc'}`,
    );
    return this.clientService.findAll(dto);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    this.logger.log(`findOne called with id=${id}`);
    return await this.clientService.findOne(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    this.logger.log(`remove called for userId=${id}`);
    return this.clientService.remove(id);
  }
}
