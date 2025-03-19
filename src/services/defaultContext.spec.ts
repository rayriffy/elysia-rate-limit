import { describe, expect, it, beforeEach, afterEach } from 'bun:test'
import { DefaultContext } from './defaultContext'
import { defaultOptions } from '../constants/defaultOptions'
import type { Options } from '../@types/Options'

describe('DefaultContext', () => {
  let context: DefaultContext
  
  beforeEach(() => {
    context = new DefaultContext()
    context.init({
      ...defaultOptions,
    })
  })
  
  afterEach(async () => {
    await context.kill()
  })
  
  it('should initialize with default maxSize', () => {
    const ctx = new DefaultContext()
    expect(ctx).toBeInstanceOf(DefaultContext)
  })
  
  it('should initialize with custom maxSize', () => {
    const ctx = new DefaultContext(1000)
    expect(ctx).toBeInstanceOf(DefaultContext)
  })
  
  it('should increment counter for new key', async () => {
    const key = 'test-key-1'
    const result = await context.increment(key)
    
    expect(result.count).toBe(1)
    expect(result.nextReset).toBeInstanceOf(Date)
    expect(result.nextReset.getTime()).toBeGreaterThan(Date.now())
  })
  
  it('should increment counter for existing key', async () => {
    const key = 'test-key-2'
    
    await context.increment(key)
    const result = await context.increment(key)
    
    expect(result.count).toBe(2)
  })
  
  it('should decrement counter', async () => {
    const key = 'test-key-3'
    
    await context.increment(key)
    await context.increment(key)
    await context.decrement(key)
    
    const result = await context.increment(key)
    expect(result.count).toBe(2) // It should be 2 after decrement and new increment
  })
  
  it('should reset counter for specific key', async () => {
    const key1 = 'test-key-4'
    const key2 = 'test-key-5'
    
    await context.increment(key1)
    await context.increment(key2)
    await context.reset(key1)
    
    const result1 = await context.increment(key1)
    expect(result1.count).toBe(1) // Should be reset
    
    const result2 = await context.increment(key2)
    expect(result2.count).toBe(2) // Should still be incremented
  })
  
  it('should reset all counters', async () => {
    const key1 = 'test-key-6'
    const key2 = 'test-key-7'
    
    await context.increment(key1)
    await context.increment(key2)
    await context.reset()
    
    const result1 = await context.increment(key1)
    expect(result1.count).toBe(1)
    
    const result2 = await context.increment(key2)
    expect(result2.count).toBe(1)
  })
  
  it('should handle expired keys correctly', async () => {
    // Create context with a very short duration
    const shortContext = new DefaultContext()
    shortContext.init({
      ...defaultOptions,
      duration: 10
    } as Omit<Options, 'context'>)
    
    const key = 'test-key-8'
    
    await shortContext.increment(key)
    
    // Wait for the timeout to expire
    await new Promise<void>(resolve => setTimeout(resolve, 15))
    
    // After expiration, the count should reset
    const result = await shortContext.increment(key)
    expect(result.count).toBe(1)
    
    await shortContext.kill()
  })
})