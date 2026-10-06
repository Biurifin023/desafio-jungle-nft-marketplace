import { accountHandlers } from './account'
import { cartHandlers } from './cart'
import { catalogHandlers } from './catalog'
import { orderHandlers } from './orders'
import { sessionHandlers } from './session'

export const handlers = [...sessionHandlers, ...catalogHandlers, ...cartHandlers, ...orderHandlers, ...accountHandlers]
