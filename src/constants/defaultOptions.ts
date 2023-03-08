import { keyGenerator } from '../services/keyGenerator'

import type { Options } from '../@types/Options'

export const defaultOptions: Options = {
  duration: 60000,
  max: 10,
  responseCode: 429,
  responseMessage: 'rate-limit reached',
  generator: keyGenerator,
}
