import Logger from 'server/utils/logger';

const LOGGER = Logger.get('root');

/**
 * [e description]
 * @type {[type]}
 */
const error = function (e: any, response: Object): void {
  const status = (typeof e === 'object' && 'status' in e) ? e.status : 500;
  const payload = {
    category: 'GeneralException',
    code: -1,
    message: (typeof e === 'string') ? e : 'An Unknown error occurred',
    status,
  };

  if (typeof e === 'object') {
    if ('category' in e) {
      payload.category = e.category;
    }

    if ('code' in e) {
      payload.code = e.code;
    }

    if ('message' in e) {
      payload.message = e.message;
    }

    if ('status' in e) {
      payload.status = e.status;
    }
  }
  LOGGER.error({ message: payload, code: e.code, line: 37 });
  return response.status(status).send(payload);
};

export default error;
