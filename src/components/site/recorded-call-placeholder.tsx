import { Mic } from "lucide-react"

/*
 * TODO(later): placeholder for the recorded demo call.
 *
 * Ran wants visitors to HEAR the agent: a real recorded call, with an optional
 * transcript alongside it, never a transcript on its own. No audio exists yet
 * and none should be generated until he says so. When the recording is ready,
 * replace the body of this component with an <audio controls> player (file in
 * public/audio/) and keep or drop the transcript beside it.
 */
export function RecordedCallPlaceholder() {
  return (
    <div
      data-placeholder="recorded-call"
      className="flex w-full max-w-[330px] flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-ran-glass-border-light bg-ran-surface-light-raised px-6 py-14 text-center"
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-ran-text-on-light/[0.06] text-ran-text-on-light">
        <Mic className="h-5 w-5" aria-hidden />
      </span>
      <p className="text-lg font-bold text-ran-text-on-light">שיחה מוקלטת אמיתית</p>
      <p className="text-sm text-ran-text-on-light-muted">בקרוב: תוכלו לשמוע את הסוכן בשיחה אמיתית.</p>
    </div>
  )
}
