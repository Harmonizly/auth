import Logger from 'server/utils/logger';
import passport from 'server/lib/passport';

const LOGGER: Object = Logger.get('root');

/**
 *
 * @param {*} user
 * @param {*} request
 * @param {*} response
 */
function attemptLogin(user: Object, request: Object, response: Object): void {
  return request.login(user, (loginError: Object) => {
    if (loginError) {
      // TODO format error
      LOGGER.error(loginError);
      return response.status(400).send(loginError);
    }

    return response.json({
      loading: true,
    });
  });
}

/**
 *
 * @param {*} request
 * @param {*} response
 * @param {*} next
 */
export function authorized(request: Object, response: Object, next: Function): void {
  return passport.authenticate('auth0', (error: Object, user: Object): void => {
    if (error) {
      // TODO format error
      LOGGER.error(error);
      return response.redirect('/');
    }

    debugger;
    if (!user) {
      return response.status(401).json({ message: 'Login failed' });
    }

    // TODO handle next
    // TODO make default route a constant
    return response.redirect('/app/dashboard');
  })(request, response, next);
}

/**
 *
 * @param {*} request
 * @param {*} response
 * @param {*} next
 */
export function login(request: Object, response: Object, next: Function): void {
  return passport.authenticate('auth0', (error: Object, user: Object, info: any): void => {
    if (error) {
      // TODO format error
      LOGGER.error(error);
      return response.status(400).send(error);
    }

    if (!user) {
      return response.status(401).json({ message: 'Login failed' });
    }

    console.log(info);
    debugger;
    return attemptLogin(user, request, response);
  })(request, response, next);
}

/**
 *
 * @param {*} request
 * @param {*} response
 */
export function logout(request: Object, response: Object): void {
  request.logout();
  response.redirect('/');
}

/**
 *
 * @param {*} request
 * @param {*} response
 */
export function validate(request: Object, response: Object, next: Function): void {
  return passport.authenticate('jwt', (error: Object, user: Object) => {
    if (error) {
      // TODO format error
      LOGGER.error(error);
      response.status(500).send(error);
    }

    debugger;
    if (!user) {
      return response.status(401).send();
    }

    // TODO ensure that the JWT token is being returned
    return response.send();
  })(request, response, next);
}
