import { useAnnouncement } from '@/lib/announce'

/** Duas regiões (polite/assertive) para que anúncios urgentes não esperem a fila. */
export function LiveRegion() {
  const message = useAnnouncement()
  return (
    <>
      <div className="sr-only" aria-live="polite" aria-atomic="true" data-testid="live-region">
        {message.politeness === 'polite' ? <span key={message.id}>{message.text}</span> : null}
      </div>
      <div className="sr-only" aria-live="assertive" aria-atomic="true">
        {message.politeness === 'assertive' ? <span key={message.id}>{message.text}</span> : null}
      </div>
    </>
  )
}
