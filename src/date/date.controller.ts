import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { DateService } from './date.service';
import { CreateDateDto } from './dto/create-date.dto';
import { UpdateDateDto } from './dto/update-date.dto';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Public } from 'src/auth/decorators/public.decorator';

@Public()
@Controller('date')
export class DateController {
  constructor(
    private readonly dateService: DateService,
    @InjectQueue('date') private readonly turnosQ: Queue,
  ) {}

  @Post()
  create(@Body() createDateDto: CreateDateDto) {
    return this.dateService.create(createDateDto);
  }

  @Post('ping')
  async ping() {
    const job = await this.turnosQ.add(
      'ping',
      { ts: Date.now() },
      { removeOnComplete: true, attempts: 3 },
    );
    return { enqueued: true, jobId: job.id };
  }

  @Get('turnos/counts')
  async counts() {
    // Útil para ver que la cola se mueve
    return this.turnosQ.getJobCounts(
      'waiting',
      'active',
      'completed',
      'failed',
      'delayed',
      'paused',
    );
  }

  @Get()
  findAll() {
    return this.dateService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.dateService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDateDto: UpdateDateDto) {
    return this.dateService.update(+id, updateDateDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.dateService.remove(+id);
  }
}
