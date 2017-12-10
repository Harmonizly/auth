import debug from 'debug';
import assert from 'assert';
import util from 'util';

// TODO make this configurable
import * as controllers from 'server/api/controllers';

const SWAGGER_ROUTER_CONTROLLER = 'x-swagger-router-controller';
const CONTROLLER_INTERFACE_TYPE = 'x-controller-interface';
const allowedCtrlInterfaces = ['middleware', 'pipe', 'auto-detect'];

export default function create(def, bagpipes) {
  const fittingDef = def;

  debug('config: %j', fittingDef);

  if (!fittingDef.controllersInterface) fittingDef.controllersInterface = 'middleware';
  assert(
    ~allowedCtrlInterfaces.indexOf(fittingDef.controllersInterface),
    `value in swagger_router config.controllersInterface - can be one of \
    ${allowedCtrlInterfaces} but got: ${fittingDef.controllersInterface}`,
  );

  const { swaggerNodeRunner } = bagpipes.config;

  swaggerNodeRunner.api.getOperations().forEach((op) => {
    const operation = op;
    const interfaceType = operation.definition[CONTROLLER_INTERFACE_TYPE] ||
      operation.pathObject.definition[CONTROLLER_INTERFACE_TYPE] ||
      swaggerNodeRunner.api.definition[CONTROLLER_INTERFACE_TYPE] ||
      fittingDef.controllersInterface;

    operation.controllerInterface = interfaceType;

    assert(
      ~allowedCtrlInterfaces.indexOf(interfaceType),
      `whenever provided, value of ${CONTROLLER_INTERFACE_TYPE} directive in openapi doc must be one of \
      ${allowedCtrlInterfaces} but got: ${interfaceType}`,
    );
  });

  const mockMode = !!fittingDef.mockMode || !!swaggerNodeRunner.config.swagger.mockMode;
  const controllerFunctionsCache = {};

  return function router(ctx, cb) {
    const context = ctx;

    debug('exec');

    const { operation } = context.request.swagger;
    const controllerName = operation[SWAGGER_ROUTER_CONTROLLER] || operation.pathObject[SWAGGER_ROUTER_CONTROLLER];

    let controller;

    if (controllerName in controllerFunctionsCache) {
      debug('controller in cache', controllerName);
      controller = controllerFunctionsCache[controllerName];
    } else {
      debug('loading controller %s from fs: %s', controllerName, controllers);
      if (!(controllerName in controllers)) {
        if (!mockMode) {
          return cb(`Controller ${controllerName} not defined in controllers`);
        }
        debug('controller not in', controllers);
      } else {
        controller = controllers[controllerName];
        controllerFunctionsCache[controllerName] = controller;
        debug('controller found', controllerName);
      }
    }

    if (controller) {
      const operationId = operation.definition.operationId || context.request.method.toLowerCase();
      const controllerFunction = controller[operationId];

      if (controllerFunction && typeof controllerFunction === 'function') {
        if (operation.controllerInterface === 'auto-detect') {
          operation.controllerInterface =
            controllerFunction.length === 3 ? 'middleware' : 'pipe';
          debug(
            "auto-detected interface-type for operation '%s' at [%s] as '%s'",
            operationId,
            operation.pathToDefinition,
            operation.controllerInterface,
          );
        }

        debug('running controller, as %s', operation.controllerInterface);
        return operation.controllerInterface === 'pipe'
          ? controllerFunction(context, cb)
          : controllerFunction(context.request, context.response, cb);
      }

      const msg = util.format('Controller %s doesn\'t export handler function %s', controllerName, operationId);

      if (mockMode) {
        debug(msg);
      } else {
        return cb(new Error(msg));
      }
    }

    if (mockMode) {
      const statusCode = parseInt(context.request.get('_mockreturnstatus'), 10) || 200;
      const mimetype = context.request.get('accept') || 'application/json';

      let mock = operation.getResponse(statusCode).getExample(mimetype);

      if (mock) {
        debug('returning mock example value', mock);
      } else {
        mock = operation.getResponse(statusCode).getSample();
        debug('returning mock sample value', mock);
      }

      context.headers['Content-Type'] = mimetype;
      context.statusCode = statusCode;

      return cb(null, mock);
    }

    // for completeness, we should never actually get here
    return cb(new Error(util.format('No controller found for %s in %j', controllerName, controllers)));
  };
}
