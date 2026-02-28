import { useEffect, useState, useRef } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate, useParams } from 'react-router-dom'
import { getRequestMessages, sendRequestMessage, userLogout } from '../lib/api'
import { clearAuth } from '../store/authSlice'

function UserMessagesPage({ theme, onToggleTheme }) {
  const { requestId } = useParams()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const userId = useSelector((s) => s.auth.user?.user_id)

  const [messages, setMessages] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Send form
  const [receiverId, setReceiverId] = useState('')
  const [messageText, setMessageText] = useState('')
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState('')

  const bottomRef = useRef(null)

  const fetchMessages = async (silent = false) => {
    try {
      const data = await getRequestMessages(requestId, { page: 1, limit: 200 })
      setMessages(data.messages || [])
      setTotal(data.total || 0)
      setError('')
      // Auto-detect receiver (first technician in the conversation)
      if (!receiverId) {
        const techMsg = (data.messages || []).find((m) => m.sender?.role === 'technician')
        if (techMsg) setReceiverId(techMsg.sender.user_id)
      }
    } catch (err) {
      setError(err.message || 'Failed to load messages')
    } finally {
      if (!silent) setLoading(false)
    }
  }

  useEffect(() => {
    fetchMessages(false)
    const interval = setInterval(() => fetchMessages(true), 10000)
    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleLogout = async () => {
    await userLogout().catch(() => null)
    dispatch(clearAuth())
    navigate('/auth/user/signin')
  }

  const handleSend = async (e) => {
    e.preventDefault()
    if (!messageText.trim()) return
    if (!receiverId.trim()) {
      setSendError('Enter the technician\'s User ID (shown in the chat when they send a message)')
      return
    }
    setSending(true)
    setSendError('')
    try {
      await sendRequestMessage(requestId, { receiver_id: receiverId, message: messageText.trim() })
      setMessageText('')
      await fetchMessages(true)
    } catch (err) {
      setSendError(err.message || 'Failed to send message')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-xl font-semibold">Messages</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">Request {requestId.slice(0, 8)}…</p>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={onToggleTheme} className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</button>
              <button type="button" onClick={() => navigate(`/requests/${requestId}`)} className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800">Back to Request</button>
              <button type="button" onClick={() => navigate('/dashboard')} className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800">Dashboard</button>
              <button type="button" onClick={handleLogout} className="rounded-xl bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-500">Logout</button>
            </div>
          </div>
        </header>

        {/* Chat Area */}
        <section className="mt-5 flex flex-col rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900" style={{ height: 'calc(100vh - 260px)', minHeight: '400px' }}>
          {/* Messages list */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {loading && messages.length === 0 && <p className="text-sm text-slate-500">Loading messages…</p>}
            {error && <p className="text-sm text-red-600">{error}</p>}

            {!loading && messages.length === 0 && !error && (
              <p className="text-sm text-slate-500 text-center py-8">No messages yet. Start the conversation with the technician.</p>
            )}

            {messages.map((m) => {
              const isMine = m.sender_id === userId || m.sender?.user_id === userId
              return (
                <div key={m.message_id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] rounded-2xl px-4 py-2 ${isMine ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100'}`}>
                    <p className={`text-xs font-semibold ${isMine ? 'text-emerald-100' : 'text-slate-500 dark:text-slate-400'}`}>
                      {m.sender?.full_name || (isMine ? 'You' : 'Technician')}
                      {!isMine && m.sender?.role && <span className="ml-1 text-[10px] opacity-70">({m.sender.role})</span>}
                    </p>
                    <p className="mt-0.5 text-sm whitespace-pre-wrap">{m.message}</p>
                    <p className={`mt-1 text-right text-[10px] ${isMine ? 'text-emerald-200' : 'text-slate-400 dark:text-slate-500'}`}>
                      {new Date(m.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      {m.is_read && isMine && ' ✓'}
                    </p>
                  </div>
                </div>
              )
            })}
            <div ref={bottomRef} />
          </div>

          {/* Send form */}
          <div className="border-t border-slate-200 p-4 dark:border-slate-700">
            {sendError && <p className="mb-2 text-xs text-red-600">{sendError}</p>}
            {!receiverId && messages.length === 0 && (
              <div className="mb-2">
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">Technician User ID</label>
                <input type="text" value={receiverId} onChange={(e) => setReceiverId(e.target.value)} placeholder="Paste technician user_id…" className="mt-1 w-full rounded-xl border border-slate-300 bg-transparent px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none dark:border-slate-700" />
              </div>
            )}
            <form onSubmit={handleSend} className="flex gap-2">
              <input type="text" value={messageText} onChange={(e) => setMessageText(e.target.value)} maxLength={5000} placeholder="Type a message…" className="flex-1 rounded-xl border border-slate-300 bg-transparent px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none dark:border-slate-700" />
              <button type="submit" disabled={sending || !messageText.trim()} className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50">{sending ? 'Sending…' : 'Send'}</button>
            </form>
            <p className="mt-1 text-[10px] text-slate-400">{total} messages in this conversation</p>
          </div>
        </section>
      </div>
    </div>
  )
}

export default UserMessagesPage
