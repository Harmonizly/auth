// @flow

import Logger from 'server/utils/logger';

const LOGGER = Logger.get('auth');

/**
 *
 */
export default class Exception extends Error {

  category: string;
  code: number;
  status: number;
  extra: any;

  constructor(payload: string | Object, code: number = -1, status: number = 500) {

    if (typeof payload !== 'object') {
      payload = {
        category: "General",
        code,
        message: payload,
        status
      };
    }
    super();
    this.category = payload.category;
    this.code = payload.code;
    this.message = `${payload.message}${payload.extra ? `. ${payload.extra}` : ''}`;
    this.status = payload.status;
  }
}
