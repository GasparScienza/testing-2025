// export class CreateDateJobDTO {
//   clientId!: string;
//   day!: string;
//   startTime!: string;
//   endTime!: string;
//   timezone?: string;
// }

// create-date.request.dto.ts (lo que valida el body del POST)
import { IsISO8601, IsOptional, IsString, Matches } from 'class-validator';

export class CreateDateRequestDTO {
  @IsISO8601(
    { strict: true },
    { message: 'day debe ser YYYY-MM-DD (ISO 8601)' },
  )
  day!: string;

  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: 'startTime debe ser HH:mm' })
  startTime!: string;

  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: 'endTime debe ser HH:mm' })
  endTime!: string;

  @IsOptional()
  @IsString()
  timezone?: string;
}

// create-date.job.dto.ts (lo que viaja en la queue, puede NO pasar por ValidationPipe)
export class CreateDateJobDTO {
  clientId!: string;
  day!: string;
  startTime!: string;
  endTime!: string;
  timezone?: string;
}
