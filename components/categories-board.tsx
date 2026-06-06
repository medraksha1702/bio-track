'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  TrendingUp,
  TrendingDown,
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  Loader2,
  AlertCircle,
} from 'lucide-react'
import {
  useGetCategoriesQuery,
  useAddCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
  type Category,
} from '@/lib/services/api'
import { fadeInUp } from '@/lib/animations'
import { cn } from '@/lib/utils'

// ─── Single row ────────────────────────────────────────────────────────────────

function CategoryRow({ cat }: { cat: Category }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(cat.name)
  const [updateCategory, { isLoading: saving }] = useUpdateCategoryMutation()
  const [deleteCategory, { isLoading: deleting }] = useDeleteCategoryMutation()
  const [saveError, setSaveError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing) {
      setDraft(cat.name)
      setSaveError('')
      setTimeout(() => inputRef.current?.focus(), 30)
    }
  }, [editing, cat.name])

  const handleSave = async () => {
    if (!draft.trim() || draft.trim() === cat.name) {
      setEditing(false)
      return
    }
    setSaveError('')
    try {
      await updateCategory({ id: cat.id, name: draft.trim() }).unwrap()
      setEditing(false)
    } catch (err: unknown) {
      const msg = (err as { data?: { message?: string } })?.data?.message ?? 'Failed to save'
      setSaveError(msg)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSave()
    if (e.key === 'Escape') setEditing(false)
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.15 }}
      className="group flex items-center gap-2 rounded-lg border border-border/40 bg-background px-3 py-2 transition-colors hover:bg-muted/30"
    >
      {editing ? (
        <div className="flex flex-1 flex-col gap-1">
          <div className="flex items-center gap-2">
            <Input
              ref={inputRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={handleKeyDown}
              className="h-7 flex-1 border-primary/40 text-sm focus-visible:ring-1 focus-visible:ring-primary/40"
            />
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 text-emerald-600 hover:bg-emerald-50"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 text-muted-foreground hover:bg-muted"
              onClick={() => setEditing(false)}
              disabled={saving}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
          {saveError && (
            <p className="flex items-center gap-1 text-[11px] text-destructive">
              <AlertCircle className="h-3 w-3" />
              {saveError}
            </p>
          )}
        </div>
      ) : (
        <>
          <span className="flex-1 text-sm">{cat.name}</span>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100 focus:opacity-100"
            onClick={() => setEditing(true)}
            aria-label={`Rename ${cat.name}`}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100 focus:opacity-100"
                disabled={deleting}
                aria-label={`Delete ${cat.name}`}
              >
                {deleting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5" />
                )}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete category?</AlertDialogTitle>
                <AlertDialogDescription>
                  <strong>&quot;{cat.name}&quot;</strong> will be removed from the list. Existing
                  transactions that use this category are not affected.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={() => deleteCategory(cat.id)}
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
    </motion.div>
  )
}

// ─── Column (one per type) ─────────────────────────────────────────────────────

function CategoryColumn({ type }: { type: 'income' | 'expense' }) {
  const { data: categories = [], isLoading } = useGetCategoriesQuery(type)
  const [addCategory, { isLoading: adding }] = useAddCategoryMutation()
  const [newName, setNewName] = useState('')
  const [addError, setAddError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const isIncome = type === 'income'

  const handleAdd = async () => {
    const name = newName.trim()
    if (!name) return
    setAddError('')
    try {
      await addCategory({ name, type }).unwrap()
      setNewName('')
      inputRef.current?.focus()
    } catch (err: unknown) {
      const msg = (err as { data?: { message?: string } })?.data?.message ?? 'Failed to add'
      setAddError(msg)
    }
  }

  return (
    <Card className="border-border/40 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2.5">
          <div
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-lg',
              isIncome ? 'bg-success/10' : 'bg-destructive/10',
            )}
          >
            {isIncome ? (
              <TrendingUp className="h-4 w-4 text-success" />
            ) : (
              <TrendingDown className="h-4 w-4 text-destructive" />
            )}
          </div>
          <div className="flex-1">
            <CardTitle className="text-base font-semibold">
              {isIncome ? 'Income' : 'Expense'} Categories
            </CardTitle>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Used when recording {type} transactions
            </p>
          </div>
          <Badge
            variant="secondary"
            className={cn(
              'text-xs',
              isIncome
                ? 'border-success/20 bg-success/10 text-success'
                : 'border-destructive/20 bg-destructive/10 text-destructive',
            )}
          >
            {categories.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-10 w-full rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="max-h-[420px] space-y-1.5 overflow-y-auto pr-1">
            <AnimatePresence initial={false}>
              {categories.length === 0 ? (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="py-6 text-center text-xs text-muted-foreground"
                >
                  No {type} categories yet. Add one below.
                </motion.p>
              ) : (
                categories.map((cat) => <CategoryRow key={cat.id} cat={cat} />)
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Add new */}
        <div className="space-y-1.5 border-t border-border/40 pt-3">
          <div className="flex items-center gap-2">
            <Input
              ref={inputRef}
              value={newName}
              onChange={(e) => {
                setNewName(e.target.value)
                setAddError('')
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAdd()
              }}
              placeholder={`New ${type} category…`}
              className="h-9 flex-1 border-border/60 bg-muted/30 text-sm focus-visible:ring-2 focus-visible:ring-primary/30"
            />
            <Button
              size="sm"
              className="h-9 gap-1.5"
              onClick={handleAdd}
              disabled={adding || !newName.trim()}
            >
              {adding ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
              Add
            </Button>
          </div>
          {addError && (
            <p className="flex items-center gap-1 text-[11px] text-destructive">
              <AlertCircle className="h-3 w-3" />
              {addError}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Board ─────────────────────────────────────────────────────────────────────

export function CategoriesBoard() {
  return (
    <motion.div
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
      className="grid gap-6 lg:grid-cols-2"
    >
      <CategoryColumn type="income" />
      <CategoryColumn type="expense" />
    </motion.div>
  )
}
