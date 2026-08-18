'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useTransition } from 'react'
import { Icon } from '@iconify/react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DEFAULT_PERIOD, PERIODS } from '@/lib/vitrina/periods'

/** El período vive en la URL (?period=), así que la vista es compartible y recargable. */
const PeriodFilter = () => {
  const router = useRouter()
  const params = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const current = params.get('period') ?? DEFAULT_PERIOD

  const onChange = (value: string) => {
    startTransition(() => router.push(`/?period=${value}`))
  }

  return (
    <div className='flex items-center gap-2'>
      {isPending && (
        <Icon
          icon='solar:refresh-linear'
          className='animate-spin text-muted-foreground'
        />
      )}
      <Select value={current} onValueChange={onChange}>
        <SelectTrigger className='w-[180px]'>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {PERIODS.map((p) => (
            <SelectItem key={p.value} value={p.value}>
              {p.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

export default PeriodFilter
