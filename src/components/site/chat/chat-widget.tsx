"use client"

import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { ArrowUp, X } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react"

import { SUGGESTIONS, WELCOME, WHATSAPP_URL } from "@/lib/chat/knowledge"
import { CHAT_LIMITS } from "@/lib/chat/validate"
import { cn } from "@/lib/utils"
import { ChatCreature, type CreatureMood } from "./chat-creature"

interface Message {
  id: number
  role: "user" | "assistant"
  text: string
  /** The reply could not be produced: offer the human route instead. */
  failed?: boolean
}

const NOTICE_KEY = "napuch:notice-seen"
const TEASED_KEY = "napuch:chat-teased"
const NOTICE_DISMISSED = "napuch:notice-dismissed"

const ERRORS: Record<string, string> = {
  unavailable: "העוזר לא זמין כרגע. אפשר לדבר איתנו ישירות בוואטסאפ ונחזור אליכם.",
  rate: "שאלתם הרבה בזמן קצר. נסו שוב בעוד דקה, או כתבו לנו בוואטסאפ.",
  busy: "משהו השתבש אצלי. נסו שוב, או כתבו לנו בוואטסאפ.",
}

/**
 * The site's AI assistant: a creature in the corner that opens into a small
 * chat. It talks to /api/chat, which holds the key and the instructions; the
 * conversation lives only in this component's state, so nothing about it is
 * stored in the browser.
 */
