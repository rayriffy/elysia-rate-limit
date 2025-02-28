import { describe, expect, it, mock } from 'bun:test'
import { defaultKeyGenerator } from './defaultKeyGenerator'
import type { Server } from 'elysia/universal/server'

describe('defaultKeyGenerator', () => {
  it('should return client IP address', () => {
    const mockRequest = {} as Request
    const mockServer = {
      requestIP: mock(() => ({ address: '192.168.1.1' })),
    }
    
    const key = defaultKeyGenerator(mockRequest, mockServer as unknown as Server, {})
    
    expect(key).toBe('192.168.1.1')
    expect(mockServer.requestIP).toHaveBeenCalledWith(mockRequest)
  })
  
  it('should return empty string when IP address is undefined', () => {
    const mockRequest = {} as Request
    const mockServer = {
      requestIP: mock(() => ({ address: undefined })),
    }
    
    // Mock console.warn to avoid output during tests
    const originalWarn = console.warn
    console.warn = mock(() => {})
    
    const key = defaultKeyGenerator(mockRequest, mockServer as unknown as Server, {})
    
    expect(key).toBe('')
    expect(mockServer.requestIP).toHaveBeenCalledWith(mockRequest)
    expect(console.warn).toHaveBeenCalled()
    
    // Restore console.warn
    console.warn = originalWarn
  })
  
  it('should return empty string when requestIP returns null', () => {
    const mockRequest = {} as Request
    const mockServer = {
      requestIP: mock(() => null),
    }
    
    // Mock console.warn to avoid output during tests
    const originalWarn = console.warn
    console.warn = mock(() => {})
    
    const key = defaultKeyGenerator(mockRequest, mockServer as unknown as Server, {})
    
    expect(key).toBe('')
    expect(mockServer.requestIP).toHaveBeenCalledWith(mockRequest)
    expect(console.warn).toHaveBeenCalled()
    
    // Restore console.warn
    console.warn = originalWarn
  })
  
  it('should return empty string when server is null', () => {
    const mockRequest = {} as Request
    
    // Mock console.warn to avoid output during tests
    const originalWarn = console.warn
    console.warn = mock(() => {})
    
    const key = defaultKeyGenerator(mockRequest, null, {})
    
    expect(key).toBe('')
    expect(console.warn).toHaveBeenCalled()
    
    // Restore console.warn
    console.warn = originalWarn
  })
  
  it('should return empty string when request is undefined', () => {
    // Mock console.warn to avoid output during tests
    const originalWarn = console.warn
    console.warn = mock(() => {})
    
    const key = defaultKeyGenerator(undefined as unknown as Request, null, {})
    
    expect(key).toBe('')
    expect(console.warn).toHaveBeenCalled()
    
    // Restore console.warn
    console.warn = originalWarn
  })
})