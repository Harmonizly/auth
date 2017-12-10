import swaggerConfig from 'configuration/swagger.yaml';

export function meta(request: Object, response: Object): void {
  return response.send(swaggerConfig);
}
