"use client";

import { useState } from "react";
import { calcularCreditoICMS, calcularCreditoPISCOFINS, calcularST, simularRegime } from "@/lib/calculos";

interface Produto {
  id: number;
  nome: string;
  ncm: string;
  precoCompra: number;
  precoVenda: number;
  temSt: boolean;
}

interface NotaEntrada {
  id: number;
  fornecedor: string;
  numero: string;
  data: string;
  valorTotal: number;
  valorIcms: number;
  valorIpi: number;
  valorPis: number;
  valorCofins: number;
  valorSt: number;
  itens: { produto: string; ncm: string; qtd: number; valor: number; icms: number; st: number }[];
}

export default function Dashboard() {
  const [produtos] = useState<Produto[]>([
    { id: 1, nome: "Arroz 5kg", ncm: "10063020", precoCompra: 18.50, precoVenda: 29.90, temSt: true },
    { id: 2, nome: "Feijão Carioca 1kg", ncm: "07133319", precoCompra: 7.80, precoVenda: 12.90, temSt: false },
    { id: 3, nome: "Óleo de Soja 900ml", ncm: "15079011", precoCompra: 4.50, precoVenda: 7.99, temSt: true },
    { id: 4, nome: "Café Torrado 500g", ncm: "09011100", precoCompra: 12.00, precoVenda: 19.90, temSt: false },
    { id: 5, nome: "Leite Integral 1L", ncm: "04012020", precoCompra: 4.20, precoVenda: 5.99, temSt: true },
    { id: 6, nome: "Carne Bovina 1kg", ncm: "02013000", precoCompra: 28.00, precoVenda: 42.90, temSt: true },
  ]);

  const [notasEntrada] = useState<NotaEntrada[]>([
    {
      id: 1, fornecedor: "Distribuidora ABC", numero: "001234", data: "2026-06-15",
      valorTotal: 4500.00, valorIcms: 540.00, valorIpi: 0, valorPis: 31.50, valorCofins: 145.50, valorSt: 280.00,
      itens: [
        { produto: "Arroz 5kg", ncm: "10063020", qtd: 100, valor: 1850.00, icms: 222.00, st: 150.00 },
        { produto: "Feijão Carioca 1kg", ncm: "07133319", qtd: 200, valor: 1560.00, icms: 187.20, st: 0 },
      ]
    },
    {
      id: 2, fornecedor: "Frigorífico XYZ", numero: "005678", data: "2026-06-18",
      valorTotal: 8500.00, valorIcms: 1020.00, valorIpi: 0, valorPis: 59.50, valorCofins: 277.50, valorSt: 620.00,
      itens: [
        { produto: "Carne Bovina 1kg", ncm: "02013000", qtd: 200, valor: 5600.00, icms: 672.00, st: 420.00 },
        { produto: "Leite Integral 1L", ncm: "04012020", qtd: 500, valor: 2100.00, icms: 252.00, st: 200.00 },
      ]
    }
  ]);

  const totalVendasMes = 45000.00;
  const totalNotas = notasEntrada.reduce((acc, n) => acc + n.valorTotal, 0);
  const totalCreditos = notasEntrada.reduce((acc, n) => acc + n.valorIcms + n.valorIpi + n.valorPis + n.valorCofins + n.valorSt, 0);
  const simulacao = simularRegime(totalVendasMes, totalNotas, 0.147, 0.113);

  const [activeTab, setActiveTab] = useState<"dashboard" | "produtos" | "entradas" | "simulador" | "relatorios">("dashboard");

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Visão geral do seu planejamento tributário</p>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <CardResumo titulo="Vendas do Mês" valor={`R$ ${totalVendasMes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} cor="blue" />
        <CardResumo titulo="Notas de Entrada" valor={`R$ ${totalNotas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} cor="green" />
        <CardResumo titulo="Créditos Disponíveis" valor={`R$ ${totalCreditos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} cor="emerald" />
        <CardResumo titulo="Economia Mensal" valor={`R$ ${simulacao.economia.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} cor="amber" />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200 pb-2">
        <TabButton active={activeTab === "dashboard"} onClick={() => setActiveTab("dashboard")}>📊 Resumo</TabButton>
        <TabButton active={activeTab === "produtos"} onClick={() => setActiveTab("produtos")}>📦 Produtos</TabButton>
        <TabButton active={activeTab === "entradas"} onClick={() => setActiveTab("entradas")}>📥 Notas</TabButton>
        <TabButton active={activeTab === "simulador"} onClick={() => setActiveTab("simulador")}>🧮 Simulador</TabButton>
        <TabButton active={activeTab === "relatorios"} onClick={() => setActiveTab("relatorios")}>📈 Relatórios</TabButton>
      </div>

      {/* Conteúdo */}
      {activeTab === "dashboard" && <TabDashboard notas={notasEntrada} creditos={totalCreditos} />}
      {activeTab === "produtos" && <TabProdutos produtos={produtos} />}
      {activeTab === "entradas" && <TabEntradas notas={notasEntrada} />}
      {activeTab === "simulador" && <TabSimulador />}
      {activeTab === "relatorios" && <TabRelatorios />}
    </div>
  );
}

function CardResumo({ titulo, valor, cor }: { titulo: string; valor: string; cor: string }) {
  const cores: Record<string, string> = {
    blue: "bg-blue-50 border-blue-200 text-blue-700",
    green: "bg-green-50 border-green-200 text-green-700",
    emerald: "bg-emerald-50 border-emerald-200 text-emerald-700",
    amber: "bg-amber-50 border-amber-200 text-amber-700",
  };
  return (
    <div className={`rounded-xl border-2 p-5 ${cores[cor] || cores.blue}`}>
      <div className="text-sm font-medium opacity-80">{titulo}</div>
      <div className="text-2xl font-bold mt-1">{valor}</div>
    </div>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
        active ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-100"
      }`}
    >
      {children}
    </button>
  );
}

function TabDashboard({ notas, creditos }: { notas: NotaEntrada[]; creditos: number }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">📋 Últimas Notas de Entrada</h3>
        <div className="space-y-3">
          {notas.map((nota) => (
            <div key={nota.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <div>
                <div className="font-medium text-sm">{nota.fornecedor}</div>
                <div className="text-xs text-gray-500">NF {nota.numero} - {nota.data}</div>
              </div>
              <div className="text-right">
                <div className="font-semibold text-sm">R$ {nota.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                <div className="text-xs text-green-600">Créditos: R$ {(nota.valorIcms + nota.valorSt).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">💰 Detalhamento dos Créditos</h3>
        <div className="space-y-3">
          <CreditoRow tipo="ICMS" valor={notas.reduce((a, n) => a + n.valorIcms, 0)} />
          <CreditoRow tipo="ST" valor={notas.reduce((a, n) => a + n.valorSt, 0)} />
          <CreditoRow tipo="PIS" valor={notas.reduce((a, n) => a + n.valorPis, 0)} />
          <CreditoRow tipo="COFINS" valor={notas.reduce((a, n) => a + n.valorCofins, 0)} />
          <CreditoRow tipo="IPI" valor={notas.reduce((a, n) => a + n.valorIpi, 0)} />
          <div className="border-t border-gray-200 pt-2 mt-2">
            <div className="flex justify-between font-bold text-blue-700">
              <span>TOTAL</span>
              <span>R$ {creditos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CreditoRow({ tipo, valor }: { tipo: string; valor: number }) {
  const cores: Record<string, string> = {
    ICMS: "text-blue-600", ST: "text-purple-600", PIS: "text-green-600", COFINS: "text-orange-600", IPI: "text-red-600"
  };
  return (
    <div className="flex justify-between items-center">
      <span className={`text-sm font-medium ${cores[tipo] || "text-gray-700"}`}>{tipo}</span>
      <span className="text-sm">R$ {valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
    </div>
  );
}

function TabProdutos({ produtos }: { produtos: Produto[] }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-gray-900">📦 Produtos Cadastrados</h3>
        <button className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
          + Novo Produto
        </button>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-3 px-2 font-medium text-gray-600">Produto</th>
            <th className="text-left py-3 px-2 font-medium text-gray-600">NCM</th>
            <th className="text-right py-3 px-2 font-medium text-gray-600">Compra</th>
            <th className="text-right py-3 px-2 font-medium text-gray-600">Venda</th>
            <th className="text-center py-3 px-2 font-medium text-gray-600">ST</th>
          </tr>
        </thead>
        <tbody>
          {produtos.map((p) => (
            <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50">
              <td className="py-3 px-2 font-medium">{p.nome}</td>
              <td className="py-3 px-2 text-gray-600 font-mono">{p.ncm}</td>
              <td className="py-3 px-2 text-right">R$ {p.precoCompra.toFixed(2)}</td>
              <td className="py-3 px-2 text-right font-semibold">R$ {p.precoVenda.toFixed(2)}</td>
              <td className="py-3 px-2 text-center">
                {p.temSt ? (
                  <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">ST</span>
                ) : (
                  <span className="px-2 py-1 bg-gray-100 text-gray-500 rounded-full text-xs">-</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TabEntradas({ notas }: { notas: NotaEntrada[] }) {
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-gray-900">📥 Notas de Entrada</h3>
          <button className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700">
            + Importar XML
          </button>
        </div>
        {notas.map((nota) => (
          <div key={nota.id} className="border border-gray-200 rounded-lg p-4 mb-4">
            <div className="flex justify-between items-start mb-3">
              <div>
                <div className="font-semibold">{nota.fornecedor}</div>
                <div className="text-sm text-gray-500">NF {nota.numero} | {nota.data}</div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-green-700">R$ {nota.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
              </div>
            </div>
            <div className="grid grid-cols-5 gap-2 text-xs bg-gray-50 p-3 rounded-lg">
              <div><span className="text-gray-500">ICMS:</span> <span className="font-semibold">R$ {nota.valorIcms.toFixed(2)}</span></div>
              <div><span className="text-gray-500">IPI:</span> <span className="font-semibold">R$ {nota.valorIpi.toFixed(2)}</span></div>
              <div><span className="text-gray-500">PIS:</span> <span className="font-semibold">R$ {nota.valorPis.toFixed(2)}</span></div>
              <div><span className="text-gray-500">COFINS:</span> <span className="font-semibold">R$ {nota.valorCofins.toFixed(2)}</span></div>
              <div><span className="text-gray-500">ST:</span> <span className="font-semibold text-purple-700">R$ {nota.valorSt.toFixed(2)}</span></div>
            </div>
            <table className="w-full text-xs mt-3">
              <thead>
                <tr className="text-gray-500">
                  <th className="text-left py-1">Produto</th>
                  <th className="text-left py-1">NCM</th>
                  <th className="text-right py-1">Qtd</th>
                  <th className="text-right py-1">Valor</th>
                  <th className="text-right py-1">ICMS</th>
                  <th className="text-right py-1">ST</th>
                </tr>
              </thead>
              <tbody>
                {nota.itens.map((item, idx) => (
                  <tr key={idx} className="border-t border-gray-100">
                    <td className="py-1">{item.produto}</td>
                    <td className="py-1 font-mono">{item.ncm}</td>
                    <td className="py-1 text-right">{item.qtd}</td>
                    <td className="py-1 text-right">R$ {item.valor.toFixed(2)}</td>
                    <td className="py-1 text-right">R$ {item.icms.toFixed(2)}</td>
                    <td className="py-1 text-right text-purple-700">R$ {item.st.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </div>
  );
}

function TabSimulador() {
  const [faturamento, setFaturamento] = useState("45000");
  const [aliquotaSimples, setAliquotaSimples] = useState("14.7");
  const [aliquotaPresumido, setAliquotaPresumido] = useState("11.3");

  const faturamentoNum = parseFloat(faturamento) || 0;
  const simples = faturamentoNum * (parseFloat(aliquotaSimples) / 100);
  const presumido = faturamentoNum * 0.32 * (parseFloat(aliquotaPresumido) / 100);
  const economia = Math.abs(simples - presumido);
  const melhorRegime = simples < presumido ? "Simples Nacional" : "Lucro Presumido";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">🧮 Simulador de Regime Tributário</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Faturamento Mensal (R$)</label>
            <input type="number" value={faturamento} onChange={(e) => setFaturamento(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Alíquota Simples (%)</label>
              <input type="number" step="0.1" value={aliquotaSimples} onChange={(e) => setAliquotaSimples(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Alíquota Presumido (%)</label>
              <input type="number" step="0.1" value={aliquotaPresumido} onChange={(e) => setAliquotaPresumido(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">📊 Resultado da Simulação</h3>
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="text-sm text-blue-600 font-medium">Simples Nacional</div>
            <div className="text-2xl font-bold text-blue-700">R$ {simples.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
          </div>
          <div className="p-4 bg-green-50 rounded-lg">
            <div className="text-sm text-green-600 font-medium">Lucro Presumido</div>
            <div className="text-2xl font-bold text-green-700">R$ {presumido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
          </div>
          <div className="p-4 bg-amber-50 rounded-lg border-2 border-amber-200">
            <div className="text-sm text-amber-600 font-medium">Economia Potencial</div>
            <div className="text-2xl font-bold text-amber-700">R$ {economia.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
            <div className="text-sm text-amber-600 mt-1">
              Melhor regime: <span className="font-bold">{melhorRegime}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TabRelatorios() {
  const meses = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun"];
  const vendas = [38000, 42000, 39500, 44000, 41000, 45000];
  const impostos = [4656, 5148, 4845, 5390, 5025, 5513];
  const creditos = [1200, 1350, 1180, 1420, 1300, 1500];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">📈 Evolução Mensal</h3>
        <div className="space-y-3">
          {meses.map((mes, i) => (
            <div key={mes} className="flex items-center gap-4">
              <span className="w-8 text-sm text-gray-500">{mes}</span>
              <div className="flex-1">
                <div className="h-4 bg-blue-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(vendas[i] / 50000) * 100}%` }} />
                </div>
              </div>
              <span className="w-24 text-right text-sm font-medium">R$ {(vendas[i] / 1000).toFixed(0)}k</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">💰 Impostos vs Créditos</h3>
        <div className="space-y-3">
          {meses.map((mes, i) => (
            <div key={mes} className="flex items-center gap-4">
              <span className="w-8 text-sm text-gray-500">{mes}</span>
              <div className="flex-1 space-y-1">
                <div className="h-3 bg-red-100 rounded-full overflow-hidden">
                  <div className="h-full bg-red-400 rounded-full" style={{ width: `${(impostos[i] / 6000) * 100}%` }} />
                </div>
                <div className="h-3 bg-green-100 rounded-full overflow-hidden">
                  <div className="h-full bg-green-400 rounded-full" style={{ width: `${(creditos[i] / 2000) * 100}%` }} />
                </div>
              </div>
              <div className="w-32 text-right text-xs">
                <div className="text-red-600">-{(impostos[i] / 1000).toFixed(1)}k</div>
                <div className="text-green-600">+{(creditos[i] / 1000).toFixed(1)}k</div>
              </div>
            </div>
          ))}
        </div>
        <div className="flex gap-4 mt-4 text-xs">
          <span className="flex items-center gap-1"><span className="w-3 h-3 bg-red-400 rounded-full" /> Impostos</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 bg-green-400 rounded-full" /> Créditos</span>
        </div>
      </div>
    </div>
  );
}
