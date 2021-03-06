import { UserMessage } from './types'

export interface IManager {
  users: string[]
  perform(msg: UserMessage): Promise<boolean>
  prepare(): any
  abort(): any
}

const remove = <T>(array: T[], el: T): T[] => {
  const index = array.indexOf(el)
  return index >= 0 ? array.splice(index, 1) : array
}

export class Channel {
  private _managers: IManager[] = []
  private _allManagers: IManager[] = []

  add(manager: IManager) {
    const canPrepare = manager.users.some(u => !this.hasFor(u))
    this._managers.push(manager)
    if (canPrepare) manager.prepare()
  }

  processMessage(message: UserMessage) {
    const manager = this._headFor(message.user)
    const canContinue = manager && manager.perform(message)
    if (canContinue) this._prepareNext(manager)
  }

  hasFor(user: string) {
    for (const { users } of this._managers)
      if (users.includes(user)) return true
    return false
  }

  bind(manager: IManager) {
    this._allManagers.push(manager)
  }

  without(manager: IManager) {
    this._allManagers = this._allManagers.filter(m => m !== manager)
    this._managers = this._managers.filter(m => m !== manager)
  }

  abort(user: string) {
    const head = this._allManagers.find(m => m.users.includes(user))
    if (head) head.abort()
  }

  private _prepareNext(manager: IManager) {
    const users = manager.users.reduce((acc, u) =>
      this._headFor(u) === manager ? acc.concat(u) : acc, [])

    remove(this._managers, manager)
    users.forEach(u => this.hasFor(u) ? this._headFor(u).prepare() : null)
  }

  private _headFor(user: string) {
    for (const manager of this._managers)
      if (manager.users.includes(user)) return manager
  }
}
