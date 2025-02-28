import { describe, expect, it, mock, beforeEach, afterEach } from 'bun:test'
import { logger } from './logger'
import * as debug from 'debug'

// Create a spy for debug
const debugFn = (namespace: string) => {
  return (formatter: string, ...args: any[]) => {}
}

describe('logger', () => {
  // Store the original debug function
  const originalDebug = debug.default
  
  // Our test spy
  let debugSpy: ReturnType<typeof mock>
  
  beforeEach(() => {
    // Create a fresh spy for each test
    debugSpy = mock(debugFn)
    
    // Install the spy
    // @ts-expect-error - Overwriting module export for testing
    debug.default = debugSpy
  })
  
  afterEach(() => {
    // Restore the original
    // @ts-expect-error - Restoring module export
    debug.default = originalDebug
  })
  
  it('should call debug with correct namespace', () => {
    const unit = 'test'
    logger(unit, 'test message')
    
    expect(debugSpy).toHaveBeenCalledWith(`elysia-rate-limit:${unit}`)
  })
  
  it('should support multiple units', () => {
    const units = ['plugin', 'context', 'generator', 'custom']
    
    units.forEach(unit => {
      logger(unit, 'test')
      expect(debugSpy).toHaveBeenCalledWith(`elysia-rate-limit:${unit}`)
    })
  })
  
  it('should pass formatter and parameters to debug', () => {
    // We need additional setup to test the full chain
    const innerFunction = mock(() => {})
    debugSpy.mockImplementation((namespace: string) => {
      return innerFunction
    })
    
    const formatter = 'hello %s'
    const param = 'world'
    logger('test', formatter, param)
    
    expect(debugSpy).toHaveBeenCalledWith('elysia-rate-limit:test')
    expect(innerFunction).toHaveBeenCalledWith(formatter, param)
  })
  
  it('should handle multiple parameters', () => {
    // We need additional setup to test the full chain
    const innerFunction = mock(() => {})
    debugSpy.mockImplementation((namespace: string) => {
      return innerFunction
    })
    
    const formatter = 'multiple: %s %d %o'
    const params = ['string', 123, { object: true }]
    logger('multi', formatter, ...params)
    
    expect(debugSpy).toHaveBeenCalledWith('elysia-rate-limit:multi')
    expect(innerFunction).toHaveBeenCalledWith(formatter, ...params)
  })
})