import bunyan from 'bunyan';
import config from 'config';
import createCWStream from 'bunyan-cloudwatch';
import process from 'process';
import stackTrace from 'stack-trace';
import uuidv4 from 'uuid/v4';

const DEFAULT_MESSAGE: string = 'This is not the message you are looking for';
const SERVER_CONFIG: Object = config.get('server');

// eslint-disable-next-line
let instance: ?Logger = null;

/**
 * [app description]
 * @type {[type]}
 */
class LoggingSchema {
  app: string = SERVER_CONFIG.name;
  code: number;
  message: string;
  sessionId: string;
  status: number;
  time: string = new Date().toUTCString();
  trace: Array<Object>;
  transactionId: number;
  user: Object = {};

  /**
   * [constructor description]
   * @param  {Number} [code=-1]                 [description]
   * @param  {[type]} level                     [description]
   * @param  {[type]} [message=DEFAULT_MESSAGE] [description]
   * @param  {Number} [status=-1]               [description]
   * @param  {Array}  [trace=[]]                [description]
   * @return {[type]}                           [description]
   */
  constructor({
    code = -1,
    message = DEFAULT_MESSAGE,
    status = -1,
    trace = [],
  } = {}) {
    this.code = code;
    this.message = message;
    this.status = status;
    this.trace = trace;
    const transaction: Object = process.domain;

    if (transaction && transaction.data) {
      const { request } = transaction.data;

      this.sessionId = request.session && request.session.id;
      this.transactionId = transaction.data.id;

      if (request.user) {
        this.user = {
          id: request.user.id,
          username: request.user.username,
        };
      }
    }
  }

  /**
   * [type description]
   * @type {[type]}
   */
  toJSON(): Object {
    return {
      app: this.app,
      code: this.code,
      message: this.message,
      sessionId: this.sessionId,
      status: this.status,
      time: this.time,
      trace: this.trace,
      transactionId: this.transactionId,
      user: this.user,
    };
  }
}

/**
 * [debug description]
 * @param  {[type]} data [description]
 * @return {[type]}      [description]
 */
const debug = async function debug(...args) {
  // eslint-disable-next-line
  const payload: Object = Logger.resolvePayload(args);
  // eslint-disable-next-line
  const trace: Array<Object> = await Logger.getCallStack(debug);

  payload.trace = trace;
  const loggingData: LoggingSchema = new LoggingSchema(payload);

  this.existingDebug(loggingData.toJSON());
};

/**
 * [error description]
 * @param  {[type]} data [description]
 * @return {[type]}      [description]
 */
const error = async function error(...args) {
  // eslint-disable-next-line
  const payload: Object = Logger.resolvePayload(args);
  // eslint-disable-next-line
  const trace: Array<Object> = await Logger.getErrorCallStack(error);

  payload.trace = trace;
  const loggingData: LoggingSchema = new LoggingSchema(payload);

  this.existingError(loggingData.toJSON());
};

/**
 * [info description]
 * @param  {[type]} data [description]
 * @return {[type]}      [description]
 */
const info = async function info(...args) {
  // eslint-disable-next-line
  const payload: Object = Logger.resolvePayload(args);
  // eslint-disable-next-line
  const trace: Array<Object> = await Logger.getCallStack(info);

  payload.trace = trace;
  const loggingData: LoggingSchema = new LoggingSchema(payload);

  this.existingInfo(loggingData.toJSON());
};

/**
 * [warn description]
 * @param  {[type]} data [description]
 * @return {[type]}      [description]
 */
const warn = async function warn(...args) {
  // eslint-disable-next-line
  const payload: Object = Logger.resolvePayload(args);
  // eslint-disable-next-line
  const trace: Array<Object> = await Logger.getCallStack(warn);

  payload.trace = trace;
  const loggingData: LoggingSchema = new LoggingSchema(payload);

  this.existingWarn(loggingData.toJSON());
};

/**
 * [loggers description]
 * @type {[type]}
 */
export default class Logger {
  loggers: Object = {};

  /**
   * [constructor description]
   * @param  {[type]} config [description]
   * @return {[type]}        [description]
   */
  constructor(): Object {
    if (instance == null) {
      this.init(SERVER_CONFIG.get('loggers'));
      instance = this;
    }
    return instance;
  }

