import { InjectQueue } from '@nestjs/bullmq';
import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import { Queue } from 'bullmq';
import { RequestWithUser } from 'src/auth/guards/auth.guard';
import { CREATE_DATE_JOB, DATE_QUEUE } from './date.queue';
import { DateService } from './date.service';
import { CreateDateRequestDTO } from './dto/create-date.dto';

@Controller(DATE_QUEUE)
export class DateController {
  constructor(
    @InjectQueue(DATE_QUEUE) private readonly queue: Queue,
    private readonly dateService: DateService,
  ) {}

  @Get()
  async getDates() {
    return await this.dateService.getDates();
  }

  @Post('enqueue')
  async enqueue(
    @Req() req: RequestWithUser,
    @Body() body: CreateDateRequestDTO,
  ) {
    try {
      const job = await this.queue.add(
        CREATE_DATE_JOB,
        {
          clientId: req.user?.sub,
          day: body.day,
          startTime: body.startTime,
          endTime: body.endTime,
          timezone: body.timezone ?? 'America/Argentina/Buenos_Aires',
        },
        {
          attempts: 3,
          backoff: { type: 'exponential', delay: 1000 },
          removeOnComplete: true,
          removeOnFail: false,
        },
      );

      return { jobId: job.id };
    } catch (error) {
      console.log('ERROR');
      console.log(error);
    }
  }
}
