import Module from './module'
import IGroup from './types/group'
import converter from './converters/camel'

export default class Groups extends Module {

  info(idOrPartial: string | Partial<IGroup>) {
    return super.info<IGroup>(idOrPartial, converter, { arg: 'channel' })
  }

  list(filter?: Partial<IGroup>) {
    return super.list<IGroup>(converter, filter)
  }
}