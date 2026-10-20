/**
 * Downloads the CV shown on the page as a PDF, looking exactly like the preview: the CV element is copied,
 * with the page's styles, into a hidden frame, and the browser's print dialog saves it ("Save as PDF").
 */
export async function printCv(element: HTMLElement, title: string) {
  const frame = document.createElement("iframe")
  frame.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden"
  document.body.appendChild(frame)
  const doc = frame.contentDocument!
  const styles = [...document.querySelectorAll('link[rel="stylesheet"], style')].map((n) => n.outerHTML).join("")
  doc.open()
  doc.write(`<!doctype html><html class="${document.documentElement.className}"><head><meta charset="utf-8"><title></title>${styles}
<style>
  /* Longer CVs continue on more pages, which get a top margin; the first page has the CV's own padding */
  @page { size: A4; margin: 12mm 0 }
  @page :first { margin-top: 0 }
  html, body { margin: 0; background: #fff }
  .cv-page { box-shadow: none !important; margin: 0 !important; min-height: 285mm !important; padding-bottom: 0 !important }
</style></head><body></body></html>`)
  doc.close()
  // The suggested file name comes from the frame's title
  doc.title = title
  doc.body.appendChild(doc.importNode(element, true))

  // Wait for styles, fonts and images (photo, flag, logo) before printing
  await Promise.all(
    [...doc.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]')].map(
      (l) => new Promise((resolve) => (l.sheet ? resolve(null) : ((l.onload = l.onerror = () => resolve(null)))))
    )
  )
  await Promise.all(
    [...doc.images].map((img) => (img.complete ? null : new Promise((resolve) => (img.onload = img.onerror = () => resolve(null)))))
  )
  await doc.fonts?.ready

  const win = frame.contentWindow!
  win.focus()
  win.print()
  // print() returns once the dialog closes; remove the frame afterwards
  setTimeout(() => frame.remove(), 1000)
}
