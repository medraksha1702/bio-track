'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import type { DateRange } from 'react-day-picker'
import { CalendarIcon, ChevronDown, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { cn } from '@/lib/utils'
import {
  DATE_PRESETS,
  getDateRange,
  getFilterLabel,
  type DateFilter,
  type DatePreset,
} from '@/lib/date-filters'

interface DateRangeFilterProps {
  value: DateFilter
  onChange: (filter: DateFilter) => void
  className?: string
  align?: 'start' | 'center' | 'end'
}

/** Convert a DateFilter into a calendar DateRange for preview/highlight. */
function filterToRange(filter: DateFilter): DateRange | undefined {
  const range = getDateRange(filter)
  if (!range?.startDate || !range?.endDate) return undefined
  return { from: new Date(range.startDate), to: new Date(range.endDate) }
}

export function DateRangeFilter({ value, onChange, className, align = 'start' }: DateRangeFilterProps) {
  const [open, setOpen] = useState(false)
  const [draftPreset, setDraftPreset] = useState<DatePreset>(value.preset)
  const [draftRange, setDraftRange] = useState<DateRange | undefined>(filterToRange(value))

  // Sync the draft to the committed value whenever the popover opens.
  useEffect(() => {
    if (open) {
      setDraftPreset(value.preset)
      setDraftRange(filterToRange(value))
    }
  }, [open, value])

  const handlePresetClick = (preset: DatePreset) => {
    setDraftPreset(preset)
    setDraftRange(filterToRange({ preset }))
  }

  const handleCalendarSelect = (range: DateRange | undefined) => {
    setDraftPreset('custom')
    setDraftRange(range)
  }

  const handleApply = () => {
    if (draftPreset === 'custom') {
      if (draftRange?.from && draftRange?.to) {
        onChange({
          preset: 'custom',
          startDate: format(draftRange.from, 'yyyy-MM-dd'),
          endDate: format(draftRange.to, 'yyyy-MM-dd'),
        })
      }
    } else {
      onChange({ preset: draftPreset })
    }
    setOpen(false)
  }

  const isCustomActive = value.preset === 'custom' && !!value.startDate && !!value.endDate
  const applyDisabled = draftPreset === 'custom' && !(draftRange?.from && draftRange?.to)

  return (
    <div className={cn('inline-flex', className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              'h-8 gap-2 border-border/60 text-xs font-medium',
              isCustomActive
                ? 'border-primary/40 bg-primary/8 text-primary hover:bg-primary/12'
                : 'text-foreground'
            )}
          >
            <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground" />
            <span>{getFilterLabel(value)}</span>
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto rounded-xl p-0 shadow-lg" align={align}>
          <div className="flex">
            {/* ── Presets (left) ───────────────────────────────── */}
            <div className="flex w-40 flex-col gap-0.5 border-r border-border/40 p-2">
              {DATE_PRESETS.map((preset) => {
                const active = draftPreset === preset.value
                return (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => handlePresetClick(preset.value)}
                    className={cn(
                      'flex items-center justify-between rounded-md px-3 py-2 text-left text-xs font-medium transition-colors',
                      active
                        ? 'bg-primary/10 text-primary'
                        : 'text-foreground hover:bg-muted/60'
                    )}
                  >
                    {preset.label}
                    {active && <Check className="h-3.5 w-3.5" />}
                  </button>
                )
              })}
              <div className="my-0.5 border-t border-border/40" />
              <div
                className={cn(
                  'rounded-md px-3 py-2 text-xs font-medium',
                  draftPreset === 'custom'
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground'
                )}
              >
                Custom range
              </div>
            </div>

            {/* ── Calendar (right) ─────────────────────────────── */}
            <div className="flex flex-col">
              <Calendar
                mode="range"
                numberOfMonths={2}
                selected={draftRange}
                onSelect={handleCalendarSelect}
                defaultMonth={draftRange?.from}
              />
              <div className="flex items-center justify-between border-t border-border/40 px-3 py-2.5">
                <p className="text-[11px] text-muted-foreground">
                  {draftPreset === 'all'
                    ? 'All time — no date limit'
                    : draftRange?.from && draftRange?.to
                    ? `${format(draftRange.from, 'MMM d, yyyy')} – ${format(draftRange.to, 'MMM d, yyyy')}`
                    : 'Select a range'}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 border-border/60 text-xs"
                    onClick={() => setOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    className="h-7 text-xs"
                    disabled={applyDisabled}
                    onClick={handleApply}
                  >
                    Apply
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
