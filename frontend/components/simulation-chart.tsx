'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface SimulationResult {
  operarios: number
  tiempo: number
  tiempo_promedio_por_operario?: Record<string, number>
}

interface SimulationChartProps {
  data: SimulationResult[]
  isLoading: boolean
  xAxisLabel?: string
  yAxisLabel?: string
  barName?: string
}

export function SimulationChart({
  data,
  isLoading,
  xAxisLabel = 'Cantidad de Operarios',
  yAxisLabel = 'Tiempo (minutos)',
  barName = 'Tiempo de Ejecución',
}: SimulationChartProps) {
  const hasStackedWorkerData = data.some(
    (item) =>
      item.tiempo_promedio_por_operario &&
      Object.keys(item.tiempo_promedio_por_operario).length > 0
  )

  const workerKeys = hasStackedWorkerData
    ? Array.from(
        new Set(
          data.flatMap((item) =>
            Object.keys(item.tiempo_promedio_por_operario || {})
          )
        )
      ).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
    : []

  const workerColors = [
    '#1d4ed8',
    '#ea580c',
    '#16a34a',
    '#dc2626',
    '#7c3aed',
    '#0891b2',
    '#ca8a04',
    '#be123c',
  ]

  const renderStackedTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value?: number; name?: string; color?: string }>; label?: string | number }) => {
    if (!active || !payload || payload.length === 0) {
      return null
    }

    const activeSegment = payload.find((item) => Number(item?.value) > 0)

    if (!activeSegment || typeof activeSegment.value !== 'number') {
      return null
    }

    return (
      <div
        style={{
          backgroundColor: '#ffffff',
          border: '2px solid #3b82f6',
          borderRadius: '0.75rem',
          boxShadow: '0 4px 12px rgba(59, 130, 246, 0.15)',
          padding: '10px 12px',
        }}
      >
        <p style={{ color: '#0f172a', fontWeight: 600, marginBottom: '6px' }}>{label} operarios</p>
        <p style={{ color: activeSegment.color || '#0f172a', fontWeight: 600 }}>
          {activeSegment.name}: {activeSegment.value.toFixed(2)} min
        </p>
      </div>
    )
  }

  return (
    <div className="w-full">
      {isLoading ? (
        <div className="flex flex-col items-center justify-center h-96">
          <div className="w-12 h-12 rounded-full border-4 border-blue-200 dark:border-slate-600 border-t-blue-500 dark:border-t-blue-400 animate-spin mb-4"></div>
          <p className="text-slate-600 dark:text-slate-300 font-medium">Ejecutando simulación...</p>
        </div>
      ) : data.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-96">
          <div className="text-5xl mb-4">📊</div>
          <p className="text-slate-600 dark:text-slate-300 font-medium">Ejecuta una simulación para ver los resultados</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#bfdbfe" />
            <XAxis 
              dataKey="operarios" 
              label={{ value: xAxisLabel, position: 'insideBottom', offset: -10 }}
              tick={{ fill: '#0d1b3b' }}
              stroke="#bfdbfe"
            />
            <YAxis 
              label={{ value: yAxisLabel, angle: -90, position: 'insideLeft' }}
              tick={{ fill: '#0d1b3b' }}
              stroke="#bfdbfe"
            />
            <Tooltip
              shared={false}
              contentStyle={{
                backgroundColor: '#ffffff',
                border: '2px solid #3b82f6',
                borderRadius: '0.75rem',
                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.15)',
              }}
              cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
              labelFormatter={(value) => `${value} operarios`}
              content={hasStackedWorkerData ? renderStackedTooltip : undefined}
              formatter={(value: number | string, name: string) => {
                const numericValue = Number(value)

                if (hasStackedWorkerData && numericValue <= 0) {
                  return null
                }

                return [
                  `${numericValue.toFixed(2)} min`,
                  hasStackedWorkerData ? name : 'Tiempo',
                ]
              }}
            />
            <Legend 
              wrapperStyle={{ paddingTop: '20px' }}
              iconType="square"
            />
            {hasStackedWorkerData ? (
              workerKeys.map((workerKey, index) => {
                const isTopSegment = index === workerKeys.length - 1

                return (
                  <Bar
                    key={workerKey}
                    dataKey={(item: SimulationResult) =>
                      item.tiempo_promedio_por_operario?.[workerKey] || 0
                    }
                    stackId="tiempo-operarios"
                    fill={workerColors[index % workerColors.length]}
                    name={workerKey}
                    stroke="#ffffff"
                    strokeWidth={1}
                    radius={isTopSegment ? [8, 8, 0, 0] : [0, 0, 0, 0]}
                    animationDuration={800}
                  />
                )
              })
            ) : (
              <Bar
                dataKey="tiempo"
                fill="#3b82f6"
                name={barName}
                radius={[8, 8, 0, 0]}
                animationDuration={800}
              />
            )}
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
