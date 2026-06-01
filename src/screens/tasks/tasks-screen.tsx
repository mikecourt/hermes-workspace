'use client'

import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  ArrowUpRight01Icon,
  CheckListIcon,
  RefreshIcon,
} from '@hugeicons/core-free-icons'
import { Button } from '@/components/ui/button'

export const TASKS_BOARD_HELP_TEXT =
  'Workspace Tasks opens the native Hermes Dashboard Kanban so project boards stay in one source of truth.'

const DEFAULT_DASHBOARD_URL = 'http://127.0.0.1:9119'

type GatewayStatus = {
  dashboardUrl?: string
  dashboard?: {
    available?: boolean
    url?: string
  }
}

async function readGatewayStatus(): Promise<GatewayStatus> {
  const response = await fetch('/api/gateway-status')
  const payload = (await response.json().catch(() => ({}))) as GatewayStatus & {
    error?: string
  }
  if (!response.ok || payload.error) {
    throw new Error(payload.error || `Request failed (${response.status})`)
  }
  return payload
}

function buildKanbanUrl(status?: GatewayStatus): string {
  const raw =
    status?.dashboard?.url || status?.dashboardUrl || DEFAULT_DASHBOARD_URL
  try {
    const url = new URL(raw)
    url.pathname = `${url.pathname.replace(/\/+$/, '')}/kanban`
    url.search = ''
    url.hash = ''
    return url.toString()
  } catch {
    return `${DEFAULT_DASHBOARD_URL}/kanban`
  }
}

export function TasksScreen() {
  const [iframeKey, setIframeKey] = useState(0)
  const statusQuery = useQuery({
    queryKey: ['gateway-status', 'tasks-kanban'],
    queryFn: readGatewayStatus,
    refetchInterval: 30_000,
  })

  const kanbanUrl = useMemo(
    () => buildKanbanUrl(statusQuery.data),
    [statusQuery.data],
  )
  const dashboardAvailable =
    statusQuery.data?.dashboard?.available ?? !statusQuery.isError

  function refresh() {
    setIframeKey((current) => current + 1)
    void statusQuery.refetch()
  }

  return (
    <div className="flex min-h-full flex-col bg-surface text-ink">
      <header className="shrink-0 border-b border-primary-200 bg-primary-50/90 px-4 py-3 backdrop-blur-xl dark:border-neutral-800 dark:bg-neutral-950/90 sm:px-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <HugeiconsIcon icon={CheckListIcon} size={20} strokeWidth={1.8} />
              <h1 className="text-lg font-semibold text-ink">Tasks</h1>
              {dashboardAvailable ? (
                <span className="rounded-full border border-emerald-400/40 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-300">
                  Dashboard Kanban
                </span>
              ) : (
                <span className="rounded-full border border-amber-400/40 bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-600 dark:text-amber-300">
                  Checking dashboard
                </span>
              )}
            </div>
            <p className="mt-1 max-w-3xl text-xs text-[var(--theme-muted)]">
              {TASKS_BOARD_HELP_TEXT}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={refresh}
              disabled={statusQuery.isFetching && !kanbanUrl}
              className="gap-1.5"
            >
              <HugeiconsIcon icon={RefreshIcon} size={14} strokeWidth={1.8} />
              Refresh
            </Button>
            <Button asChild size="sm" className="gap-1.5">
              <a href={kanbanUrl} target="_blank" rel="noreferrer">
                <HugeiconsIcon
                  icon={ArrowUpRight01Icon}
                  size={14}
                  strokeWidth={1.8}
                />
                Open
              </a>
            </Button>
          </div>
        </div>
      </header>

      <main className="min-h-0 flex-1 p-3 sm:p-4">
        <div className="h-[calc(100vh-9.5rem)] min-h-[560px] overflow-hidden rounded-xl border border-primary-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
          <iframe
            key={iframeKey}
            src={kanbanUrl}
            title="Hermes Dashboard Kanban"
            className="h-full w-full border-0"
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-downloads allow-modals"
          />
        </div>
      </main>
    </div>
  )
}
