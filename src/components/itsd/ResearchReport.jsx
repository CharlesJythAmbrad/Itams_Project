import { BarChart3, BookOpen, ScatterChart } from "lucide-react"
import { Card } from "@/components/ui/card"

const formatNumber = (value, digits = 1) => Number(value || 0).toFixed(digits)

function EmptyChart({ message }) {
  return (
    <div className="h-56 flex items-center justify-center rounded-lg border border-dashed border-zinc-200 dark:border-zinc-700 text-sm text-muted-foreground">
      {message}
    </div>
  )
}

function AgeByLocationChart({ data }) {
  if (!data.length) return <EmptyChart message="No asset age and location records are available." />
  const maxAge = Math.max(...data.map(item => item.averageAge), 1)

  return (
    <div className="space-y-3">
      {data.map(item => (
        <div key={item.location} className="grid grid-cols-[minmax(100px,1fr)_2fr_auto] items-center gap-3 text-xs">
          <span className="truncate font-medium text-foreground" title={item.location}>{item.location}</span>
          <div className="h-7 rounded bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
            <div
              className="h-full rounded bg-red-700 transition-all"
              style={{ width: `${Math.max((item.averageAge / maxAge) * 100, 3)}%` }}
            />
          </div>
          <span className="w-20 text-right font-semibold text-red-700 dark:text-red-400">
            {formatNumber(item.averageAge)} yrs ({item.assetCount})
          </span>
        </div>
      ))}
      <div className="flex justify-between text-[11px] text-muted-foreground pt-1">
        <span>Average hardware age</span>
        <span>括括括 = asset count</span>
      </div>
    </div>
  )
}

function AgeRepairScatterChart({ data, correlation }) {
  if (!data.length) return <EmptyChart message="No asset age and repair records are available." />

  const width = 720
  const height = 300
  const padding = { top: 20, right: 24, bottom: 44, left: 52 }
  const plotWidth = width - padding.left - padding.right
  const plotHeight = height - padding.top - padding.bottom
  const maxAge = Math.max(...data.map(point => point.age), 1)
  const maxRepairs = Math.max(...data.map(point => point.repairCount), 1)
  const x = age => padding.left + (age / maxAge) * plotWidth
  const y = count => padding.top + plotHeight - (count / maxRepairs) * plotHeight

  return (
    <div>
      <div className="overflow-x-auto">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full min-w-[520px] h-64" role="img" aria-label="Hardware age versus repair count scatter plot">
          {[0, 0.25, 0.5, 0.75, 1].map(step => (
            <g key={step}>
              <line
                x1={padding.left}
                x2={width - padding.right}
                y1={padding.top + plotHeight * (1 - step)}
                y2={padding.top + plotHeight * (1 - step)}
                stroke="currentColor"
                className="text-zinc-200 dark:text-zinc-700"
                strokeDasharray="3 4"
              />
              <text
                x={padding.left - 8}
                y={padding.top + plotHeight * (1 - step) + 4}
                textAnchor="end"
                className="fill-zinc-500 text-[10px]"
              >
                {Math.round(maxRepairs * step)}
              </text>
            </g>
          ))}
          <line x1={padding.left} x2={width - padding.right} y1={height - padding.bottom} y2={height - padding.bottom} className="stroke-zinc-400 dark:stroke-zinc-600" />
          <line x1={padding.left} x2={padding.left} y1={padding.top} y2={height - padding.bottom} className="stroke-zinc-400 dark:stroke-zinc-600" />
          {data.map(point => (
            <circle
              key={point.id}
              cx={x(point.age)}
              cy={y(point.repairCount)}
              r="4.5"
              className="fill-red-700 stroke-white dark:stroke-zinc-900"
              strokeWidth="1.5"
            >
              <title>{`${point.name}: ${formatNumber(point.age)} years, ${point.repairCount} repair/maintenance records`}</title>
            </circle>
          ))}
          <text x={width / 2} y={height - 10} textAnchor="middle" className="fill-zinc-500 text-[11px]">Hardware age (years)</text>
          <text transform={`translate(14 ${height / 2}) rotate(-90)`} textAnchor="middle" className="fill-zinc-500 text-[11px]">Repair/maintenance count</text>
        </svg>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 mt-2 text-xs text-muted-foreground">
        <span>{data.length} assets plotted</span>
        <span className="font-semibold text-foreground">
          Spearman ρ: {correlation === null ? "N/A" : formatNumber(correlation, 3)}
        </span>
      </div>
    </div>
  )
}

