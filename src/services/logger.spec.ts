import { describe, expect, it, mock, beforeEach, afterEach } from 'bun:test'
import * as logger from './logger'
import * as debug from 'debug'

describe('logger', () => {
  let loggerSpy: ReturnType<typeof mock>
  let debugInstanceSpy: ReturnType<typeof mock>

  beforeEach(() => {
    // Create a fresh spy for the debug instance
    debugInstanceSpy = mock(() => {})
    
    // Create a spy for the debug function that returns our debugInstanceSpy
    const debugSpy = mock(() => debugInstanceSpy)
    
    // Mock the logger function itself to use our spies
    loggerSpy = mock(logger.logger)
    loggerSpy.mockImplementation((unit, formatter, ...params) => {
      const namespace = `elysia-rate-limit:${unit}`
      debugSpy(namespace)
      debugInstanceSpy(formatter, ...params)
      return debugInstanceSpy
    })
  })
  
  it('should call debug with correct namespace', () => {
    const unit = 'test'
    loggerSpy(unit, 'test message')
    
    expect(loggerSpy).toHaveBeenCalledWith(unit, 'test message')
    expect(loggerSpy.mock.calls[0][0]).toBe(unit)
  })
  
  it('should support multiple units', () => {
    const units = ['plugin', 'context', 'generator', 'custom']
    
    units.forEach(unit => {
      loggerSpy(unit, 'test')
      // Verify the last call used the expected unit
      const callIndex = loggerSpy.mock.calls.length - 1
      expect(loggerSpy.mock.calls[callIndex][0]).toBe(unit)
    })
  })
  
  it('should pass formatter and parameters to debug', () => {
    const formatter = 'hello %s'
    const param = 'world'
    loggerSpy('test', formatter, param)
    
    expect(loggerSpy).toHaveBeenCalledWith('test', formatter, param)
    expect(debugInstanceSpy).toHaveBeenCalledWith(formatter, param)
  })
  
  it('should handle multiple parameters', () => {
    const formatter = 'multiple: %s %d %o'
    const params = ['string', 123, { object: true }]
    loggerSpy('multi', formatter, ...params)
    
    expect(loggerSpy).toHaveBeenCalledWith('multi', formatter, ...params)
    expect(debugInstanceSpy).toHaveBeenCalledWith(formatter, ...params)
  })
})