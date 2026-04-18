'use client'

import { useState, useRef } from 'react'
import { Check, ChevronsUpDown, Plus, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { useGetCustomersQuery, useAddCustomerMutation } from '@/lib/services/api'

interface CustomerComboboxProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  triggerClassName?: string
}

export function CustomerCombobox({
  value,
  onChange,
  placeholder = 'Select or create customer…',
  triggerClassName,
}: CustomerComboboxProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [creating, setCreating] = useState(false)

  const { data: customers = [], isLoading } = useGetCustomersQuery()
  const [addCustomer] = useAddCustomerMutation()

  const filtered = customers.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()),
  )

  const exactMatch = customers.some(
    (c) => c.name.toLowerCase() === search.toLowerCase(),
  )

  const handleSelect = (name: string) => {
    onChange(name === value ? '' : name)
    setOpen(false)
    setSearch('')
  }

  const handleCreate = async () => {
    const name = search.trim()
    if (!name) return
    setCreating(true)
    try {
      const result = await addCustomer({ name }).unwrap()
      onChange(result.name)
      setOpen(false)
      setSearch('')
    } catch {
      // duplicate or error — still accept the typed value
      onChange(name)
      setOpen(false)
      setSearch('')
    } finally {
      setCreating(false)
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            'h-9 w-full justify-between border-border/60 bg-muted/30 px-3 text-sm font-normal',
            !value && 'text-muted-foreground',
            triggerClassName,
          )}
        >
          <span className="truncate">{value || placeholder}</span>
          {isLoading ? (
            <Loader2 className="ml-2 h-3.5 w-3.5 shrink-0 animate-spin text-muted-foreground" />
          ) : (
            <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
          <CommandInput
            placeholder="Search customers…"
            value={search}
            onValueChange={setSearch}
            className="h-9 text-sm"
          />
          <CommandList>
            {/* Create new option — shown when search has text and no exact match */}
            {search.trim() && !exactMatch && (
              <CommandGroup>
                <CommandItem
                  value={`__create__${search}`}
                  onSelect={handleCreate}
                  disabled={creating}
                  className="gap-2 text-primary"
                >
                  {creating ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Plus className="h-3.5 w-3.5" />
                  )}
                  <span>
                    Create <strong>&quot;{search.trim()}&quot;</strong>
                  </span>
                </CommandItem>
              </CommandGroup>
            )}

            {filtered.length > 0 && (
              <CommandGroup heading={search ? 'Matching customers' : 'All customers'}>
                {filtered.map((customer) => (
                  <CommandItem
                    key={customer.id}
                    value={customer.name}
                    onSelect={() => handleSelect(customer.name)}
                    className="gap-2"
                  >
                    <Check
                      className={cn(
                        'h-3.5 w-3.5',
                        value === customer.name ? 'opacity-100' : 'opacity-0',
                      )}
                    />
                    {customer.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {filtered.length === 0 && !search.trim() && (
              <CommandEmpty className="py-4 text-center text-xs text-muted-foreground">
                No customers yet. Type to create one.
              </CommandEmpty>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