export function ChatWidget({ available }: { available: boolean }) {
  const pathname = usePathname()
  const reduced = useReducedMotion()

  const [shown, setShown] = useState(false)
  const [open, setOpen] = useState(false)
  const [teaser, setTeaser] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [draft, setDraft] = useState("")
  const [busy, setBusy] = useState(false)
  const [streaming, setStreaming] = useState(false)

  const input = useRef<HTMLInputElement>(null)
  const launcher = useRef<HTMLButtonElement>(null)
  const scroller = useRef<HTMLDivElement>(null)
  const abort = useRef<AbortController | null>(null)
  const nextId = useRef(1)
  const noticeTimer = useRef<number | undefined>(undefined)

  // The launcher waits for the privacy notice to be dealt with: both live in the
  // bottom corner, and two things asking for attention at once helps neither.
  useEffect(() => {
    const returning = document.documentElement.dataset.curtain === "skip"
    const onPolicyPage = pathname === "/privacy"
    const reveal = () => {
      setShown(true)
      // Say hello once per visit, a while after it appears; never again if dismissed or opened.
      noticeTimer.current = window.setTimeout(() => {
        try {
          if (sessionStorage.getItem(TEASED_KEY) === "1") return
          sessionStorage.setItem(TEASED_KEY, "1")
        } catch {
          /* storage blocked: tease anyway */
        }
        setTeaser(true)
        noticeTimer.current = window.setTimeout(() => setTeaser(false), 7000)
      }, 6000)
    }

    const timer = window.setTimeout(
      () => {
        let seen = onPolicyPage
        try {
          seen = seen || localStorage.getItem(NOTICE_KEY) === "1"
        } catch {
          /* blocked: the notice shows every visit, so wait for it */
        }
        if (seen) return reveal()
        window.addEventListener(NOTICE_DISMISSED, reveal, { once: true })
      },
      returning ? 1500 : 3600,
    )
    return () => {
      window.clearTimeout(timer)
      window.clearTimeout(noticeTimer.current)
      window.removeEventListener(NOTICE_DISMISSED, reveal)
    }
  }, [pathname])

  useEffect(() => () => abort.current?.abort(), [])

  useEffect(() => {
    const el = scroller.current
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: reduced ? "auto" : "smooth" })
  }, [messages, open, reduced])

  const close = useCallback(() => {
    setOpen(false)
    launcher.current?.focus()
  }, [])

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, close])

  const toggle = () => {
    setTeaser(false)
    window.clearTimeout(noticeTimer.current)
    if (open) return close()
    setOpen(true)
    window.setTimeout(() => input.current?.focus(), 250)
  }

  const send = async (raw: string) => {
    const text = raw.trim().slice(0, CHAT_LIMITS.messageChars)
    if (!text || busy) return

    const userMessage: Message = { id: nextId.current++, role: "user", text }
    const replyId = nextId.current++
    const history = [...messages, userMessage]
    setMessages([...history, { id: replyId, role: "assistant", text: "" }])
    setDraft("")
    setBusy(true)

    const setReply = (patch: Partial<Message>) => setMessages((list) => list.map((m) => (m.id === replyId ? { ...m, ...patch } : m)))
    const controller = new AbortController()
    abort.current = controller

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history.filter((m) => !m.failed).map(({ role, text: t }) => ({ role, text: t })) }),
        signal: controller.signal,
      })

      if (!response.ok || !response.body) {
        const code = (await response.json().catch(() => ({}) as { error?: string })).error ?? "busy"
        return setReply({ text: ERRORS[code] ?? ERRORS.busy, failed: true })
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let answer = ""
      setStreaming(true)
      for (;;) {
        const { done, value } = await reader.read()
        if (done) break
        answer += decoder.decode(value, { stream: true })
        setReply({ text: answer })
      }
      if (!answer.trim()) setReply({ text: ERRORS.busy, failed: true })
    } catch (error) {
      if ((error as { name?: string }).name !== "AbortError") setReply({ text: ERRORS.busy, failed: true })
    } finally {
      setStreaming(false)
      setBusy(false)
    }
  }

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    void send(draft)
  }

  const mood: CreatureMood = busy ? (streaming ? "talking" : "thinking") : "idle"
  const waiting = busy && !streaming

  if (!available || !shown) return null

  return (
    <>
      <AnimatePresence>
        {open ? (
          <motion.section
            key="panel"
            role="dialog"
            aria-label="צ'אט עם העוזר של נפוץ'"
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 14, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, y: 10, scale: 0.97 }}
            transition={reduced ? { duration: 0.15 } : { type: "spring", stiffness: 340, damping: 30 }}
            style={{ transformOrigin: "bottom left" }}
            className="fixed inset-x-3 bottom-[68px] z-[70] flex h-[min(62dvh,430px)] flex-col overflow-hidden rounded-[22px] border border-ran-glass-border-light bg-ran-surface-light-raised shadow-[0_20px_40px_-20px_rgba(17,17,17,0.3)] sm:inset-x-auto sm:end-5 sm:w-[316px]"
          >
            <header className="flex items-center gap-2.5 px-3.5 py-3">
              <ChatCreature mood={mood} className="size-7" />
              <div className="min-w-0 flex-1">
                <p className="text-[13.5px] font-semibold leading-tight text-ran-text-on-light">העוזר של נפוץ&apos;</p>
                <p className="mt-px text-[11px] leading-tight text-ran-text-on-light-muted">{waiting ? "חושב…" : streaming ? "כותב…" : "AI · עונה בעברית"}</p>
              </div>
              <button type="button" onClick={close} aria-label="סגירת הצ'אט" className="grid size-7 shrink-0 place-items-center rounded-full text-ran-text-on-light-muted transition-colors hover:bg-black/[0.06] hover:text-ran-text-on-light">
                <X className="size-4" aria-hidden />
              </button>
            </header>

            {/* data-lenis-prevent: the page's smooth-scroll would otherwise swallow the wheel and scroll the site instead of this list. */}
            <div ref={scroller} data-lenis-prevent aria-live="polite" aria-busy={busy} className="flex-1 space-y-2 overflow-y-auto overscroll-contain border-t border-ran-glass-border-light px-3.5 py-3">
              <Bubble role="assistant" text={WELCOME} />

              {messages.length === 0 ? (
                <ul className="flex flex-wrap gap-1.5 pt-0.5">
                  {SUGGESTIONS.map((s, i) => (
                    <motion.li key={s} initial={reduced ? false : { opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 + i * 0.06 }}>
                      <button type="button" onClick={() => void send(s)} className="rounded-full border border-ran-glass-border-light px-3 py-1.5 text-xs font-medium text-ran-text-on-light transition-colors hover:bg-ran-surface-subtle">
                        {s}
                      </button>
                    </motion.li>
                  ))}
                </ul>
              ) : null}

              {messages.map((m) => (
                <Bubble key={m.id} role={m.role} text={m.text} typing={m.role === "assistant" && m.text === "" && busy} failed={m.failed} />
              ))}
            </div>

            <form onSubmit={onSubmit} className="border-t border-ran-glass-border-light px-3 pb-2 pt-2.5">
              <div className="flex items-center gap-1.5 rounded-full bg-ran-surface-subtle py-1 pe-1 ps-3.5 transition-colors focus-within:bg-black/[0.06]">
                <input
                  ref={input}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  maxLength={CHAT_LIMITS.messageChars}
                  placeholder="כתבו שאלה…"
                  aria-label="הודעה לעוזר"
                  autoComplete="off"
                  enterKeyHint="send"
                  className="min-w-0 flex-1 bg-transparent text-[13.5px] text-ran-text-on-light outline-none placeholder:text-ran-text-on-light-muted"
                />
                <button type="submit" disabled={busy || !draft.trim()} aria-label="שליחה" className="grid size-7 shrink-0 place-items-center rounded-full bg-ran-text-on-light text-white transition-opacity disabled:opacity-30">
                  <ArrowUp className="size-4" aria-hidden />
                </button>
              </div>
              <p className="mt-1.5 text-center text-[10.5px] leading-snug text-ran-text-on-light-muted">
                עוזר AI, עלול לטעות. מעובד ב-Gemini של Google, אל תכתבו פרטים אישיים.{" "}
                <Link href="/privacy" className="underline underline-offset-2">
                  פרטיות
                </Link>
                {" · "}
                <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
                  וואטסאפ
                </a>
              </p>
            </form>
          </motion.section>
        ) : null}
      </AnimatePresence>

      <div className="fixed bottom-4 end-4 z-[69] flex flex-col items-end gap-2 sm:end-5">
        <AnimatePresence>
          {teaser && !open ? (
            <motion.button
              key="teaser"
              type="button"
              onClick={toggle}
              initial={reduced ? { opacity: 0 } : { opacity: 0, y: 6, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 340, damping: 26 }}
              style={{ transformOrigin: "bottom left" }}
              className="max-w-[190px] rounded-2xl rounded-bl-md border border-ran-glass-border-light bg-ran-surface-light-raised px-3 py-2 text-start text-xs font-medium leading-snug text-ran-text-on-light shadow-[0_10px_24px_-14px_rgba(17,17,17,0.35)]"
            >
              יש שאלות על הסוכנים? אני כאן
            </motion.button>
          ) : null}
        </AnimatePresence>

        <motion.button
          ref={launcher}
          type="button"
          onClick={toggle}
          aria-label={open ? "סגירת הצ'אט" : "פתיחת צ'אט עם העוזר של נפוץ'"}
          aria-expanded={open}
          initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          whileHover={reduced ? undefined : { scale: 1.08 }}
          whileTap={reduced ? undefined : { scale: 0.94 }}
          className="rounded-full shadow-[0_8px_20px_-8px_rgba(17,17,17,0.55)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ran-text-on-light"
        >
          <ChatCreature mood={mood} className="size-11" />
        </motion.button>
      </div>
    </>
  )
}

