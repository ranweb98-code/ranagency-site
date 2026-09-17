"use client"

import { useRef, useState, type FormEvent } from "react"
import { AnimatePresence, motion } from "motion/react"
import { Check, Mail, MessageCircle, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { sendLeadEmail } from "@/app/actions"
import { Button } from "@/components/ui/button"
import { MagneticButton } from "@/components/ui/magnetic-button"

interface Question {
  question: string
  options: string[]
  multi?: boolean
}

const QUESTIONS: Question[] = [
  {
    question: "איזה סוכן הכי מעניין אותך?",
    options: ["סוכן וואטסאפ", "סוכן אינסטגרם", "סוכן קולי"],
    multi: true,
  },
  {
    question: "מה גודל העסק שלך?",
    options: ["עצמאי/ת", "עסק קטן (2-10 עובדים)", "עסק בינוני ומעלה"],
  },
  {
    question: "מתי תרצה/י להתחיל?",
    options: ["מיד", "בחודש הקרוב", "עדיין בודק/ת אפשרויות"],
  },
]

const STEP_TRANSITION = { duration: 0.3, ease: [0.16, 1, 0.3, 1] as const }
const STEP_MOTION = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
  transition: STEP_TRANSITION,
}

type Step = "start" | number | "contact" | "done"

