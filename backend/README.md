# Socket.IO Backend

Basic Express and Socket.IO backend.

## Setup

```bash
npm install
```

## Run

```bash
npm run dev
```

Or:

```bash
npm start
```

Server runs on `http://localhost:5000` by default.

## Socket Events

- `join_room`: join a Socket.IO room.
- `send_message`: broadcast a message globally or to a room.
- `receive_message`: receive messages from the server.
- `typing`: broadcast typing status.
- `welcome`: emitted when a client connects.

Example message payload:

```json
{
  "room": "general",
  "message": "Hello"
}
```
