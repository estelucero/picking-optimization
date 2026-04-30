'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface SimulationResult {
  operarios: number
  tiempo: number
}

interface SimulationChartProps {
  data: SimulationResult[]
  isLoading: boolean
}

export function SimulationChart({ data, isLoading }: SimulationChartProps) {
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
            <CartesianGrid strokeDasharray="3 3" stroke="#bfdbfe" dark="#334155" />
            <XAxis 
              dataKey="operarios" 
              label={{ value: 'Cantidad de Operarios', position: 'insideBottom', offset: -10 }}
              tick={{ fill: '#0d1b3b' }}
              stroke="#bfdbfe"
            />
            <YAxis 
              label={{ value: 'Tiempo (minutos)', angle: -90, position: 'insideLeft' }}
              tick={{ fill: '#0d1b3b' }}
              stroke="#bfdbfe"
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#ffffff',
                border: '2px solid #3b82f6',
                borderRadius: '0.75rem',
                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.15)',
              }}
              cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
              labelFormatter={(value) => `${value} operarios`}
              formatter={(value: number) => [`${value.toFixed(2)} min`, 'Tiempo']}
            />
            <Legend 
              wrapperStyle={{ paddingTop: '20px' }}
              iconType="square"
            />
            <Bar 
              dataKey="tiempo" 
              fill="#3b82f6" 
              name="Tiempo de Ejecución"
              radius={[8, 8, 0, 0]}
              animationDuration={800}
            />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
