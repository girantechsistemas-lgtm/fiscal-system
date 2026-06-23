"use client";

import clienteData from "@/data/cliente_gourmet.json";

interface Produto {
  id: number;
  nome: string;
  ncm: string;
  gtin: string;
  prc_custo: number;
  prc_venda: number;
  tributacao: number | null;
  estoque: number;
  grupo: string;
  st_pauta: number;
}

interface NotaEntrada {
  id: number;
  numero: string;
  fornecedor: string;
  cnpj: string;
  data: string;
  vlr_produtos: number;
  icms_valor: number;
  icms_st: number;
  pis: number;
  cofins: number;
  ipi: number;
  total: number;
  cancelada: boolean;
}

const produtos = clienteData.produtos as Produto[];
const notasEntrada = clienteData.notas_entrada as NotaEntrada[];
const resumo = clienteData.resumo;

const totalCreditos =
  resumo.icms_credito +
  resumo.st_credito +
  resumo.ipi_credito +
  resumo.pis_credito +
  resumo.cofins_credito;

const creditosPorTipo = [
  { label: "ICMS", value: resumo.icms_credito, color: "bg-blue-500" },
  { label: "ST", value: resumo.st_credito, color: "bg-purple-500" },
  { label: "IPI", value: resumo.ipi_credito, color: "bg-red-500" },
  { label: "PIS", value: resumo.pis_credito, color: "bg-green-500" },
  { label: "COFINS", value: resumo.cofins_credito, color: "bg-orange-500" },
];

const maxCredito = Math.max(...creditosPorTipo.map((c) => c.value), 1);

const grupos = produtos.reduce<Record<string, number>>((acc, p) => {
  if (p.grupo) {
    acc[p.grupo] = (acc[p.grupo] || 0) + 1;
  }
  return acc;
}, {});

const gruposOrdenados = Object.entries(grupos)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 20);

function formatCurrency(value: number): string {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">
            Visao geral do planejamento tributario
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <MetricCard
            label="Faturamento"
            value={formatCurrency(resumo.faturamento_total)}
          />
          <MetricCard
            label="Credito Fiscal"
            value={formatCurrency(totalCreditos)}
            valueColor="text-green-600"
          />
          <MetricCard
            label="Total Produtos"
            value={produtos.length.toString()}
          />
          <MetricCard
            label="Total Vendas"
            value={resumo.total_vendas.toLocaleString("pt-BR")}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-8">
          <div className="lg:col-span-3 bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">
              Ultimas Notas de Entrada
            </h2>
            <div className="divide-y divide-gray-100">
              {notasEntrada.slice(0, 5).map((nota) => (
                <div
                  key={nota.id}
                  className="flex items-center justify-between py-3 first:pt-0 last:pb-0 hover:bg-gray-50 -mx-6 px-6 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {nota.fornecedor}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {nota.data}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-gray-900 ml-4 whitespace-nowrap">
                    {formatCurrency(nota.total)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">
              Creditos por Tipo
            </h2>
            <div className="space-y-4">
              {creditosPorTipo.map((credito) => (
                <div key={credito.label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm text-gray-600">
                      {credito.label}
                    </span>
                    <span className="text-sm font-medium text-gray-900">
                      {formatCurrency(credito.value)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className={`${credito.color} h-2 rounded-full transition-all duration-500`}
                      style={{
                        width: `${(credito.value / maxCredito) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">
            Produtos por Grupo
          </h2>
          <div className="flex flex-wrap gap-2">
            {gruposOrdenados.map(([grupo, count]) => (
              <span
                key={grupo}
                className="inline-flex items-center px-3 py-1.5 rounded-full text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
              >
                {grupo}
                <span className="ml-2 text-xs font-medium text-gray-500">
                  {count}
                </span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  valueColor = "text-gray-900",
}: {
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${valueColor}`}>{value}</p>
    </div>
  );
}
