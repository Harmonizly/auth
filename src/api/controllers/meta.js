import swaggerConfig from 'configuration/swagger.yaml';

export function describe(request: Object, response: Object): void {
  return response.send(swaggerConfig);
}
