import React, { useEffect, useMemo, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'
import { emitWithAck, socket } from './socket'

const Icon = ({ name, size = 20 }) => {
  const paths = {
    users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></>,
    plus: <><path d="M12 5v14M5 12h14"/></>,
    lock: <><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></>,
    key: <><circle cx="7.5" cy="15.5" r="5.5"/><path d="m21 2-9.6 9.6M15 8l3 3M18 5l3 3"/></>,
    arrow: <path d="m9 18 6-6-6-6"/>,
    search: <><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></>,
    message: <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z"/>,
    send: <><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></>,
    smile: <><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01"/></>,
    clip: <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>,
    more: <><circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/></>,
    back: <><path d="m15 18-6-6 6-6"/></>,
    copy: <><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></>,
    check: <path d="m20 6-11 11-5-5"/>,
  }
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>
}

const people = [
  { id: 1, name: 'Maya Chen', color: '#ee8c70', status: 'online', initials: 'MC' },
  { id: 2, name: 'Noah Williams', color: '#5c91d7', status: 'online', initials: 'NW' },
  { id: 3, name: 'Sofia Rossi', color: '#d65e8c', status: 'away', initials: 'SR' },
  { id: 4, name: 'Liam Park', color: '#3aa989', status: 'online', initials: 'LP' },
]

const initialMessages = [
  { id: 1, sender: 'Maya Chen', text: 'Hey everyone! Glad I found this group 👋', time: '10:32 AM', mine: false, color: '#ee8c70', initials: 'MC' },
  { id: 2, sender: 'Noah Williams', text: 'Welcome, Maya! What is everyone working on today?', time: '10:34 AM', mine: false, color: '#5c91d7', initials: 'NW' },
  { id: 3, sender: 'You', text: 'I’m building a small side project. This group is exactly the break I needed.', time: '10:35 AM', mine: true },
  { id: 4, sender: 'Sofia Rossi', text: 'That sounds exciting! Tell us more ✨', time: '10:37 AM', mine: false, color: '#d65e8c', initials: 'SR' },
]

function Avatar({ person, small = false }) {
  return <div className={`avatar ${small ? 'avatar-small' : ''}`} style={{ background: person.color }}><span>{person.initials}</span>{person.status && <i className={`presence ${person.status}`} />}</div>
}

function Welcome({ onAction, userName }) {
  const cards = [
    { type: 'join-random', icon: 'users', tone: 'lavender', title: 'Join random group', text: 'Jump into an active conversation and meet new people.' },
    { type: 'create-random', icon: 'plus', tone: 'peach', title: 'Create random group', text: 'Start a new public circle for others to discover and join.' },
    { type: 'create-private', icon: 'lock', tone: 'mint', title: 'Create private group', text: 'Make an invite-only space and share its secret key.' },
    { type: 'join-private', icon: 'key', tone: 'blue', title: 'Join private group', text: 'Enter an invite key to join your friends’ private circle.' },
  ]
  return <main className="welcome">
    <nav className="topbar"><Brand /><div className="profile-chip"><span className="profile-avatar">{userName ? initials(userName) : '?'}</span><span>{userName || 'Guest'}</span><Icon name="arrow" size={15}/></div></nav>
    <section className="hero">
      <div className="eyebrow"><span /> REAL CONVERSATIONS, RIGHT NOW</div>
      <h1>Find your <em>circle.</em></h1>
      <p>Join a conversation, create your own space, or keep it private.<br/>However you connect, you belong here.</p>
      <div className="action-grid">
        {cards.map((card, i) => <button className="action-card" key={card.type} onClick={() => onAction(card.type)}>
          <span className={`card-icon ${card.tone}`}><Icon name={card.icon} size={24}/></span>
          <span className="card-index">0{i + 1}</span>
          <strong>{card.title}</strong><small>{card.text}</small>
          <span className="card-link">Get started <Icon name="arrow" size={17}/></span>
        </button>)}
      </div>
    </section>
    <footer><span>© 2026 Circle</span><span>Made for meaningful connections</span></footer>
  </main>
}

function Brand() { return <div className="brand"><span className="brand-mark"><i/><i/><i/></span><b>circle</b><span className="brand-dot">.</span></div> }

const initials = name => name.trim().split(/\s+/).map(part => part[0]).join('').slice(0, 2).toUpperCase()

function NameModal({ onClose, onContinue }) {
  const [name, setName] = useState('')
  const submit = event => {
    event.preventDefault()
    const cleanName = name.trim().replace(/\s+/g, ' ')
    if (cleanName.length >= 2) onContinue(cleanName)
  }
  return <div className="modal-wrap">
    <form className="modal name-modal" onSubmit={submit}>
      <button type="button" className="modal-close" onClick={onClose}>×</button>
      <span className="modal-icon lavender"><Icon name="users" size={28}/></span>
      <p className="modal-kicker">BEFORE YOU JOIN</p>
      <h2>What should we call you?</h2>
      <p>This is the name other people will see in the circle.</p>
      <label className="name-label" htmlFor="display-name">Your display name</label>
      <input id="display-name" className="key-input name-input" value={name} maxLength={30} onChange={event => setName(event.target.value)} placeholder="e.g. Sanket Thakkar" autoFocus />
      <button className="primary-btn" disabled={name.trim().length < 2}>Continue to circle <Icon name="arrow" size={17}/></button>
      <small className="privacy-note">You can use your first name or a nickname.</small>
    </form>
  </div>
}

function RoomModal({ mode, onClose, onEnter, generatedKey }) {
  const [key, setKey] = useState('')
  const isCreate = mode === 'create-private'
  return <div className="modal-wrap" onMouseDown={e => e.target === e.currentTarget && onClose()}>
    <div className="modal">
      <button className="modal-close" onClick={onClose}>×</button>
      <span className={`modal-icon ${isCreate ? 'mint' : 'blue'}`}><Icon name={isCreate ? 'lock' : 'key'} size={28}/></span>
      <p className="modal-kicker">PRIVATE CIRCLE</p>
      <h2>{isCreate ? 'Your space is ready' : 'Join a private circle'}</h2>
      <p>{isCreate ? 'Share this key with the people you want to invite.' : 'Enter the private key shared by the group creator.'}</p>
      {isCreate ? <div className="key-box"><code>{generatedKey}</code><button onClick={() => navigator.clipboard?.writeText(generatedKey)} title="Copy key"><Icon name="copy" size={19}/></button></div>
      : <input className="key-input" value={key} onChange={e => setKey(e.target.value.toUpperCase())} placeholder="CIRCLE-XXXXX" autoFocus />}
      <button className="primary-btn" disabled={!isCreate && key.length < 6} onClick={() => onEnter(isCreate ? generatedKey : key)}>{isCreate ? 'Enter my circle' : 'Join circle'} <Icon name="arrow" size={17}/></button>
      <small className="privacy-note"><Icon name="lock" size={13}/> Your private key is never shown publicly.</small>
    </div>
  </div>
}

function Chat({ room, roomKey, initialMembers, socketId, userName, onLeave }) {
  const [messages, setMessages] = useState([])
  const [members, setMembers] = useState(initialMembers || [])
  const [text, setText] = useState('')
  const [active, setActive] = useState({ type: 'group', name: room })
  const [query, setQuery] = useState('')
  const [mobileMenu, setMobileMenu] = useState(false)
  const [typingUsers, setTypingUsers] = useState({})
  const typingTimer = useRef(null)
  const incomingTypingTimers = useRef({})
  const people = members.filter(member => member.socketId !== socketId).map(member => ({ ...member, id: member.socketId, status: 'online' }))
  const send = async () => {
    if (!text.trim()) return
    const message = text.trim()
    setText('')
    clearTimeout(typingTimer.current)
    socket.emit('typing', { type: active.type, to: active.person?.socketId, isTyping: false })
    const result = active.type === 'group'
      ? await emitWithAck('send-room-message', { text: message })
      : await emitWithAck('send-direct-message', { to: active.person.socketId, text: message })
    if (!result?.ok) window.alert(result?.error || 'Message could not be sent')
  }
  useEffect(() => {
    const onRoomMessage = message => {
      if (active.type !== 'group') return
      setMessages(current => [...current, { ...message, mine: message.senderId === socketId, time: new Date(message.time).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) }])
    }
    const onDirectMessage = message => {
      const otherId = message.senderId === socketId ? message.to : message.senderId
      if (active.type !== 'direct' || active.person.socketId !== otherId) return
      setMessages(current => [...current, { ...message, mine: message.senderId === socketId, time: new Date(message.time).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) }])
    }
    const onTyping = status => {
      const key = `${status.type}:${status.socketId}`
      clearTimeout(incomingTypingTimers.current[key])
      setTypingUsers(current => status.isTyping ? { ...current, [key]: status.name } : Object.fromEntries(Object.entries(current).filter(([item]) => item !== key)))
      if (status.isTyping) incomingTypingTimers.current[key] = setTimeout(() => {
        setTypingUsers(current => Object.fromEntries(Object.entries(current).filter(([item]) => item !== key)))
      }, 1800)
    }
    socket.on('room-message', onRoomMessage)
    socket.on('direct-message', onDirectMessage)
    socket.on('room-members', setMembers)
    socket.on('typing-status', onTyping)
    return () => {
      socket.off('room-message', onRoomMessage)
      socket.off('direct-message', onDirectMessage)
      socket.off('room-members', setMembers)
      socket.off('typing-status', onTyping)
    }
  }, [active, socketId])
  useEffect(() => { setMessages([]) }, [active.name])
  const filtered = people.filter(p => p.name.toLowerCase().includes(query.toLowerCase()))
  const groupTypers = Object.entries(typingUsers).filter(([key]) => key.startsWith('group:')).map(([, name]) => name)
  const directTyping = active.type === 'direct' && typingUsers[`direct:${active.person?.socketId}`]
  const activeTypingText = active.type === 'group' ? (groupTypers.length ? `${groupTypers.slice(0, 2).join(' and ')} ${groupTypers.length > 1 ? 'are' : 'is'} typing...` : '') : (directTyping ? `${directTyping} is typing...` : '')
  const handleTextChange = event => {
    const value = event.target.value
    setText(value)
    socket.emit('typing', { type: active.type, to: active.person?.socketId, isTyping: Boolean(value.trim()) })
    clearTimeout(typingTimer.current)
    typingTimer.current = setTimeout(() => socket.emit('typing', { type: active.type, to: active.person?.socketId, isTyping: false }), 1200)
  }
  return <div className="chat-shell">
    {mobileMenu && <button className="drawer-overlay" aria-label="Close conversations" onClick={() => setMobileMenu(false)} />}
    <aside className={`sidebar ${mobileMenu ? 'mobile-open' : ''}`}>
      <div className="sidebar-head"><Brand/><button className="icon-button" onClick={onLeave} title="Leave circle"><Icon name="back"/></button></div>
      <div className="search"><Icon name="search" size={18}/><input placeholder="Search conversations" value={query} onChange={e => setQuery(e.target.value)}/></div>
      <p className="section-label">YOUR CIRCLE</p>
      <button className={`conversation ${active.type === 'group' ? 'active' : ''}`} onClick={() => { setActive({type:'group', name: room}); setMobileMenu(false) }}>
        <span className="group-avatar"><Icon name="users" size={21}/></span><span><b>{room}</b><small className={groupTypers.length ? 'typing-label' : ''}>{groupTypers.length ? `${groupTypers[0]} is typing...` : `${members.length} members · active now`}</small></span>
      </button>
      <div className="label-row"><p className="section-label">DIRECT MESSAGES</p><button><Icon name="plus" size={16}/></button></div>
      {filtered.map(p => <button className={`conversation ${active.name === p.name ? 'active' : ''}`} key={p.id} onClick={() => { setActive({type:'direct', name:p.name, person:p}); setMobileMenu(false) }}>
        <Avatar person={p} small/><span><b>{p.name}</b><small className={typingUsers[`direct:${p.socketId}`] ? 'typing-label' : ''}>{typingUsers[`direct:${p.socketId}`] ? 'typing...' : (p.status === 'online' ? 'Online' : 'Away')}</small></span>
      </button>)}
      <div className="my-profile"><Avatar person={{initials:initials(userName), color:'#6957d9', status:'online'}} small/><span><b>{userName}</b><small>Available</small></span><Icon name="more" size={18}/></div>
    </aside>
    <section className="chat-main">
      <header className="chat-header">
        <div><button className="mobile-menu-button" onClick={() => setMobileMenu(true)} aria-label="Open conversations"><Icon name="back" size={22}/></button>{active.type === 'group' ? <span className="group-avatar"><Icon name="users" size={21}/></span> : <Avatar person={active.person} small/>}<span><h3>{active.name}</h3><small>{active.type === 'group' ? `${members.length} member${members.length === 1 ? '' : 's'} online` : 'online'}</small></span></div>
        <div className="header-actions">{roomKey && active.type === 'group' && <button className="room-key" onClick={() => navigator.clipboard?.writeText(roomKey)}><Icon name="key" size={15}/>{roomKey}<Icon name="copy" size={14}/></button>}<button className="icon-button"><Icon name="search" size={19}/></button><button className="icon-button"><Icon name="more" size={19}/></button></div>
      </header>
      <div className="messages">
        <div className="day-divider"><span>Today</span></div>
        {messages.map((m, i) => <div className={`message-row ${m.mine ? 'mine' : ''}`} key={m.id}>
          {!m.mine && <Avatar person={{initials:m.initials, color:m.color}} small/>}
          <div><span className="message-meta">{!m.mine && <b>{m.sender}</b>}<time>{m.time}</time></span><div className="bubble">{m.text}</div>{m.mine && i === messages.length - 1 && <span className="read"><Icon name="check" size={13}/> Read</span>}</div>
        </div>)}
      </div>
      <div className="composer"><div className={`typing ${activeTypingText ? 'visible' : ''}`}><span className="typing-dots"><i/><i/><i/></span>{activeTypingText || '\u00a0'}</div><div className="compose-box"><button><Icon name="smile" size={21}/></button><button><Icon name="clip" size={21}/></button><input value={text} onChange={handleTextChange} onBlur={() => socket.emit('typing', { type: active.type, to: active.person?.socketId, isTyping: false })} onKeyDown={e => e.key === 'Enter' && send()} placeholder={`Message ${active.name}`}/><button className="send" onClick={send}><Icon name="send" size={19}/></button></div><small>Press Enter to send</small></div>
    </section>
  </div>
}