  /**
   * [init description]
   * @param  {[type]} handlersConfig [description]
   * @return {[type]}        [description]
   */
  init(loggersConfig: Object): void {
    let loggerConfig;
    const handlersConfig = loggersConfig.get('handlers');

    handlersConfig.forEach((obj) => {
      loggerConfig = Object.assign({}, obj);
      const name = loggerConfig.name.toLowerCase();
      const { stream } = loggerConfig;

      delete loggerConfig.stream;
      const logger: Object = bunyan.createLogger(loggerConfig);

      logger.existingDebug = logger.debug;
      logger.existingError = logger.error;
      logger.existingInfo = logger.info;
      logger.existingWarn = logger.warn;

      logger.debug = debug.bind(logger);
      logger.error = error.bind(logger);
      logger.info = info.bind(logger);
      logger.warn = warn.bind(logger);

      Logger.loadStreams(logger, stream, loggersConfig.get('streams'));
      this.loggers[name] = logger;
    });

    // Enable forwarding logged errors to Newrelic Reporting if the server is in a production environment
    if (process.env.NODE_ENV === 'production') {
      bunyan.createLogger({
        name: SERVER_CONFIG.name,
        streams: [{
          level: 'error',
          type: 'raw',
          stream: new NewRelicStream(),
        }],
      });
    }
  }

  /**
   * [formatTrace description]
   * @param  {[type]} Array [description]
   * @return {[type]}       [description]
   */
  static formatTrace(trace: Array<Object>): Array<Object> {
    const formatted: Array<Object> = [];
    let callSite: Object;

    for (let i = 0; i < trace.length; i++) {
      callSite = trace[i];
      formatted.push({
        class: callSite.getTypeName(),
        file: callSite.getFileName(),
        function: callSite.getFunctionName(),
        line: callSite.getLineNumber(),
        method: callSite.getMethodName(),
      });
    }
    return formatted;
  }

  /**
   * [get description]
   * @param  {[type]} name [description]
   * @return {[type]}      [description]
   */
  static get(name: string): Object {
    if (!instance) {
      instance = new Logger();
    }

    let loggerName;

    if (name == null) {
      loggerName = 'root';
    } else {
      loggerName = name.toLowerCase();
    }
    return instance.loggers[loggerName];
  }

  /**
   * [getCallStack description]
   * @param  {[type]}  belowFn [description]
   * @return {Promise}         [description]
   */
  static async getCallStack(belowFn: Function): Promise<Array<Object>> {
    return new Promise((resolve: Function): void => {
      const trace: Array<Object> = stackTrace.get(belowFn);

      resolve(Logger.formatTrace([trace[0]]));
    });
  }

  /**
   * [getCallStack description]
   * @param  {[type]}  belowFn [description]
   * @return {Promise}         [description]
   */
  static async getErrorCallStack(err: Object): Promise<Array<Object>> {
    return new Promise((resolve: Function): void => {
      const trace: Array<Object> = stackTrace.parse(err);

      resolve(Logger.formatTrace(trace));
    });
  }

  /**
   *
   */
  static loadStreams(logger: Object, name: string, streamsConfig: Object): void {
    let streamConfig;

    switch (name) {
      case 'cloudwatch':
        streamConfig = Object.assign({}, streamsConfig.get('cloudwatch'));
        streamConfig.logStreamName += `-${process.pid}-${uuidv4()}`;
        logger.addStream({
          name: 'cloudwatch',
          type: 'raw',
          stream: createCWStream(Object.assign({}, streamConfig)),
        });
        break;
      default:
        break;
    }
  }

  /**
   * [resolvePayload description]
   * @param  {[type]} args [description]
   * @return {[type]}      [description]
   */
  static resolvePayload(args): Object {
    let payload: Object = {};
    const arg1: any = args[0];

    switch (typeof arg1) {
      case 'object':
        payload = arg1;
        break;
      default:
        payload.message = arg1;
        payload.code = args[1];
        break;
    }
    return payload;
  }
}

/**
 * Setup automatic function call logging when in debug mode
 * @param  {[type]} config [description]
 * @return {[type]}        [description]
 */
if (config.debug) {
  const logger: Object = Logger.get('root');
  const oldCall: Function = Function.prototype.call;
  const newCall: Function = function (self) {
    Function.prototype.call = oldCall;
    logger.debug({ message: `Entering method ${this.name}`, method: this.name });
    const args: Array<any> = Array.prototype.slice.call(arguments, 1);
    const ret: any = this.apply(self, args);

    logger.debug({ message: `Exiting method ${this.name}`, method: this.name });
    Function.prototype.call = newCall;
    return ret;
  };

  Function.prototype.call = newCall;
}
