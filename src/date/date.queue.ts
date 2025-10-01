import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { CreateDateJobDTO } from './dto/create-date.dto';
import { Queue } from 'bullmq';

export const DATE_QUEUE = 'date';
//
export const CREATE_DATE_JOB = 'create-date';

@Injectable()
export class DateQueue {
  constructor(@InjectQueue(DATE_QUEUE) private readonly queue: Queue) {}

  async enqueueCreate(dto: CreateDateJobDTO) {
    return this.queue.add(CREATE_DATE_JOB, dto, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 1000 },
      removeOnComplete: true,
      removeOnFail: false,
    });
  }
}
