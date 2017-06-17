import * as uuid from 'uuid'
import * as _ from 'lodash'

import { Bot, Dialog, Command } from '@xene/core'

import Dispatcher from './dispatcher'

import isMentioned from './helpers/is-mentioned'
import { isPrivateChannel } from './helpers/channel-type'

import IUser from './api/types/user'
import { IMessage } from './api/types/message'
export type Message = string | IMessage

// API Modules
import Auth from './api/auth'
import RTM from './api/rtm'
import Chat from './api/chat'
import Users from './api/users'
import Groups from './api/groups'
import Channels from './api/channels'

export default class Slackbot extends Bot<Message, IUser> {
  // Default dispatcher, used when user didn't provide
  // custom dispatcher. This is moslty used when user has
  // one type of bot, which is a common case
  static dispatcher = new Dispatcher()
  static oauthAccess = Auth.access

  id: string
  botId: string

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
    dialogs: (typeof Dialog)[],
    commands?: (typeof Command)[],
    dispatcher?: Dispatcher
  }) {
    super(options)
    this.id = options.id || uuid.v4()
    this.initBot(options.botToken)
    this.initApi(options.appToken || options.botToken)
    if (options.dispatcher) options.dispatcher.add(this.id, this)
    else Slackbot.dispatcher.add(this.id, this)
  }

  formatMessage(message: Message, object: any): Message {
    if (_.isPlainObject(message)) return _.mapValues(message, v => this.formatMessage(v, object))
    if (_.isArray(message)) return message.map(v => this.formatMessage(v, object))
    if (_.isString(message)) return _.template(message)(object)
    return message
  }

  async sendMessage(chat: string, message: Message, options?: any) {
    const init = { text: '', attachments: [] }
    message = _.isString(message) ? {...init, text: message} : {...init, ...message}
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
  // incoming from rtm client
  private async onRtmMessage(payload: {
    ts: string,
    text: string,
    user?: string,
    channel: string,
    subtype?: string
  }) {
    if (!payload.user) return
    if (this.botId === payload.user) return

    const isBotMentioned = isMentioned(this.botId, payload.text)
    const isPrivate = isPrivateChannel(payload.channel)
    if (!isPrivate && !isBotMentioned) return

    this.onMessage({
      id: payload.ts,
      text: payload.text,
      user: await this.users.info(payload.user),
      chat: payload.channel
    })
  }

  private initBot(token: string) {
    this.chat = new Chat(token)
    this.rtm = new RTM(token)
    this.rtm.connect().then(a => console.log('opened', a))
    // this.rtmClient = new RtmClient(token, { logLevel: 'error' })
    // this.rtmClient.on(CLIENT_EVENTS.RTM.AUTHENTICATED, d => (this.botId = d.self.id))
    // this.rtmClient.on(RTM_EVENTS.MESSAGE, this.onRtmMessage.bind(this))
    // this.rtmClient.start()
  }

  private initApi(token: string) {
    this.auth = new Auth(token)
    this.users = new Users(token)
    this.groups = new Groups(token)
    this.channels = new Channels(token)
  }
}
