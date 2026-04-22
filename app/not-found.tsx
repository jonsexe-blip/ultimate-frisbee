export const dynamic = 'force-dynamic'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center h-[100dvh] gap-2 text-center">
      <p className="text-4xl font-bold">404</p>
      <p className="text-muted-foreground">Page not found</p>
    </div>
  )
}
