import auth0 from 'auth0';
import Auth0Strategy from 'passport-auth0';
import JwtStrategy from 'passport-jwt';
import passport from 'passport';

passport.initialize();

/**
 * [auth description]
 * @param  {[type]} app    [description]
 * @param  {[type]} config [description]
 * @return {[type]}        [description]
 */
export function configurePassport(app: Object, config: Object): void {
  // Configure Passport to use Auth0
  passport.use('auth0', new Auth0Strategy(
    config.auth0.client,
    (accessToken: string, refreshToken: string, extraParams: any, profile: ?Object, done: Function): void => {
      debugger;
      return done(null, profile, extraParams);
    },
  ));

  // Configure Passport to use JWT auth validation
  const jwtOpts: Object = { ...config.auth0.jwt };

  jwtOpts.jwtFromRequest = JwtStrategy.ExtractJwt.fromAuthHeaderAsBearerToken();
  passport.use('jwt', new JwtStrategy.Strategy(
    jwtOpts,
    async (payload: Object, done: Function): void => {
      const management: Object = new auth0.ManagementClient(config.auth.api);

      try {
        debugger;
        const user: Object = await management.getUser({
          id: payload.sub,
        });

        if (!user) {
          return done(null, false);
        }

        return done(null, user);
      } catch (e) {
        return done(e);
      }
    },
  ));

  passport.serializeUser((user: Object, done: Function): void => {
    done(null, user);
  });

  passport.deserializeUser((user: Object, done: Function): void => {
    done(null, user);
  });
}

export default passport;
