import '../assets/interface.css'

// The same local theme travels with dialogs and portaled form controls.
export const darkPaletteClasses = 'mf-theme'

// Shared Tailwind defaults for the dedicated experience and the settings embed.
// :where keeps defaults overridable by utilities on individual elements.
// Labels may start with plain text or a required marker. Space controls directly
// instead of using space-y, which only measures element siblings.
export const surfaceClasses = `
  ${darkPaletteClasses}
  mf-surface bg-background text-sm leading-relaxed text-foreground [color-scheme:light] dark:[color-scheme:dark]
  [&_*]:box-border
  [&_:where(h1,h2,h3,p,dd,legend,summary)]:break-words
  [&_:where(label,form,section,article,fieldset)]:min-w-0
  [&_:where(button:not([role=switch]):not([role=combobox]),.mf-button,.mf-actions>a)]:max-w-full [&_:where(button:not([role=switch]):not([role=combobox]),.mf-button,.mf-actions>a)]:whitespace-normal [&_:where(button:not([role=switch]):not([role=combobox]),.mf-button,.mf-actions>a)]:text-center
  [&_:where(button:not([role=switch]):not([role=combobox]),.mf-button,.mf-actions>a)]:min-h-11 sm:[&_:where(button:not([role=switch]):not([role=combobox]),.mf-button,.mf-actions>a)]:min-h-10
  [&_:where(input,select,textarea)]:max-w-full
  [&_:where(input,select,textarea)]:text-base sm:[&_:where(input,select,textarea)]:text-sm
  [&_:where(.mf-actions>label)]:w-full sm:[&_:where(.mf-actions>label)]:w-auto sm:[&_:where(.mf-actions>label)]:flex-1
  [&_:where(.mf-actions>button,.mf-actions>a)]:w-full sm:[&_:where(.mf-actions>button,.mf-actions>a)]:w-auto
  [&_:where(.mf-page>header_a,.mf-page>a:not(.mf-button))]:inline-flex [&_:where(.mf-page>header_a,.mf-page>a:not(.mf-button))]:min-h-10 [&_:where(.mf-page>header_a,.mf-page>a:not(.mf-button))]:items-center
  [&_:where(.mf-page_details)]:min-w-0 [&_:where(.mf-page_details)]:rounded-[6px] [&_:where(.mf-page_details)]:border [&_:where(.mf-page_details)]:border-border [&_:where(.mf-page_details)]:p-3
  [&_:where(.mf-page_details>summary)]:text-sm [&_:where(.mf-page_details[open]>summary)]:mb-4
  [&_:where(a.mf-card)]:text-foreground [&_:where(a.mf-card):hover]:border-blue-300

  [&_:where(h1)]:mb-1 [&_:where(h1)]:text-2xl [&_:where(h1)]:font-semibold [&_:where(h1)]:tracking-tight [&_:where(h1)]:text-foreground
  [&_:where(h2)]:mb-3 [&_:where(h2)]:text-base [&_:where(h2)]:font-semibold
  [&_:where(p)]:mb-2 [&_:where(p)]:text-sm
  [&_:where(a:not(.mf-button,.mf-actions>a,.mf-card))]:text-blue-600 dark:[&_:where(a:not(.mf-button,.mf-actions>a,.mf-card))]:text-blue-300 [&_:where(a:not(.mf-button,.mf-actions>a,.mf-card))]:no-underline
  [&_:where(a:not(.mf-button,.mf-actions>a,.mf-card)):hover]:text-blue-700 dark:[&_:where(a:not(.mf-button,.mf-actions>a,.mf-card)):hover]:text-blue-200
  [&_:where(button:not([role=switch]):not([role=combobox]),.mf-button,.mf-actions>a)]:inline-flex
  [&_:where(button:not([role=switch]):not([role=combobox]),.mf-button,.mf-actions>a)]:items-center [&_:where(button:not([role=switch]):not([role=combobox]),.mf-button,.mf-actions>a)]:justify-center
  [&_:where(button:not([role=switch]):not([role=combobox]),.mf-button,.mf-actions>a)]:gap-2 [&_:where(button:not([role=switch]):not([role=combobox]),.mf-button,.mf-actions>a)]:rounded-[6px]
  [&_:where(button:not([role=switch]):not([role=combobox]),.mf-button,.mf-actions>a)]:border [&_:where(button:not([role=switch]):not([role=combobox]),.mf-button,.mf-actions>a)]:border-border
  [&_:where(button:not([role=switch]):not([role=combobox]),.mf-button,.mf-actions>a)]:bg-card [&_:where(button:not([role=switch]):not([role=combobox]),.mf-button,.mf-actions>a)]:px-4 [&_:where(button:not([role=switch]):not([role=combobox]),.mf-button,.mf-actions>a)]:py-2
  [&_:where(button:not([role=switch]):not([role=combobox]),.mf-button,.mf-actions>a)]:text-sm [&_:where(button:not([role=switch]):not([role=combobox]),.mf-button,.mf-actions>a)]:font-medium [&_:where(button:not([role=switch]):not([role=combobox]),.mf-button,.mf-actions>a)]:text-foreground/90
  [&_:where(button:not([role=switch]):not([role=combobox]),.mf-button,.mf-actions>a):hover]:bg-muted/50
  [&_:where(button):disabled]:cursor-not-allowed [&_:where(button):disabled]:opacity-50
  [&_:where(:focus-visible)]:outline-none [&_:where(:focus-visible)]:ring-2 [&_:where(:focus-visible)]:ring-blue-500 [&_:where(:focus-visible)]:ring-offset-2
  [&_:where(input[type=radio],input[type=checkbox])]:accent-blue-600
  [&_:where(.mf-choice)]:!space-y-0 [&_:where(.mf-choice)]:!items-start
  [&_:where(.mf-choice_[role=switch])]:shrink-0

  [&_:where(label)]:block [&_:where(label)]:text-sm [&_:where(label)]:font-medium
  [&_:where(label)>:where(input:not([type=radio]):not([type=checkbox]),textarea,select,[role=combobox],div)]:mt-2
  [&_:where(label)>small]:mt-1.5
  [&_:where(small)]:block [&_:where(small)]:text-xs [&_:where(small)]:font-normal [&_:where(small)]:text-muted-foreground
  [&_:where(fieldset)]:m-0 [&_:where(fieldset)]:min-w-0 [&_:where(fieldset)]:border-0 [&_:where(fieldset)]:p-0
  [&_:where(legend)]:mb-4 [&_:where(legend)]:font-semibold
  [&_:where(dl)]:grid [&_:where(dl)]:grid-cols-1 [&_:where(dl)]:gap-2 sm:[&_:where(dl)]:grid-cols-[minmax(120px,1fr)_2fr]
  [&_:where(dt)]:text-muted-foreground [&_:where(dd)]:m-0 [&_:where(dd)]:break-words
  [&_:where(summary)]:cursor-pointer [&_:where(summary)]:font-medium
`
