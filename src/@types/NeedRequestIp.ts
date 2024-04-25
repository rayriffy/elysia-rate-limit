import { Server } from 'bun'

export interface NeedRequestIP {
  [key: string]: any
  server: {
    [key: string]: any
    requestIP: Server['requestIP']
  } | null
}
