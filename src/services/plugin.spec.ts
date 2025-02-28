import { describe, expect, it, mock } from 'bun:test'
import { Elysia } from 'elysia'
import { plugin } from './plugin'
import { DefaultContext } from './defaultContext'
import type { Options } from '../@types/Options'

describe('rate limit plugin', () => {
  it('should initialize with default options', () => {
    const app = new Elysia()
    const rateLimitPlugin = plugin()
    const appWithPlugin = rateLimitPlugin(app)
    
    expect(appWithPlugin).toBeInstanceOf(Elysia)
  })

  it('should accept custom options', () => {
    const app = new Elysia()
    const customContext = new DefaultContext()
    const initSpy = mock((options: Omit<Options, 'context'>) => {})
    customContext.init = initSpy
    
    const rateLimitPlugin = plugin({
      max: 10,
      duration: 60000,
      context: customContext,
    })
    
    const appWithPlugin = rateLimitPlugin(app)
    
    expect(appWithPlugin).toBeInstanceOf(Elysia)
    expect(initSpy).toHaveBeenCalled()
  })
})