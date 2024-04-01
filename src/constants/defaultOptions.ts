import { defaultKeyGenerator } from '../services/defaultKeyGenerator'
import { DefaultContext } from '../services/defaultContext'

import type { Options } from '../@types/Options'

export const defaultOptions: Options = {
  duration: 60000,
  max: 10,
  responseCode: 429,
  responseMessage: 'rate-limit reached',
  countFailedRequest: false,
  generator: defaultKeyGenerator,
  context: new DefaultContext(),
  skip: () => false,
}
