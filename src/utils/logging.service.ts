import { Injectable, LoggerService } from '@nestjs/common';
import { createLogger, transports } from 'winston';
import { ecsFormat } from '@elastic/ecs-winston-format';

const logger = createLogger({
    // level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    level: 'info',
    format: ecsFormat(),
    transports: [
        new transports.Console(),
    ],
});

@Injectable()
export class AppLoggingService implements LoggerService {
    log(message: any, ...optionalParams: any[]) {
        logger.info(message, ...optionalParams);
    }
    error(message: any, ...optionalParams: any[]) {
        logger.error(message, ...optionalParams);
    }
    warn(message: any, ...optionalParams: any[]) {
        logger.warn(message, ...optionalParams);
    }
    debug(message: any, ...optionalParams: any[]) {
        logger.debug(message, ...optionalParams);
    }
    verbose(message: any, ...optionalParams: any[]) {
        logger.verbose?.(message, ...optionalParams);
    }
}
