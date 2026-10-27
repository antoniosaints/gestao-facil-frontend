// A live region remains exposed when dialogs hide the rest of the page from
// assistive technology. Each toast supplies its own success/error role.
export function createToastContainer() {
  const container = document.createElement('div')
  container.setAttribute('aria-live', 'polite')
  container.setAttribute('aria-atomic', 'false')
  document.body.appendChild(container)
  return container
}
