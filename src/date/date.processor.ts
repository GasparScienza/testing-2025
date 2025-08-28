// turnos.processor.ts

import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bullmq';

@Processor('turnos')
export class TurnosProcessor {
  @Process('ping')
  async handlePing(job: Job<{ ts: number }>) {
    console.log('[turnos] ping job', job.id, job.data);
    // Simula trabajo
    await new Promise((r) => setTimeout(r, 300));
    return { ok: true, handledAt: new Date().toISOString() };
  }
}
