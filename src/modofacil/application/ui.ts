// A neutral dark palette local to Modo Fácil; global account colors remain outside.
// Explicit Tailwind properties also travel with dialogs and portaled form controls.
export const darkPaletteClasses = `
  dark:[--background:0_0%_0%] dark:[--body:0_0%_0%]
  dark:[--foreground:0_0%_95%] dark:[--card:0_0%_7%] dark:[--card-foreground:0_0%_95%]
  dark:[--popover:0_0%_9%] dark:[--popover-foreground:0_0%_95%]
  dark:[--sidebar:0_0%_4%] dark:[--sidebar-foreground:0_0%_83%]
  dark:[--primary:221.2_83.2%_53.3%] dark:[--primary-foreground:0_0%_100%]
  dark:[--secondary:0_0%_13%] dark:[--secondary-foreground:0_0%_95%]
  dark:[--muted:0_0%_12%] dark:[--muted-foreground:0_0%_65%]
  dark:[--accent:0_0%_16%] dark:[--accent-foreground:0_0%_95%]
  dark:[--border:0_0%_18%] dark:[--input:0_0%_22%] dark:[--ring:217.2_91.2%_59.8%]
  dark:[--destructive:0_72%_60%] dark:[--destructive-foreground:0_0%_100%]
`

// Shared Tailwind defaults for the dedicated experience and the settings embed.
// :where keeps defaults overridable by utilities on individual elements.
export const surfaceClasses = `
  ${darkPaletteClasses}
  bg-muted/50 font-sans text-sm leading-relaxed text-foreground [color-scheme:light] dark:[color-scheme:dark]
  [&_*]:box-border [&_*]:font-sans
  [&_:where(h1,h2,h3,p,dd,legend,summary)]:break-words
  [&_:where(label,form,section,article,fieldset)]:min-w-0
  [&_:where(button,.mf-button)]:max-w-full [&_:where(button,.mf-button)]:whitespace-normal [&_:where(button,.mf-button)]:text-center
  [&_:where(button,.mf-button)]:min-h-11 sm:[&_:where(button,.mf-button)]:min-h-10
  [&_:where(input,select,textarea)]:max-w-full
  [&_:where(input,select,textarea)]:text-base sm:[&_:where(input,select,textarea)]:text-sm
  [&_:where(.mf-actions>label)]:w-full sm:[&_:where(.mf-actions>label)]:w-auto sm:[&_:where(.mf-actions>label)]:flex-1
  [&_:where(.mf-actions>button,.mf-actions>.mf-button)]:w-full sm:[&_:where(.mf-actions>button,.mf-actions>.mf-button)]:w-auto
  [&_:where(.mf-page>header_a,.mf-page>a:not(.mf-button))]:inline-flex [&_:where(.mf-page>header_a,.mf-page>a:not(.mf-button))]:min-h-10 [&_:where(.mf-page>header_a,.mf-page>a:not(.mf-button))]:items-center
  [&_:where(.mf-page_details)]:min-w-0 [&_:where(.mf-page_details)]:rounded-[6px] [&_:where(.mf-page_details)]:border [&_:where(.mf-page_details)]:border-border [&_:where(.mf-page_details)]:p-3
  [&_:where(.mf-page_details>summary)]:text-sm [&_:where(.mf-page_details[open]>summary)]:mb-4
  [&_:where(a.mf-card)]:text-foreground [&_:where(a.mf-card):hover]:border-blue-300

  [&_:where(h1)]:mb-1 [&_:where(h1)]:text-2xl [&_:where(h1)]:font-bold [&_:where(h1)]:tracking-tight [&_:where(h1)]:text-foreground
  [&_:where(h2)]:mb-3 [&_:where(h2)]:text-base [&_:where(h2)]:font-semibold
  [&_:where(p)]:mb-2 [&_:where(p)]:text-sm
  [&_:where(a)]:text-blue-600 dark:[&_:where(a)]:text-blue-300 [&_:where(a)]:no-underline
  [&_:where(a):hover]:text-blue-700 dark:[&_:where(a):hover]:text-blue-200
  [&_:where(button,.mf-button)]:inline-flex
  [&_:where(button,.mf-button)]:items-center [&_:where(button,.mf-button)]:justify-center
  [&_:where(button,.mf-button)]:gap-2 [&_:where(button,.mf-button)]:rounded-[6px]
  [&_:where(button,.mf-button)]:border [&_:where(button,.mf-button)]:border-border
  [&_:where(button,.mf-button)]:bg-card [&_:where(button,.mf-button)]:px-4 [&_:where(button,.mf-button)]:py-2
  [&_:where(button,.mf-button)]:text-sm [&_:where(button,.mf-button)]:font-medium [&_:where(button,.mf-button)]:text-foreground/90
  [&_:where(button,.mf-button):hover]:bg-muted/50
  [&_:where(button):disabled]:cursor-not-allowed [&_:where(button):disabled]:opacity-50
  [&_:where(:focus-visible)]:outline-none [&_:where(:focus-visible)]:ring-2 [&_:where(:focus-visible)]:ring-blue-500 [&_:where(:focus-visible)]:ring-offset-2
  [&_:where(input:not([type=radio]):not([type=checkbox]),select,textarea)]:block
  [&_:where(input:not([type=radio]):not([type=checkbox]),select,textarea)]:w-full
  [&_:where(input:not([type=radio]):not([type=checkbox]),select,textarea)]:min-w-0
  [&_:where(input:not([type=radio]):not([type=checkbox]),select,textarea)]:min-h-10
  [&_:where(input:not([type=radio]):not([type=checkbox]),select,textarea)]:rounded-[6px]
  [&_:where(input:not([type=radio]):not([type=checkbox]),select,textarea)]:border
  [&_:where(input:not([type=radio]):not([type=checkbox]),select,textarea)]:border-border
  [&_:where(input:not([type=radio]):not([type=checkbox]),select,textarea)]:bg-card
  [&_:where(input:not([type=radio]):not([type=checkbox]),select,textarea)]:px-3
  [&_:where(input:not([type=radio]):not([type=checkbox]),select,textarea)]:py-2
  [&_:where(input:not([type=radio]):not([type=checkbox]),select,textarea)]:font-normal
  [&_:where(input:not([type=radio]):not([type=checkbox]),select,textarea)]:text-foreground
  [&_:where(input[type=radio],input[type=checkbox])]:accent-blue-600
  [&_:where(.mf-choice)]:!space-y-0 [&_:where(.mf-choice)]:!items-start
  [&_:where(.mf-choice_input)]:mt-1 [&_:where(.mf-choice_input)]:shrink-0
  [&_:where(textarea)]:min-h-24
  [&_:where(label)]:block [&_:where(label)]:space-y-1.5 [&_:where(label)]:text-xs [&_:where(label)]:font-medium
  [&_:where(small)]:block [&_:where(small)]:text-xs [&_:where(small)]:font-normal [&_:where(small)]:text-muted-foreground
  [&_:where(fieldset)]:m-0 [&_:where(fieldset)]:min-w-0 [&_:where(fieldset)]:border-0 [&_:where(fieldset)]:p-0
  [&_:where(legend)]:mb-4 [&_:where(legend)]:font-semibold
  [&_:where(dl)]:grid [&_:where(dl)]:grid-cols-1 [&_:where(dl)]:gap-2 sm:[&_:where(dl)]:grid-cols-[minmax(120px,1fr)_2fr]
  [&_:where(dt)]:text-muted-foreground [&_:where(dd)]:m-0 [&_:where(dd)]:break-words
  [&_:where(summary)]:cursor-pointer [&_:where(summary)]:font-medium
`
