import { Module } from '@nestjs/common';
import { DateService } from './date.service';
import { DateController } from './date.controller';
import { BullModule } from '@nestjs/bullmq';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'date',
      defaultJobOptions: {
        removeOnComplete: 1000,
        removeOnFail: 5000,
        attempts: 5,
        backoff: { type: 'exponential', delay: 500 },
      },
    }),
  ],
  controllers: [DateController],
  providers: [DateService],
})
export class DateModule {}
