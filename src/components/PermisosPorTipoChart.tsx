import React, { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as PieTooltip, Legend as PieLegend } from 'recharts';

interface PermisoPorTipo {
  tipo: string;
  cantidad: number;
  porcentaje: number;
}

interface PermisosPorTipoChartProps {
  data: PermisoPorTipo[];
}

const pieColors = [
  '#2E7D32', // verde
  '#1976D2', // azul
  '#FFA726', // naranja
  '#AB47BC', // morado
  '#FF7043', // rojo/naranja
  '#26A69A', // turquesa
  '#FBC02D', // amarillo
  '#8D6E63', // marrón
  '#EC407A', // rosa
  '#29B6F6', // celeste
];

const PermisosPorTipoChart: React.FC<PermisosPorTipoChartProps> = ({ data }) => {
  const [tipoSeleccionado, setTipoSeleccionado] = useState<string | null>(null);

  if (!data || data.length === 0) return null;

  return (
    <div className="card">
      <h2 className="text-xl font-semibold mb-4">Permisos por Tipo</h2>
      <div className="flex flex-col md:flex-row gap-6 items-center">
        {/* Lista de tipos de permiso */}
        <div className="flex-1 space-y-3 w-full">
          {data.map((tipo, index) => (
            <div
              key={index}
              className={`flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer select-none`}
              onClick={() => setTipoSeleccionado(tipo.tipo)}
            >
              <span
                className={`font-medium transition-colors
                  text-[#2E7D32] dark:text-[#4CAF50]
                  ${tipoSeleccionado === tipo.tipo ? 'dark:text-white font-bold' : ''}
                `}
              >
                {tipo.tipo}
              </span>
              <div className="flex items-center space-x-3">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${tipo.porcentaje}%` }}
                  ></div>
                </div>
                <span className="text-sm text-gray-600">{tipo.cantidad} ({tipo.porcentaje}%)</span>
              </div>
            </div>
          ))}
        </div>
        {/* Gráfico de pastel */}
        <div className="flex-1 min-w-[220px] h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="cantidad"
                nameKey="tipo"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label={({ name, percent }) => `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`}
              >
                {data.map((entry, idx) => (
                  <Cell key={`cell-${idx}`} fill={pieColors[idx % pieColors.length]} />
                ))}
              </Pie>
              <PieTooltip />
              <PieLegend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default PermisosPorTipoChart; 