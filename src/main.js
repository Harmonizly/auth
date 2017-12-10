import bodyParser from 'body-parser';
import config from 'config';
import compression from 'compression';
import cors from 'cors';
import express from 'express';
import flash from 'connect-flash-plus';
import fs from 'fs';
import helmet from 'helmet';
import https from 'https';
import Logger from 'server/utils/logger';
import requestLogger from 'server/middleware/logging';
import process from 'process';
import swagger from 'swagger-node-runner';
import swaggerConfig from 'configuration/swagger.yaml';
import SwaggerUi from 'swagger-tools/middleware/swagger-ui';
import transactionMiddleware from 'server/middleware/transaction';

import * as swaggerSecurityHandler from 'server/api/security';

import { configurePassport } from 'server/lib/passport';
import { errorMiddleware, notFoundError } from 'server/middleware/error';

/**
 * [app description]
 * @type {[type]}
 */
export default class Server {
  app: Function;
  config: Object;
  logger: Object;

  /**
   * [constructor description]
   * @param  {[type]} void [description]
   * @return {[type]}      [description]
   */
  constructor(): void {
    this.config = config.get('server');

    // Initialize the express server
    this.app = express();
    this.logger = Logger.get('root');

    // Catches ctrl+c event
    this.boundSigIntHandler = this.sigIntHandler.bind(this);
    process.on('SIGINT', this.boundSigIntHandler);

    // Catches uncaught exceptions
    this.boundUncaughtExceptionHandler = this.unhandledExceptionHandler.bind(this);
    process.on('uncaughtException', this.boundUncaughtExceptionHandler);
  }

  /**
   * [destroy description]
   * @param  {[type]} void [description]
   * @return {[type]}      [description]
   */
  destroy(): void {
    this.removeEventListeners();
    // TODO logger destroy
    // TODO send destroy event?
  }

  /**
   * Attach middleware & controllers to the Express app.
   * Note: Order matters here.
   * @param  {[type]}  void [description]
   * @return {Promise}      [description]
   */
  async initialize(app: Object, conf: Object): void {
    this.initMiddleware(app, conf);
    await this.initControllers(app);
  }

  /**
   * [initControllers description]
   * @return {Promise} [description]
   */
  async initControllers(app: Object): void {
    // CONTROLLERS

    // Setup all swagger routes
    await this.initSwagger();

    // Send 404 if we get here in the route processing
    app.all('*', notFoundError);
  }

  /**
   * [initMiddleware description]
   * @return {Promise} [description]
   */
  initMiddleware(app: Object, conf: Object): void {
    // MIDDLEWARE

    // Add common request security measures
    app.use(helmet());

    // Enabled CORS (corss-origin resource sharing)
    app.use(cors());

    // request compression
    app.use(compression());

    // Initialize body parser before routes or body will be undefined
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(bodyParser.json());

    // Setup flash messaging
    app.use(flash({ unsafe: true }));

    // Trace a single request process (including over async)
    app.use(transactionMiddleware);

    // Configure Request logging
    // TODO switch to morgan
    app.use(requestLogger);

    // Hook up passport
    configurePassport(app, conf);

    // Configure the request error handling
    app.use(errorMiddleware);
  }

  /**
   * [initSwagger description]
   * @param  {[type]} Promise [description]
   * @return {[type]}        [description]
   */
  initSwagger(): Promise<void> {
    return new Promise((resolve, reject) => {
      swagger.create({
        appRoot: process.cwd(),
        swagger: swaggerConfig,
        swaggerSecurityHandlers: swaggerSecurityHandler,
      }, (error: any, runner: Object): void => {
        if (error) {
          return reject(error);
        }

        const middleware = runner.expressMiddleware();

        this.app.use(SwaggerUi(middleware.runner.swagger));
        middleware.register(this.app);
        return resolve();
      });
    });
  }

  /**
   * [callback description]
   * @type {Function}
   */
  async start(callback: Function | null = null): void {
    if (!this.app) {
      throw new Error('Cannot start server: the express instance is not defined');
    }

    const cb = () => {
      if (callback != null) {
        callback();
      }
      // process.send('ready');
      this.logger.info(`Server listening at ${this.config.get('hostname')}:${this.config.get('port')}...`);
    };

    try {
      await this.initialize(this.app, this.config);
      return (this.config.get('secure')) ? this.startHttps(cb) : this.startHttp(cb);
    } catch (e) {
      if (this.logger) {
        this.logger.error(e);
      } else {
        /* eslint-disable no-console */
        console.error(e);
      }
      this.destroy();
      throw e;
    }
  }

  /**
   * [startHttp description]
   * @param  {[type]} void [description]
   * @return {[type]}      [description]
   */
  startHttp(callback: Function): void {
    return this.app.listen(
      this.config.get('port'),
      this.config.get('hostname'),
      this.config.get('backlog'),
      callback,
    );
  }

  /**
   * [startHttps description]
   * @param  {[type]} void [description]
   * @return {[type]}      [description]
   */
  startHttps(callback: Function): void {
    this.app.all('*', function cb(request: Object, response: Object, next: Function) {
      if (request.secure) {
        return next();
      }

      return response.redirect(`https://${request.hostname}:${this.config.get('port')}${request.url}`);
    });

    const sslConfig = this.config.get('ssl');
    const httpsConfig = Object.assign({}, sslConfig, {
      key: fs.readFileSync(sslConfig.get('key')),
      cert: fs.readFileSync(sslConfig.get('cert')),
    });

    return https.createServer(httpsConfig, this.app).listen(
      this.config.get('port'),
      this.config.get('hostname'),
      this.config.get('backlog'),
      callback,
    );
  }

  /**
   * [stop description]
   * @param  {Function} callback [description]
   * @return {[type]}            [description]
   */
  stop(callback: Function | null = null): void {
    if (this.app && this.app.server) {
      this.app.server.close(() => {
        if (callback != null && typeof callback === 'function') {
          callback();
        }
        this.logger.info(`Server (${this.config.hostname}:${this.config.port}) stopping...`);
      });
    }
    this.destroy();
  }

  /**
   * [sigIntHandler description]
   * @param  {[type]} void [description]
   * @return {[type]}      [description]
   */
  sigIntHandler(): void {
    if (this.logger) {
      this.logger.info('Captured ctrl-c');
    }

    this.stop();
    process.exit(0);
  }

  /**
   * [removeEventListeners description]
   * @param  {[type]} void [description]
   * @return {[type]}      [description]
   */
  removeEventListeners(): void {
    process.removeListener('SIGINT', this.boundSigIntHandler);
    process.removeListener('uncaughtException', this.boundUncaughtExceptionHandler);
  }

  /**
   * [unhandledExceptionHandler description]
   * @param  {[type]} e [description]
   * @return {[type]}   [description]
   */
  unhandledExceptionHandler(e: Error): void {
    if (this.logger) {
      this.logger.error(`Unhandled Exception. ${e}`);
    }

    this.stop();
    process.exit(1);
  }
}
