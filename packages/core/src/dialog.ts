import { Bot as B } from './bot'
import { Queue } from './queue'

export type ErrorFunc<T> = (reply: string, parsed: T) => void
export type ParseFunc<T> = (message: string) => T
export type CheckFunc<T> = (parsed: T) => boolean
export type ParserObject<T> = { parse: ParseFunc<T>, check: CheckFunc<T> }
export type Parser<T> = ParseFunc<T> | ParserObject<T>

const isNil = v => v == null
const isFunction = (v): v is Function => typeof v === 'function'

export class Dialog<
  Bot extends B<any, { id: string }>,
  BotMessage extends Bot['_']['Message']= Bot['_']['Message'],
  User extends Bot['_']['User']= Bot['_']['User']
  > {

  static isDefault = false
  static match(message: string): boolean { return false }

  user: User
  queue: Queue = new Queue()

  constructor(public bot: Bot, public chat: string) {
    this.ask = this.ask.bind(this)
    this.parse = this.parse.bind(this)
    this.message = this.message.bind(this)
  }

  /**
   * All communication logic(send a message, parse, ask something) during dialog
   * lifecycle are located here. This method is called by `Bot` if user's message
   * is a start for this dialog. When `Promise` returned by `talk` is resolved,
   * `Bot` counts that as the end of the dialog and will not send next messages
   * to this dialog, but run `match` on dialogs and try to find next suitable
   * dialog.
   */
  async talk(): Promise<any> {
    throw new Error('Method talk is not defined')
  }

  onIncomingMessage(message: string): void | Promise<void> {
    /* implemented in a subclass */
  }

  onOutgoingMessage(message: BotMessage): void | Promise<void> {
    /* implemented in a subclass */
  }

  onStart(): void | Promise<void> {
    /* implemented in a subclass */
  }

  onAbort(error?: any): void | Promise<void> {
    /* implemented in a subclass */
  }

  onEnd(): void | Promise<void> {
    /* implemented in a subclass */
  }

  /**
   * Format and send message to user.
   * To learn more about formatting, check [[formatting spec]]
   */
  message(message: BotMessage) {
    const formatted = this.bot.formatMessage(message, this)
    this.onOutgoingMessage(formatted)
    return this.bot.sendMessage(this.chat, formatted)
  }

  /**
   * Queue parse for user messages
   */
  parse<T>(parserFunc: ParseFunc<T>): Promise<T>
  parse<T>(parserFunc: ParseFunc<T>, errorMessage: BotMessage): Promise<T>
  parse<T>(parserFunc: ParseFunc<T>, errorCallback: ErrorFunc<T>): Promise<T>
  parse<T>(parserObject: ParserObject<T>, errorMessage: BotMessage): Promise<T>
  parse<T>(parserObject: ParserObject<T>, errorCallback: ErrorFunc<T>): Promise<T>
  parse<T>(parser: Parser<T>, error?: BotMessage | ErrorFunc<T>): Promise<T> {
    const onError = (!isNil(error) && !isFunction(error)) ? () => this.message(error) : error
    if (isFunction(parser)) parser = { parse: parser, check: parsed => !isNil(parsed) }
    return new Promise((resolve, reject) => this.queue.push({
      parser: parser as ParserObject<T>,
      done: resolve as any,
      error: onError
    }))
  }

  ask<T>(message: BotMessage, parserFunc: ParseFunc<T>): Promise<T>
  ask<T>(message: BotMessage, parserFunc: ParseFunc<T>, errorMessage: BotMessage): Promise<T>
  ask<T>(message: BotMessage, parserFunc: ParseFunc<T>, errorCallback: ErrorFunc<T>): Promise<T>
  ask<T>(message: BotMessage, parserObject: ParserObject<T>): Promise<T>
  ask<T>(message: BotMessage, parserObject: ParserObject<T>, errorMessage: BotMessage): Promise<T>
  ask<T>(message: BotMessage, parserObject: ParserObject<T>, errorCallback: ErrorFunc<T>): Promise<T>
  async ask<T>(message: BotMessage, parser: Parser<T>, error?: BotMessage | ErrorFunc<T>): Promise<T> {
    await this.message(message)
    this.queue.resetMessage()
    if (!error) error = () => this.message(message)
    return this.parse<T>(parser as ParseFunc<T>, error)
  }

  startDialog(dialog: typeof Dialog, options: object = {}) {
    return this.bot.startDialog({ dialog, chat: this.chat, user: this.user, options })
  }
}
