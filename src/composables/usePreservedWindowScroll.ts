import { nextTick } from 'vue'

type ScrollSnapshot = {
  left: number
  top: number
}

function getWindowScroll(): ScrollSnapshot | null {
  if (typeof window === 'undefined') return null

  return {
    left: window.scrollX || window.pageXOffset || 0,
    top: window.scrollY || window.pageYOffset || 0,
  }
}

function restoreWindowScroll(snapshot: ScrollSnapshot) {
  window.scrollTo({
    left: snapshot.left,
    top: snapshot.top,
    behavior: 'auto',
  })
}

async function afterNextPaint() {
  await nextTick()

  if (typeof window === 'undefined' || typeof window.requestAnimationFrame !== 'function') {
    return
  }

  await new Promise<void>((resolve) => {
    window.requestAnimationFrame(() => resolve())
  })
}

export async function runWithPreservedWindowScroll<T>(action: () => T | Promise<T>): Promise<T> {
  const snapshot = getWindowScroll()

  try {
    return await action()
  } finally {
    if (snapshot && typeof window !== 'undefined') {
      await afterNextPaint()
      restoreWindowScroll(snapshot)
    }
  }
}
