import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { getRequestMessages, sendRequestMessage, ApiError } from '../lib/api'

function TechnicianMessagesPage({ theme, onToggleTheme }) {
  const { requestId } = useParams()
  const myUserId = useSelector((state) => state.auth.user?.user?.user_id || state.auth.user?.user_id)

  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef(null)
  const pollRef = useRef(null)

  const loadMessages = useCallback(async () => {
    try {
      const res = await getRequestMessages(requestId, 1, 100)
      setMessages(res?.messages ?? [])
    } catch (err) {
      if (loading) setError(err instanceof ApiError ? err.message : 'Failed to load messages')
    } finally {
      setLoading(false)
    }
  }, [requestId, loading])

  useEffect(() => {
    loadMessages()
    pollRef.current = setInterval(loadMessages, 8000)
    return () => clearInterval(pollRef.current)
  }, [loadMessages])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Detect receiver: find the first message sender/receiver who is NOT me
  const receiverId = messages.length > 0
    ? (messages.find((m) => m.sender_id !== myUserId)?.sender_id || messages.find((m) => m.receiver_id !== myUserId)?.receiver_id || '')
    : ''

  const handleSend = async () => {
    if (!newMessage.trim() || !receiverId) return
    setSending(true)
    try {
      await sendRequestMessage(requestId, receiverId, newMessage.trim())
      setNewMessage('')
      await loadMessages()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to send message')
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-4 py-6 sm:px-6 lg:px-8">
        <header className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Link to="/jobs" className="text-sm text-emerald-600 hover:text-emerald-500 dark:text-emerald-300">← Jobs</Link>
              <h1 className="text-lg font-semibold">Chat</h1>
              <span className="text-xs text-slate-400">Request: {requestId?.slice(0, 8)}...</span>
            </div>
            <button type="button" onClick={onToggleTheme} className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800">
              {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
            </button>
          </div>
        </header>

        {error && <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-300">{error}</div>}

        {/* Messages area */}
        <div className="mt-4 flex-1 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900" style={{ maxHeight: 'calc(100vh - 280px)' }}>
          {loading ? (
            <div className="text-center text-sm text-slate-500">Loading messages...</div>
          ) : messages.length === 0 ? (
            <div className="text-center text-sm text-slate-500">No messages yet. Start the conversation!</div>
          ) : (
            <div className="space-y-3">
              {[...messages].reverse().map((msg) => {
                const isMe = msg.sender_id === myUserId
                return (
                  <div key={msg.message_id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${isMe ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100'}`}>
                      <p className="text-sm">{msg.message}</p>
                      <div className={`mt-1 flex items-center gap-2 text-xs ${isMe ? 'text-emerald-200' : 'text-slate-400'}`}>
                        <span>{msg.sender?.full_name || (isMe ? 'You' : 'Customer')}</span>
                        <span>·</span>
                        <span>{new Date(msg.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Send box */}
        <div className="mt-3 flex gap-2">
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={receiverId ? 'Type a message...' : 'Send a message first from customer side to start chat'}
            disabled={!receiverId && messages.length === 0}
            rows={1}
            className="flex-1 resize-none rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-800"
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={sending || !newMessage.trim() || !receiverId}
            className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-60"
          >
            {sending ? '...' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default TechnicianMessagesPage