function BorrowingFrequencyChart({ data }) {
  if (!data.length) return <EmptyChart message="No recorded borrowing data is available." />
  const maxCount = Math.max(...data.map(item => item.count), 1)

  return (
    <div className="space-y-3">
      {data.map(item => (
        <div key={item.type} className="grid grid-cols-[minmax(110px,1fr)_2fr_auto] items-center gap-3 text-xs">
          <span className="truncate font-medium text-foreground" title={item.label}>{item.label}</span>
          <div className="h-7 rounded bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
            <div
              className="h-full rounded bg-red-700 transition-all"
              style={{ width: `${Math.max((item.count / maxCount) * 100, 3)}%` }}
            />
          </div>
          <span className="w-10 text-right font-semibold text-red-700 dark:text-red-400">{item.count}</span>
        </div>
      ))}
    </div>
  )
}

export function ResearchReport({ data, isLoading }) {
  if (isLoading) {
    return (
      <Card variant="elevated" className="rounded-[5px] border-zinc-200/90 dark:border-zinc-800">
        <div className="p-6 text-sm text-muted-foreground">Loading research report data…</div>
      </Card>
    )
  }

  return (
    <section className="space-y-4" aria-labelledby="research-report-title">
      <Card variant="elevated" className="rounded-[5px] border-red-200 dark:border-red-900/50">
        <div className="p-6">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400">
              <BookOpen className="size-5" />
            </div>
            <div>
              <h2 id="research-report-title" className="text-lg font-bold text-foreground">Data Visualization Research Report</h2>
              <p className="text-sm text-muted-foreground mt-1">Three analytical views based on the available ITSD inventory dataset.</p>
            </div>
          </div>
        </div>
      </Card>

      <Card variant="elevated" className="rounded-[5px] border-zinc-200/90 dark:border-zinc-800">
        <div className="p-5">
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 className="size-4 text-red-600" />
            <h3 className="font-bold text-foreground">Graph 1: Hardware Age by Building (RQ1)</h3>
          </div>
          <p className="text-xs text-muted-foreground mb-4">Average hardware age by recorded asset location. Higher bars can help ITSD prioritize maintenance or replacement reviews.</p>
          <AgeByLocationChart data={data.ageByLocation} />
        </div>
      </Card>

      <Card variant="elevated" className="rounded-[5px] border-zinc-200/90 dark:border-zinc-800">
        <div className="p-5">
          <div className="flex items-center gap-2 mb-1">
            <ScatterChart className="size-4 text-red-600" />
            <h3 className="font-bold text-foreground">Graph 2: Hardware Age vs. Combined Maintenance and Repair Count (RQ2)</h3>
          </div>
          <p className="text-xs text-muted-foreground mb-4">Each point represents an asset. The count uses recorded asset repair/maintenance events, and Spearman rank correlation summarizes the association.</p>
          <AgeRepairScatterChart data={data.ageRepairPoints} correlation={data.spearmanCorrelation} />
        </div>
      </Card>

      <Card variant="elevated" className="rounded-[5px] border-zinc-200/90 dark:border-zinc-800">
        <div className="p-5">
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 className="size-4 text-red-600" />
            <h3 className="font-bold text-foreground">Graph 3: Borrowing Frequency by Hardware Type (RQ3)</h3>
          </div>
          <p className="text-xs text-muted-foreground mb-4">Total recorded borrowing activity by hardware type. Higher counts identify types that may need closer availability monitoring.</p>
          <BorrowingFrequencyChart data={data.borrowingByType} />
        </div>
      </Card>

      <Card variant="elevated" className="rounded-[5px] border-zinc-200/90 dark:border-zinc-800">
        <div className="p-5">
          <h3 className="font-bold text-foreground mb-2">Interpretation</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            The three graphs focus on the main purpose of each research question: comparing hardware age across locations, examining the association between hardware age and recorded maintenance and repair activity, and identifying the most frequently borrowed hardware types.
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed mt-3">
            The graphs are based on the available analytical dataset. Their results describe the records analyzed and should not automatically be generalized to the entire estimated ITSD inventory. The findings show patterns and associations, not proof of causation.
          </p>
        </div>
      </Card>
    </section>
  )
}

export default ResearchReport
