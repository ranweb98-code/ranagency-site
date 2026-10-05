// One look for every single-line control (text inputs and the Select trigger):
// a full pill, the same height, the same focus. Anything that lets the browser
// draw its own control breaks the system, so forms use these instead.
export const fieldClass =
  "w-full rounded-full border border-black/10 bg-white/80 px-5 py-3 text-[15px] outline-none transition-colors placeholder:text-crm-muted focus:border-crm-ink/40 focus:bg-white focus-visible:ring-2 focus-visible:ring-crm-ink/15"

export const primaryButtonClass =
  "flex items-center justify-center gap-2 rounded-full bg-crm-ink px-6 py-3.5 text-[15px] font-medium text-white transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-crm-ink disabled:opacity-60"

/** Multi-line text: a pill cannot hold several lines, so it takes the same
 *  soft corners as the cards instead. */
export const areaClass = `${fieldClass.replace("rounded-full", "rounded-[26px]")} min-h-24 resize-y leading-relaxed`
