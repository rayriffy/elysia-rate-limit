import { defaultKeyGenerator } from '../services/defaultKeyGenerator'

import type { Options } from '../@types/Options'

export const defaultOptions: Omit<Options, 'context'> = {
  duration: 60000,
  max: 10,
  errorResponse: 'rate-limit reached',
  scoping: 'global',
  countFailedRequest: false,
  generator: defaultKeyGenerator,
  skip: () => false,
}
