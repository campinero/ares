import { useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { Button } from '@/components/ui'

/**
 * Labelled clipboard control. `CopyButton` covers single values in a field row;
 * this one covers the larger payloads - a byte selection, a filtered string
 * list, a whole metadata sheet.
 */
export function CopyTextButton({
  text,
  label,
  tone = 'default',
  disabled = false,
}: {
  text: string
  label: string
  tone?: 'default' | 'primary' | 'danger'
  disabled?: boolean
}) {
  const [done, setDone] = useState(false)

  function copy() {
    if (!text) return
    void navigator.clipboard
      ?.writeText(text)
      .then(() => {
        setDone(true)
        window.setTimeout(() => setDone(false), 1200)
      })
      .catch(() => setDone(false))
  }

  return (
    <Button tone={tone} disabled={disabled || text.length === 0} onClick={copy}>
      {done ? <Check /> : <Copy />}
      {done ? 'Copied' : label}
    </Button>
  )
}
