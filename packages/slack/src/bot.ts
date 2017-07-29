import * as uuid from 'uuid'
import * as _ from 'lodash'
import { Bot, Dialog, Command } from '@xene/core'

import Dispatcher from './dispatcher'
import middleware from './middleware'

import isMentioned from './helpers/is-mentioned'
import interpolate from './helpers/interpolate'
import { isPrivateChannel } from './helpers/channel-type'

import { User, Message as APIMessage } from './types'
import { Auth, RTM, Chat, Users, Groups, Channels } from './api'

export type Message = string | APIMessage
export type DialogType<B extends Bot<any, any>> = new (a: B, s: string) => Dialog<B>
export type CommandType<B extends Bot<any, any>> = new (a: B, s: string) => Command<B>

export class Slackbot extends Bot<Message, User> {
  // Default dispatcher, used when user didn't provide
  // custom dispatcher. This is moslty used when user has
  // one type of bot, which is a common case
  static dispatcher = new Dispatcher()
  static middleware = middleware
  static oauthAccess = Auth.access

  id: string
  bot: { id: string, name: string }

  // API Modules
  rtm: RTM
  auth: Auth
  chat: Chat
  users: Users
  groups: Groups
  channels: Channels

  constructor(options: {
    id?: string,
    botToken: string,
    appToken?: string,
    dialogs: DialogType<Slackbot>[],
    commands?: CommandType<Slackbot>[],
    dispatcher?: Dispatcher
  }) {
    super(options as any)
    this.id = options.id || uuid.v4()

    this.chat = new Chat(options.botToken)
    this.rtm = new RTM(options.botToken)
    this.rtm.on('message', this.onRtmMessage.bind(this))
    this.rtm.connect().then(i => this.bot = i.self)

    // Some of these API scopes' methods require additional
    // scopes which are defined only for apps and app tokens respectively
    this.auth = new Auth(options.appToken || options.botToken)
    this.users = new Users(options.appToken || options.botToken)
    this.groups = new Groups(options.appToken || options.botToken)
    this.channels = new Channels(options.appToken || options.botToken)

    if (options.dispatcher) options.dispatcher.add(this.id, this)
    else Slackbot.dispatcher.add(this.id, this)
  }

  formatMessage(message: Message, object: object): Message {
    return interpolate(message, object)
  }

  async sendMessage(chat: string, message: Message, options?: any) {
    const init = { text: '', attachments: [] }
    message = _.isString(message) ? { ...init, text: message } : { ...init, ...message }
    message.attachments.forEach(a => a.callbackId = a.callbackId || this.id)
    return this.chat.postMessage(chat, message)
  }

  // Process incoming interactive messages
  // like button actions from slack
  // Called from Dispatcher
  async onInteractiveMessage(payload): Promise<Message> {
    const selected = payload.actions[0]
    const text = payload.originalMessage.text
    let attachments = payload.originalMessage.attachments
    attachments = attachments.map(this.markActionSelected.bind(this, selected))
    this.onMessage({
      id: payload.ts,
      text: selected.value,
      chat: payload.channel.id,
      user: await this.users.info(payload.user.id)
    })
    return { text, attachments }
  }

  markActionSelected(action, attachment) {
    const selectedReplacer = ':white_check_mark: ' + action.text
    if (_.find(attachment.actions, ['value', action.value])) {
      const title = attachment.title
      delete attachment.actions
      attachment.title = title ? (title + '\n' + selectedReplacer) : selectedReplacer
    }
    return attachment
  }

  // Process new incoming RTM messages
  private async onRtmMessage(payload: { ts: string, text: string, user: string, channel: string }) {
    if (this.bot.id === payload.user) return

    const isBotMentioned = isMentioned(this.bot.id, payload.text)
    const isPrivate = isPrivateChannel(payload.channel)
    if (!isPrivate && !isBotMentioned) return

    this.onMessage({
      id: payload.ts,
      text: payload.text,
      user: await this.users.info(payload.user),
      chat: payload.channel
    })
  }
}
