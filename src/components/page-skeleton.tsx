/** Grey placeholder shapes in the page's layout, shown while a page or the app's data loads. */
export function PageSkeleton() {
  return (
    <div className="w-full animate-pulse space-y-6" aria-busy="true">
      <div className="space-y-2">
        <div className="h-7 w-48 rounded-md bg-muted" />
        <div className="h-4 w-72 max-w-full rounded-md bg-muted" />
      </div>
      <div className="h-10 rounded-xl bg-muted" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-44 rounded-xl bg-muted" />
        ))}
      </div>
    </div>
  )
}
