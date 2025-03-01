import { describe, expect, it } from 'bun:test'
import { defaultOptions } from './defaultOptions'
import { defaultKeyGenerator } from '../services/defaultKeyGenerator'

describe('defaultOptions', () => {
  it('should have the expected default values', () => {
    expect(defaultOptions).toEqual({
      duration: 60000,
      max: 10,
      errorResponse: 'rate-limit reached',
      scoping: 'global',
      countFailedRequest: false,
      generator: defaultKeyGenerator,
      headers: true,
      skip: expect.any(Function),
    })
  })
  
  it('should have a skip function that returns false by default', () => {
    const mockRequest = {} as Request
    expect(defaultOptions.skip(mockRequest)).toBe(false)
  })
  
  it('should use defaultKeyGenerator as the generator function', () => {
    expect(defaultOptions.generator).toBe(defaultKeyGenerator)
  })
})