function App() {
  const [screen, setScreen] = useState('welcome')
  const [modal, setModal] = useState(null)
  const [room, setRoom] = useState({ name: 'The Commons', key: '', members: [] })
  const [socketId, setSocketId] = useState('')
  const [userName, setUserName] = useState('')
  const [pendingAction, setPendingAction] = useState(null)
  const ensureConnected = name => new Promise(resolve => {
    const register = async () => {
      const response = await emitWithAck('register-user', { name })
      if (response?.ok) setSocketId(response.socketId)
      resolve(response)
    }
    if (socket.connected) register()
    else { socket.connect(); socket.once('connect', register); socket.once('connect_error', () => resolve({ ok:false, error:'Cannot connect to chat server' })) }
  })
  const enterRoom = response => {
    if (!response?.ok) return window.alert(response?.error || 'Unable to enter this circle')
    setRoom({ name: response.room.name, key: response.room.key, members: response.room.members })
    setScreen('chat')
  }
  const act = async type => {
    if (!userName) { setPendingAction(type); return }
    const connected = await ensureConnected(userName)
    if (!connected?.ok) return window.alert(connected?.error)
    if (type === 'join-private') return setModal(type)
    if (type === 'create-private') {
      const response = await emitWithAck('create-private-room')
      if (!response?.ok) return window.alert(response?.error)
      setRoom({ name: response.room.name, key: response.room.key, members: response.room.members })
      return setModal(type)
    }
    enterRoom(await emitWithAck(type === 'join-random' ? 'join-random-room' : 'create-random-room'))
  }
  const enterPrivate = async key => {
    if (modal === 'create-private') { setModal(null); setScreen('chat'); return }
    const response = await emitWithAck('join-private-room', { key })
    if (!response?.ok) return window.alert(response?.error)
    setModal(null); enterRoom(response)
  }
  const leave = () => { socket.emit('leave-room'); setScreen('welcome') }
  const closeModal = () => { if (modal === 'create-private') socket.emit('leave-room'); setModal(null) }
  const acceptName = async name => {
    const action = pendingAction
    setUserName(name)
    setPendingAction(null)
    const connected = await ensureConnected(name)
    if (!connected?.ok) return window.alert(connected?.error)
    if (action === 'join-private') return setModal(action)
    if (action === 'create-private') {
      const response = await emitWithAck('create-private-room')
      if (!response?.ok) return window.alert(response?.error)
      setRoom({ name: response.room.name, key: response.room.key, members: response.room.members })
      return setModal(action)
    }
    enterRoom(await emitWithAck(action === 'join-random' ? 'join-random-room' : 'create-random-room'))
  }
  return <>{screen === 'welcome' ? <Welcome onAction={act} userName={userName}/> : <Chat room={room.name} roomKey={room.key} initialMembers={room.members} socketId={socketId} userName={userName} onLeave={leave}/>} {pendingAction && <NameModal onClose={() => setPendingAction(null)} onContinue={acceptName}/>} {modal && <RoomModal mode={modal} generatedKey={room.key} onClose={closeModal} onEnter={enterPrivate}/>}</>
}

createRoot(document.getElementById('root')).render(<App />)
