// @flow

export const FATAL_ERROR: Object = {
  status: 500,
  code: 0,
  category: 'IllegalStateException',
  message: 'An error occurred. If this error persists, please contact your System Administrator',
};

export const GENERAL_ERROR: Function = function (message: string, extra: string = ''): Object {
  return {
    status: 400,
    code: 0,
    category: 'GeneralException',
    message,
    extra,
  };
};

export const NOT_YET_IMPLEMENTED: Object = {
  status: 501,
  code: 1,
  category: 'NotYetImplemented',
  message: 'This method must be implmented',
};

export const ILLEGAL_STATE_EXCEPTION: Object = {
  status: 500,
  code: 2,
  category: 'IllegalStateException',
  message: 'Application not configured correctly',
};

export const NOT_AUTHORIZED: Object = {
  status: 401,
  code: 3,
  category: 'SecurityException',
  message: 'You are not authorized to access this resource',
};

export const NOT_ALLOWED: Object = {
  status: 403,
  code: 4,
  category: 'SecurityException',
  message: 'You are not authorized to access this resource',
};

export const MISSING_REQUIRED_PARAMETER: Object = {
  status: 400,
  code: 5,
  category: 'GeneralException',
  message: 'A required parameter was missing',
};

export const MODEL_NOT_FOUND: Object = {
  status: 404,
  code: 100,
  category: 'NotFoundException',
  message: 'Requested model could not be found',
};

export const MODEL_NOT_UPDATED: Object = {
  status: 400,
  code: 200,
  category: 'TransactionException',
  message: 'Update failed',
};

export const MODEL_NOT_CREATED: Object = {
  status: 400,
  code: 201,
  category: 'TransactionException',
  message: 'Creation failed',
};

export const VALIDATION_ERROR: Function = function (message: string, extra: string = ''): Object {
  return {
    status: 400,
    code: 202,
    category: 'ValidationException',
    message,
    extra,
  };
};
