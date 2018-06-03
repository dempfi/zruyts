import * as WebSocket from 'ws'
import { EventEmitter } from 'eventemitter3'

import { APIModule } from '../base'
import { logger } from '../../logger'
import { On, Off } from './types'

const PING_INTERVAL = 5000
const MAX_PONG_INTERVAL = 20000

const boundPromise = (): { resolve: (a?: any) => void, reject: () => void, promise: Promise<any> } => {
  const result = {} as any
  result.promise = new Promise((resolve, reject) => {
    result.resolve = resolve
    result.reject = reject
  })
  return result
}

export class RTM extends APIModule {
  on: On
  off: Off
  private inc: number = 1
  private ws: WebSocket
  private ee = new EventEmitter()
  private pingTimer: number
  private lastPong = 0

  protected get token() {
    if (typeof this.tokens === 'string') return this.tokens
    return this.tokens.botToken || this.tokens.appToken
  }

  constructor(token) {
    super(token)
    this.on = this.ee.addListener.bind(this.ee)
    this.off = this.ee.removeListener.bind(this.ee)
  }

  connect = async () => {
    const promise = boundPromise()
    const response = await this.request('connect')
    this.ws = new WebSocket(response.url)
    this.ws.on('message', this.emit.bind(this))
    this.ws.on('close', this.reconnect.bind(this))
    this.ws.on('open', () => promise.resolve(response))
    return promise.promise
  }

  typing(channel: string) {
    this.wsSend({ type: 'typing', channel })
  }

  private emit(msgString: any) {
    const msg = JSON.parse(msgString)
    if (msg.type === 'hello') this.handleHello()
    if (msg.type === 'pong') this.lastPong = Date.now()
    logger.verbose('Incoming RTM message %s', msg.type)
    this.ee.emit(msg.subtype ? `${msg.type}.${msg.subtype}` : msg.type, msg)
  }

  private handleHello() {
    this.lastPong = Date.now()
    if (this.pingTimer) clearInterval(this.pingTimer)
    this.pingTimer = setInterval(this.pingServer.bind(this), PING_INTERVAL)
  }

  private reconnect() {
    logger.verbose('Reconnecting to RTM API')
    this.disconnect()
    this.connect()
  }

  private disconnect() {
    clearInterval(this.pingTimer)
    this.pingTimer = undefined
    if (!this.ws) return
    this.ws.removeAllListeners('close')
    this.ws.close()
  }

  private pingServer() {
    const pongInterval = Math.abs(Date.now() - this.lastPong - PING_INTERVAL)
    if (pongInterval > MAX_PONG_INTERVAL) return this.reconnect()
    this.wsSend({ type: 'ping' })
  }

  private wsSend(message) {
    this.ws.send(JSON.stringify({ ...message, id: this.inc }))
    this.inc += 1
  }
}
