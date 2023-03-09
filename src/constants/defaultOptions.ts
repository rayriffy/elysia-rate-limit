import { keyGenerator } from '../services/keyGenerator'
import { DefaultContext } from './defaultContext'

import type { Options } from '../@types/Options'

export const defaultOptions: Options = {
  duration: 60000,
  max: 10,
  responseCode: 429,
  responseMessage: 'rate-limit reached',
  countFailedRequest: false,
  generator: keyGenerator,
  context: new DefaultContext(),
  skip: () => false,
}
