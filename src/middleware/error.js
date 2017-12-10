import Logger from 'server/utils/logger';

const LOGGER: Object = Logger.get('root');

/**
 * [errorParser description]
 * @param  {[type]}   error    [description]
 * @param  {[type]}   request  [description]
 * @param  {[type]}   response [description]
 * @param  {Function} next     [description]
 * @return {[type]}            [description]
 */
export function errorMiddleware(error: any, request: Object, response: Object, next: Function): void {
  LOGGER.info({
    method: request.method,
    url: request.url,
    headers: request.headers,
  });

  if (!('status' in error)) {
    error.status = 500;
  }

  if (!('code' in error)) {
    error.code = -1;
  }

  LOGGER.error(error);
  response.status(error.code).send(error);
  next();
}

/**
 * [notFoundError description]
 * @param  {[type]}   request  [description]
 * @param  {[type]}   response [description]
 * @param  {Function} next     [description]
 * @return {[type]}            [description]
 */
export function notFoundError(request: Object, response: Object, next: Function): void {
  response.status(404).send();
  next();
}
