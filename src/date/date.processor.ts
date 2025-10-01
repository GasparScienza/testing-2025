import { Processor, WorkerHost } from '@nestjs/bullmq';
import { DateService } from './date.service';
import { OnQueueFailed, Process } from '@nestjs/bull';
import { Job } from 'bullmq';
import { CreateDateJobDTO } from './dto/create-date.dto';
import { CREATE_DATE_JOB, DATE_QUEUE } from './date.queue';

@Processor(DATE_QUEUE)
export class DateProcessor extends WorkerHost {
  constructor(private readonly dateService: DateService) {
    super();
  }

  @Process(CREATE_DATE_JOB)
  async handleFindOrCreate(job: Job<CreateDateJobDTO>) {
    const result = await this.dateService.createDate(job.data);
    return result;
  }

  async process(job: Job<any>) {
    return await this.dateService.createDate(job.data);
  }

  @OnQueueFailed()
  onFailed(job: Job, error: Error) {
    console.error(`Job ${job.id} failed with error: ${error.message}`);
    return { success: false };
  }
}