function Bubble({ role, text, typing, failed }: { role: Message["role"]; text: string; typing?: boolean; failed?: boolean }) {
  const reduced = useReducedMotion()
  const mine = role === "user"
  return (
    <motion.div initial={reduced ? false : { opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 340, damping: 28 }} className={cn("flex", mine ? "justify-start" : "justify-end")}>
      <div
        className={cn(
          "max-w-[88%] whitespace-pre-wrap break-words rounded-2xl px-3 py-2 text-[13.5px] leading-relaxed",
          // In RTL the first (start) side is the right: the visitor sits there, the assistant opposite.
          mine ? "rounded-ss-sm bg-ran-text-on-light text-white" : "rounded-se-sm bg-ran-surface-subtle text-ran-text-on-light",
        )}
      >
        {typing ? (
          <span className="flex h-[20px] items-center gap-1" aria-label="העוזר כותב">
            {[0, 1, 2].map((i) => (
              <span key={i} className="chat-dot size-1.5 rounded-full bg-ran-text-on-light-muted" style={{ animationDelay: `${i * 0.16}s` }} />
            ))}
          </span>
        ) : (
          text
        )}
        {failed ? (
          <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="mt-2 block rounded-full bg-ran-text-on-light px-3 py-1.5 text-center text-xs font-semibold text-white">
            לכתוב לנו בוואטסאפ
          </a>
        ) : null}
      </div>
    </motion.div>
  )
}