export function ConsultationCard() {
  const cardRef = useRef<HTMLDivElement>(null)

  const [step, setStep] = useState<Step>("start")
  const [answers, setAnswers] = useState<string[]>([])
  const [selected, setSelected] = useState<string[]>([])
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [consent, setConsent] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(false)

  const questionIndex = typeof step === "number" ? step : 0

  const advance = (answer: string) => {
    const next = [...answers.slice(0, questionIndex), answer]
    setAnswers(next)
    setSelected([])
    if (questionIndex + 1 < QUESTIONS.length) {
      setStep(questionIndex + 1)
    } else {
      setStep("contact")
    }
  }

  const chooseAnswer = (option: string) => advance(option)

  const toggleOption = (option: string) => {
    setSelected((prev) => (prev.includes(option) ? prev.filter((o) => o !== option) : [...prev, option]))
  }

  const continueMulti = () => {
    if (selected.length === 0) return
    advance(selected.join(", "))
  }

  const goBack = () => {
    const targetIndex = step === "contact" ? QUESTIONS.length - 1 : typeof step === "number" ? step - 1 : -1
    if (targetIndex < 0) {
      setStep("start")
      setSelected([])
      return
    }
    const previousAnswer = answers[targetIndex]
    setSelected(QUESTIONS[targetIndex].multi && previousAnswer ? previousAnswer.split(", ") : [])
    setStep(targetIndex)
  }

  const reset = () => {
    setStep("start")
    setAnswers([])
    setSelected([])
    setName("")
    setPhone("")
    setConsent(false)
    setSubmitting(false)
    setSubmitError(false)
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!name.trim() || !phone.trim() || !consent || submitting) return
    setSubmitting(true)
    setSubmitError(false)
    const qa = QUESTIONS.map((q, i) => ({ question: q.question, answer: answers[i] ?? "" }))
    const result = await sendLeadEmail({ name, phone, answers: qa }).catch(() => ({ ok: false as const }))
    setSubmitting(false)
    if (result.ok) {
      setStep("done")
    } else {
      setSubmitError(true)
    }
  }

  return (
    <div
      ref={cardRef}
      id="contact"
      className="relative flex h-full min-h-[440px] flex-col items-center justify-center overflow-hidden rounded-[32px] border border-ran-glass-border-light px-8 py-16 text-center shadow-[0_16px_48px_-12px_rgba(17,17,17,0.25)] sm:px-12"
      style={{
        // A soft ink vignette rather than a flat white card — same "more
        // presence, not a flat wash" gradient treatment as the agent flow
        // diagrams, just in monochrome ink here since this card has no
        // channel accent of its own to draw on.
        background: "radial-gradient(130% 130% at 15% 85%, color-mix(in srgb, var(--text-strong) 12%, var(--surface-raised)) 0%, var(--surface-raised) 65%)",
      }}
    >
      {step !== "start" && step !== "done" && (
        <button
          type="button"
          onClick={reset}
          aria-label="סגור"
          className="absolute left-5 top-5 flex h-9 w-9 items-center justify-center rounded-full bg-ran-surface-light-raised text-ran-text-on-light transition-colors hover:bg-ran-surface-light-raised"
        >
          <X className="h-4 w-4" />
        </button>
      )}

      {/* relative z-10: without an explicit position, this content is a
          static-flow element, and CSS always paints positioned elements
          (like the blob wrapper above, `position: absolute`) above static
          ones regardless of DOM order — the blobs were rendering on top of
          this text, not behind it, which is what washed the text out. */}
      <div className="relative z-10 flex w-full flex-col items-center">
        <AnimatePresence mode="wait">
        {step === "start" && (
          <motion.div key="start" {...STEP_MOTION} className="flex flex-col items-center">
            <h2
              className="font-extrabold leading-[1.1] text-ran-text-on-light"
              style={{ fontSize: "var(--text-h2)", letterSpacing: "-0.02em" }}
            >
              מוכן להפוך את העסק שלך
              <br />
              <span className="bg-ran-text-on-light bg-clip-text text-transparent">
                לחכם יותר?
              </span>
            </h2>
            <p className="mt-4 max-w-md text-ran-text-on-light-muted" style={{ fontSize: "var(--text-body)" }}>
              קבע עכשיו ייעוץ חינם וללא התחייבות — ונגלה יחד איך אוטומציות AI יכולות לחסוך לך זמן,
              כסף ולהגדיל את ההכנסות
            </p>

            <MagneticButton>
              <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
                <Button
                  size="lg"
                  onClick={() => setStep(0)}
                  className="mt-8 rounded-full bg-ran-text-on-light px-8 text-white shadow-[0_12px_32px_-8px_rgba(17,17,17,0.5)] hover:opacity-90"
                >
                  קבע ייעוץ חינם עכשיו
                </Button>
              </motion.div>
            </MagneticButton>

            <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
              <Button
                variant="outline"
                className="gap-2 rounded-full border-ran-glass-border-light bg-ran-surface-light-raised text-ran-text-on-light hover:bg-ran-surface-light-raised"
                render={<a href="https://wa.me/972503610061" target="_blank" rel="noopener noreferrer" />}
                nativeButton={false}
              >
                <MessageCircle className="h-4 w-4" />
                וואטסאפ
              </Button>
              <Button
                variant="outline"
                className="gap-2 rounded-full border-ran-glass-border-light bg-ran-surface-light-raised text-ran-text-on-light hover:bg-ran-surface-light-raised"
                render={<a href="mailto:hello@ranagency.co.il" />}
                nativeButton={false}
              >
                <Mail className="h-4 w-4" />
                מייל
              </Button>
            </div>

            <p className="mt-6 text-sm text-ran-text-on-light-muted">זמינות: א׳–ה׳ 9:00–20:00</p>
          </motion.div>
        )}

        {typeof step === "number" && (
          <motion.div key={`q-${step}`} {...STEP_MOTION} className="flex w-full max-w-sm flex-col items-center">
            <p className="text-xs font-semibold tracking-wide text-ran-primary">
              שאלה {step + 1} מתוך {QUESTIONS.length}
            </p>
            <div className="mt-3 flex gap-1.5">
              {QUESTIONS.map((_, i) => (
                <span
                  key={i}
                  className={`h-1.5 w-6 rounded-full ${i <= step ? "bg-ran-primary" : "bg-ran-glass-border-light"}`}
                />
              ))}
            </div>
            <h3
              className="mt-5 font-bold text-ran-text-on-light"
              style={{ fontSize: "var(--text-h3)" }}
            >
              {QUESTIONS[step].question}
            </h3>
            <div className="mt-6 flex w-full flex-col gap-3">
              {QUESTIONS[step].options.map((option) => {
                const isMulti = QUESTIONS[step].multi
                const isSelected = isMulti && selected.includes(option)
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => (isMulti ? toggleOption(option) : chooseAnswer(option))}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-2xl border px-5 py-3 text-ran-text-on-light transition-all",
                      isSelected
                        ? "border-ran-primary bg-ran-primary/10 shadow-[0_4px_16px_-4px_rgba(17,17,17,0.3)]"
                        : "border-ran-glass-border-light bg-ran-surface-light-raised hover:border-ran-primary/40 hover:bg-ran-surface-light-raised hover:shadow-[0_4px_16px_-4px_rgba(17,17,17,0.3)]"
                    )}
                  >
                    {isMulti && (
                      <span
                        className={cn(
                          "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border",
                          isSelected
                            ? "border-ran-primary bg-ran-primary text-white"
                            : "border-ran-glass-border-light bg-ran-surface-light-raised"
                        )}
                      >
                        {isSelected && <Check className="h-3.5 w-3.5" />}
                      </span>
                    )}
                    {option}
                  </button>
                )
              })}
            </div>
            {QUESTIONS[step].multi && (
              <Button
                type="button"
                onClick={continueMulti}
                disabled={selected.length === 0}
                className="mt-5 w-full rounded-full bg-ran-text-on-light px-8 text-white shadow-[0_12px_32px_-8px_rgba(17,17,17,0.5)] hover:opacity-90 disabled:opacity-40"
              >
                המשך
              </Button>
            )}
            {step > 0 && (
              <button
                type="button"
                onClick={goBack}
                className="mt-5 text-sm text-ran-text-on-light-muted underline-offset-4 hover:text-ran-text-on-light hover:underline"
              >
                חזרה לשאלה הקודמת
              </button>
            )}
          </motion.div>
        )}

        {step === "contact" && (
          <motion.form
            key="contact"
            {...STEP_MOTION}
            onSubmit={handleSubmit}
            className="flex w-full max-w-sm flex-col items-center"
          >
            <h3 className="font-bold text-ran-text-on-light" style={{ fontSize: "var(--text-h3)" }}>
              עוד רגע! איך נחזור אליך?
            </h3>
            <p className="mt-2 text-sm text-ran-text-on-light-muted">
              נשלח את הפרטים ישירות אלינו במייל ונחזור אליך תוך יום עסקים
            </p>
            <div className="mt-6 flex w-full flex-col gap-3">
              {/* A placeholder alone isn't an accessible name — it vanishes
                  the moment there's a value, and several screen readers
                  don't announce it as a label at all. aria-label keeps the
                  same centered, chrome-free visual design while giving the
                  field a real name. */}
              <input
                type="text"
                required
                aria-label="שם מלא"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="שם מלא"
                className="w-full rounded-full border border-ran-glass-border-light bg-ran-surface-light-raised px-5 py-3 text-center text-ran-text-on-light placeholder:text-ran-text-on-light-muted focus:border-ran-primary focus:outline-none focus:ring-2 focus:ring-ran-primary/30"
              />
              <input
                type="tel"
                required
                aria-label="מספר טלפון"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="מספר טלפון"
                className="w-full rounded-full border border-ran-glass-border-light bg-ran-surface-light-raised px-5 py-3 text-center text-ran-text-on-light placeholder:text-ran-text-on-light-muted focus:border-ran-primary focus:outline-none focus:ring-2 focus:ring-ran-primary/30"
              />
            </div>

            <label className="mt-4 flex w-full items-start gap-2.5 text-right text-sm text-ran-text-on-light-muted">
              <input
                type="checkbox"
                required
                checked={consent}
                onChange={(event) => setConsent(event.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 rounded border-ran-glass-border-light text-ran-text-on-light focus:ring-ran-primary/30"
              />
              <span>
                קראתי ואני מסכימ/ה ל
                <a href="/privacy" target="_blank" rel="noopener noreferrer" className="font-semibold underline underline-offset-2">
                  מדיניות הפרטיות
                </a>
                , ומאשר/ת שהפרטים ישמשו ליצירת קשר בנוגע לייעוץ המבוקש
              </span>
            </label>

            {submitError && (
              <div className="mt-4 w-full rounded-2xl border border-ran-glass-border-light bg-ran-surface-subtle px-4 py-3 text-sm text-ran-text-on-light">
                <p>לא הצלחנו לשלוח את הפרטים כרגע. אפשר לנסות שוב, או לפנות ישירות בוואטסאפ.</p>
                <a
                  href={`https://wa.me/972503610061?text=${encodeURIComponent(
                    `היי, אני ${name} ומעוניין/ת בייעוץ חינם. טלפון ליצירת קשר: ${phone}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1.5 font-semibold underline underline-offset-2"
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                  פתח וואטסאפ
                </a>
              </div>
            )}

            <Button
              type="submit"
              size="lg"
              disabled={submitting || !consent}
              className="mt-6 w-full rounded-full bg-ran-text-on-light px-8 text-white shadow-[0_12px_32px_-8px_rgba(17,17,17,0.5)] hover:opacity-90 disabled:opacity-60"
            >
              {submitting ? "שולח..." : "שלח לי הצעה"}
            </Button>
            <button
              type="button"
              onClick={goBack}
              className="mt-4 text-sm text-ran-text-on-light-muted underline-offset-4 hover:text-ran-text-on-light hover:underline"
            >
              חזרה לשאלה הקודמת
            </button>
          </motion.form>
        )}

        {step === "done" && (
          <motion.div key="done" {...STEP_MOTION} className="flex flex-col items-center">
            <h3 className="font-bold text-ran-text-on-light" style={{ fontSize: "var(--text-h3)" }}>
              תודה, {name || "חבר/ה"}! 🎉
            </h3>
            <p className="mt-3 max-w-xs text-ran-text-on-light-muted">
              הפרטים שלך נשלחו אלינו בהצלחה! ניצור איתך קשר תוך יום עסקים.
            </p>
            <Button
              variant="outline"
              onClick={reset}
              className="mt-6 rounded-full border-ran-glass-border-light bg-ran-surface-light-raised text-ran-text-on-light hover:bg-ran-surface-light-raised"
            >
              סגור
            </Button>
          </motion.div>
        )}
        </AnimatePresence>
      </div>
    </div>
  )
}
