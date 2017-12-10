import Logger from 'server/utils/logger';

const LOGGER: Object = Logger.get('request');

/**
 *
 */
export default function requestLogger(request: Object, response: Object, next: Function): void {
  LOGGER.info({
    message: {
      method: request.method,
      url: request.url,
      headers: request.headers,
    },
  });
  next();
}
