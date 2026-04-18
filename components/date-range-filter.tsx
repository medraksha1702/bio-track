'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { CalendarIcon, X } from 'lucide-react'
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
  DEFAULT_FILTER,
  type DateFilter,
  type DatePreset,
} from '@/lib/date-filters'

interface DateRangeFilterProps {
  value: DateFilter
  onChange: (filter: DateFilter) => void
  className?: string
}

export function DateRangeFilter({ value, onChange, className }: DateRangeFilterProps) {
  const [customStart, setCustomStart] = useState<Date | undefined>(
    value.startDate ? new Date(value.startDate) : undefined
  )
  const [customEnd, setCustomEnd] = useState<Date | undefined>(
    value.endDate ? new Date(value.endDate) : undefined
  )
  const [popoverOpen, setPopoverOpen] = useState(false)

  const handlePresetClick = (preset: DatePreset) => {
    onChange({ preset })
  }

  const handleCustomApply = () => {
    if (!customStart || !customEnd) return
    onChange({
      preset: 'custom',
      startDate: format(customStart, 'yyyy-MM-dd'),
      endDate: format(customEnd, 'yyyy-MM-dd'),
    })
    setPopoverOpen(false)
  }

  const handleClear = () => {
    setCustomStart(undefined)
    setCustomEnd(undefined)
    onChange(DEFAULT_FILTER)
  }

  const isCustomActive = value.preset === 'custom' && !!value.startDate && !!value.endDate

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      {/* Preset pill buttons */}
      <div className="flex items-center gap-0.5 rounded-lg border border-border/40 bg-muted/20 p-0.5">
        {DATE_PRESETS.map((preset) => (
          <button
            key={preset.value}
            type="button"
            onClick={() => handlePresetClick(preset.value)}
            className={cn(
              'rounded-md px-3 py-1.5 text-xs font-medium transition-all duration-150 whitespace-nowrap',
              value.preset === preset.value
                ? 'bg-background text-foreground shadow-sm ring-1 ring-border/30'
                : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
            )}
          >
            {preset.label}
          </button>
        ))}
      </div>

      {/* Custom date range picker */}
      <div className="flex items-center gap-1">
        <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                'h-8 gap-1.5 border-border/60 text-xs font-medium',
                isCustomActive
                  ? 'border-primary/40 bg-primary/8 text-primary hover:bg-primary/12'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <CalendarIcon className="h-3.5 w-3.5" />
              {isCustomActive
                ? `${format(new Date(value.startDate!), 'MMM d')} – ${format(new Date(value.endDate!), 'MMM d, yyyy')}`
                : 'Custom Range'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto rounded-xl p-4 shadow-lg" align="start">
            <p className="mb-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Select custom range
            </p>
            <div className="flex gap-4">
              {/* From */}
              <div className="space-y-2">
                <p className="text-[11px] font-medium text-muted-foreground">From</p>
                <div className="rounded-lg border border-border/40 overflow-hidden">
                  <Calendar
                    mode="single"
                    selected={customStart}
                    onSelect={setCustomStart}
                    disabled={customEnd ? { after: customEnd } : undefined}
                    initialFocus
                  />
                </div>
              </div>
              {/* To */}
              <div className="space-y-2">
                <p className="text-[11px] font-medium text-muted-foreground">To</p>
                <div className="rounded-lg border border-border/40 overflow-hidden">
                  <Calendar
                    mode="single"
                    selected={customEnd}
                    onSelect={setCustomEnd}
                    disabled={customStart ? { before: customStart } : undefined}
                  />
                </div>
              </div>
            </div>
            {/* Actions */}
            <div className="mt-3 flex items-center justify-between border-t border-border/40 pt-3">
              <p className="text-[11px] text-muted-foreground">
                {customStart && customEnd
                  ? `${format(customStart, 'MMM d')} – ${format(customEnd, 'MMM d, yyyy')}`
                  : 'Select both dates'}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 border-border/60 text-xs"
                  onClick={() => {
                    setCustomStart(undefined)
                    setCustomEnd(undefined)
                    setPopoverOpen(false)
                    onChange(DEFAULT_FILTER)
                  }}
                >
                  Clear
                </Button>
                <Button
                  size="sm"
                  className="h-7 text-xs"
                  disabled={!customStart || !customEnd}
                  onClick={handleCustomApply}
                >
                  Apply
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Clear active custom filter */}
        {isCustomActive && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-full text-muted-foreground hover:text-foreground"
            onClick={handleClear}
            aria-label="Clear date filter"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </div>
  )
}
