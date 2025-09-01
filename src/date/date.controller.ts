import { Controller, Post, Body, Req } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { CreateDateJobDTO } from './dto/create-date.dto';
import { Queue } from 'bullmq';
import { RequestWithUser } from 'src/auth/guards/auth.guard';
import { CREATE_DATE_JOB, DATE_QUEUE } from './date.queue';

@Controller(DATE_QUEUE)
export class DateController {
  constructor(@InjectQueue(DATE_QUEUE) private readonly queue: Queue) {}

  @Post('enqueue')
  async enqueue(@Req() req: RequestWithUser, @Body() body: CreateDateJobDTO) {
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
