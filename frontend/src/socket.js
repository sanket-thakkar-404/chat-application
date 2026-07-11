import { io } from 'socket.io-client'

export const socket = io(import.meta.env.VITE_SOCKET_URL || undefined, {
  autoConnect: false,
  transports: ['websocket', 'polling'],
})

export const emitWithAck = (event, payload = {}) =>
  new Promise((resolve) => {
    socket.timeout(7000).emit(event, payload, (error, response) => {
      if (error) resolve({ ok: false, error: 'The chat server did not respond' })
      else resolve(response)
    })
  })
