import domain from 'domain';
import uuidv4 from 'uuid/v4';

/**
 * Add a transaction identifier to every request to track a request's control flow. We use a transactoin ID instead of
 * the session ID or user since both are persistent(ish) identification.
 *
 * @param  {[type]}   request  [description]
 * @param  {[type]}   response [description]
 * @param  {Function} next     [description]
 * @return {[type]}            [description]
 */
export default function transactionMiddleware(request: Object, response: Object, next: Function): void {
  const transactionId: string = uuidv4();
  const transaction: Object = domain.create();

  // eslint-disable-next-line no-param-reassign
  request.transactionId = transactionId;

  transaction.add(request);
  transaction.add(response);
  transaction.data = {
    id: transactionId,
    request,
    response,
  };

  transaction.run(next);
}
