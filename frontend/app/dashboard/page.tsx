import { LayoutGrid, Package, TrendingUp, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface MetricProps {
  label: string;
  value: string;
  icon: React.ComponentType<any>;
  subtitle?: string;
}

export default function Dashboard() {
  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-1">
            Centro de Deposito
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Bienvenido a tu centro de administración
          </p>
        </div>
        {/* <Link href="/experimentation">
          <Button className="bg-blue-600 hover:bg-blue-700 text-white">
            + Nuevo Experimento
          </Button>
        </Link> */}
      </div>

      {/* Welcome Card */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-blue-200 dark:border-slate-700 overflow-hidden shadow-lg">
        <div className="grid grid-cols-2 gap-6 p-8">
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              Inicio rapido.
            </h2>
            <p className="text-slate-600 dark:text-slate-400">
              Empieza a crear nuevos experimentos para optimizar la creación de
              pedidos.
            </p>
            <Link href="/experimentation">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                Optimiza Ya
              </Button>
            </Link>
          </div>
          <div className="bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600 rounded-lg h-48 flex items-center justify-center">
            <div className="text-6xl">📦</div>
          </div>
        </div>
      </div>

      {/* Active Configuration Card */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-blue-200 dark:border-slate-700 p-6 shadow-lg">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
              CONFIGURACIÓN
            </p>
            <h3 className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-2">
              Crea los diferentes Depositos
            </h3>
          </div>
          <div className="flex items-center gap-6">
            {/* <div>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">
                Efficiency Gain
              </p>
              <p className="text-2xl font-bold text-green-600 mt-1">+12.4%</p>
              <div className="h-1 bg-blue-600 rounded-full mt-2 w-24"></div>
            </div> */}
            <Link href="/product-mapping">
              <Button className="bg-blue-600 hover:bg-blue-700">
                Crear Distribuciones
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          {
            label: "Total Products Mapped",
            value: "42,891",
            icon: Package,
          },
          {
            label: "Latest Experiment Result",
            value: "98.2%",
            subtitle: "Accuracy",
            icon: TrendingUp,
          },
          {
            label: "System Uptime",
            value: "365",
            subtitle: "Days",
            icon: Clock,
          },
        ].map((metric, idx) => {
          const Icon = metric.icon;
          return (
            <div
              key={idx}
              className="bg-white dark:bg-slate-800 rounded-2xl border border-blue-200 dark:border-slate-700 p-6 shadow-lg hover:shadow-xl transition-shadow"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <Icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">
                    {metric.label}
                  </p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                    {metric.value}
                  </p>
                  {metric.subtitle && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {metric.subtitle}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Chart Placeholder */}
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-blue-200 dark:border-slate-700 p-8 shadow-lg h-96 flex flex-col items-center justify-center">
          <div className="text-6xl mb-4">📊</div>
          <p className="text-slate-500 dark:text-slate-400 font-medium">
            Product Mapping Trends
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
            Coming soon
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-blue-200 dark:border-slate-700 p-8 shadow-lg h-96 flex flex-col items-center justify-center">
          <div className="text-6xl mb-4">🗺️</div>
          <p className="text-slate-500 dark:text-slate-400 font-medium">
            Live Warehouse Map
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
            Coming soon
          </p>
        </div>
      </div>
    </div>
  );
}
