"use client";

import { useState, useMemo } from "react";
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

interface VendaPDV {
  id: number;
  data: string;
  cliente: string;
  vlr_itens: number;
  desconto: number;
  total: number;
  pago: number;
  situacao: string;
}

export default function Dashboard() {
  const produtos = clienteData.produtos as Produto[];
  const notasEntrada = clienteData.notas_entrada as NotaEntrada[];
  const vendasPDV = clienteData.vendas_pdv as VendaPDV[];
  const resumo = clienteData.resumo;
  const empresa = clienteData.empresa;

  const [activeTab, setActiveTab] = useState<"dashboard" | "produtos" | "entradas" | "vendas" | "simulador" | "analise">("dashboard");
  const [searchProduto, setSearchProduto] = useState("");

  const produtosFiltrados = useMemo(() => {
    if (!searchProduto) return produtos.slice(0, 50);
    return produtos.filter(p =>
      p.nome.toLowerCase().includes(searchProduto.toLowerCase()) ||
      p.ncm.includes(searchProduto)
    ).slice(0, 50);
  }, [searchProduto, produtos]);

  const totalCreditos = resumo.icms_credito + resumo.st_credito + resumo.pis_credito + resumo.cofins_credito + resumo.ipi_credito;

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-3xl font-bold text-gray-900">FiscalZim</h1>
          <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">DADOS REAIS</span>
        </div>
        <p className="text-gray-500">{empresa.nome_fantasia} | CNPJ: {empresa.cnpj}</p>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card titulo="Faturamento Total" valor={`R$ ${(resumo.faturamento_total / 1000).toFixed(0)}k`} subtitulo={`${resumo.total_vendas} vendas`} cor="blue" />
        <Card titulo="Créditos Fiscais" valor={`R$ ${totalCreditos.toFixed(2)}`} subtitulo="Disponíveis" cor="green" />
        <Card titulo="ICMS Crédito" valor={`R$ ${resumo.icms_credito.toFixed(2)}`} subtitulo="Nas entradas" cor="emerald" />
        <Card titulo="ST Crédito" valor={`R$ ${resumo.st_credito.toFixed(2)}`} subtitulo="Subst. Tributária" cor="purple" />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200 pb-2 overflow-x-auto">
        <Tab active={activeTab === "dashboard"} onClick={() => setActiveTab("dashboard")}>📊 Resumo</Tab>
        <Tab active={activeTab === "produtos"} onClick={() => setActiveTab("produtos")}>📦 Produtos ({produtos.length})</Tab>
        <Tab active={activeTab === "entradas"} onClick={() => setActiveTab("entradas")}>📥 Notas Entrada</Tab>
        <Tab active={activeTab === "vendas"} onClick={() => setActiveTab("vendas")}>💰 Vendas PDV</Tab>
        <Tab active={activeTab === "simulador"} onClick={() => setActiveTab("simulador")}>🧮 Simulador</Tab>
        <Tab active={activeTab === "analise"} onClick={() => setActiveTab("analise")}>🔍 Análise</Tab>
      </div>

      {/* Conteúdo */}
      {activeTab === "dashboard" && <TabDashboard resumo={resumo} notas={notasEntrada} />}
      {activeTab === "produtos" && <TabProdutos produtos={produtosFiltrados} search={searchProduto} setSearch={setSearchProduto} />}
      {activeTab === "entradas" && <TabEntradas notas={notasEntrada} />}
      {activeTab === "vendas" && <TabVendas vendas={vendasPDV} resumo={resumo} />}
      {activeTab === "simulador" && <TabSimulador />}
      {activeTab === "analise" && <TabAnalise resumo={resumo} produtos={produtos} />}
    </div>
  );
}

function Card({ titulo, valor, subtitulo, cor }: { titulo: string; valor: string; subtitulo: string; cor: string }) {
  const cores: Record<string, string> = {
    blue: "bg-blue-50 border-blue-200",
    green: "bg-green-50 border-green-200",
    emerald: "bg-emerald-50 border-emerald-200",
    purple: "bg-purple-50 border-purple-200",
    amber: "bg-amber-50 border-amber-200",
  };
  return (
    <div className={`rounded-xl border-2 p-5 ${cores[cor] || cores.blue}`}>
      <div className="text-sm font-medium text-gray-600">{titulo}</div>
      <div className="text-2xl font-bold text-gray-900 mt-1">{valor}</div>
      <div className="text-xs text-gray-500 mt-1">{subtitulo}</div>
    </div>
  );
}

function Tab({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${active ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-100"}`}>
      {children}
    </button>
  );
}

function TabDashboard({ resumo, notas }: { resumo: any; notas: NotaEntrada[] }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">📥 Últimas Notas de Entrada</h3>
        <div className="space-y-3">
          {notas.map((nota) => (
            <div key={nota.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <div>
                <div className="font-medium text-sm">{nota.fornecedor}</div>
                <div className="text-xs text-gray-500">NF {nota.numero} | {nota.data}</div>
              </div>
              <div className="text-right">
                <div className="font-semibold text-sm">R$ {nota.total.toFixed(2)}</div>
                <div className="text-xs text-green-600">ICMS: R$ {nota.icms_valor.toFixed(2)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">💰 Créditos Fiscais Disponíveis</h3>
        <div className="space-y-3">
          <CreditoRow tipo="ICMS" valor={resumo.icms_credito} />
          <CreditoRow tipo="ST" valor={resumo.st_credito} />
          <CreditoRow tipo="IPI" valor={resumo.ipi_credito} />
          <CreditoRow tipo="PIS" valor={resumo.pis_credito} />
          <CreditoRow tipo="COFINS" valor={resumo.cofins_credito} />
          <div className="border-t border-gray-200 pt-2 mt-2">
            <div className="flex justify-between font-bold text-green-700">
              <span>TOTAL</span>
              <span>R$ {(resumo.icms_credito + resumo.st_credito + resumo.ipi_credito + resumo.pis_credito + resumo.cofins_credito).toFixed(2)}</span>
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
      <span className="text-sm">R$ {valor.toFixed(2)}</span>
    </div>
  );
}

function TabProdutos({ produtos, search, setSearch }: { produtos: Produto[]; search: string; setSearch: (s: string) => void }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-gray-900">📦 Produtos Cadastrados</h3>
        <input
          type="text"
          placeholder="Buscar por nome ou NCM..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-2 font-medium text-gray-600">ID</th>
              <th className="text-left py-3 px-2 font-medium text-gray-600">Produto</th>
              <th className="text-left py-3 px-2 font-medium text-gray-600">NCM</th>
              <th className="text-left py-3 px-2 font-medium text-gray-600">Grupo</th>
              <th className="text-right py-3 px-2 font-medium text-gray-600">Custo</th>
              <th className="text-right py-3 px-2 font-medium text-gray-600">Venda</th>
              <th className="text-right py-3 px-2 font-medium text-gray-600">Margem</th>
            </tr>
          </thead>
          <tbody>
            {produtos.map((p) => {
              const margem = p.prc_venda > 0 && p.prc_custo > 0
                ? ((p.prc_venda - p.prc_custo) / p.prc_venda * 100)
                : 0;
              return (
                <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-2 text-gray-500">{p.id}</td>
                  <td className="py-3 px-2 font-medium">{p.nome}</td>
                  <td className="py-3 px-2 text-gray-600 font-mono text-xs">{p.ncm || '-'}</td>
                  <td className="py-3 px-2 text-gray-600">{p.grupo || '-'}</td>
                  <td className="py-3 px-2 text-right">{p.prc_custo > 0 ? `R$ ${p.prc_custo.toFixed(2)}` : '-'}</td>
                  <td className="py-3 px-2 text-right font-semibold">{p.prc_venda > 0 ? `R$ ${p.prc_venda.toFixed(2)}` : '-'}</td>
                  <td className="py-3 px-2 text-right">
                    {margem > 0 ? (
                      <span className={`px-2 py-1 rounded-full text-xs ${margem > 30 ? 'bg-green-100 text-green-700' : margem > 15 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                        {margem.toFixed(1)}%
                      </span>
                    ) : '-'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TabEntradas({ notas }: { notas: NotaEntrada[] }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="font-semibold text-gray-900 mb-4">📥 Notas Fiscais de Entrada</h3>
      {notas.length === 0 ? (
        <p className="text-gray-500 text-center py-8">Nenhuma nota de entrada encontrada</p>
      ) : (
        <div className="space-y-4">
          {notas.map((nota) => (
            <div key={nota.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="font-semibold">{nota.fornecedor}</div>
                  <div className="text-sm text-gray-500">NF {nota.numero} | {nota.data}</div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-green-700">R$ {nota.total.toFixed(2)}</div>
                  {nota.cancelada && <span className="text-red-500 text-xs">CANCELADA</span>}
                </div>
              </div>
              <div className="grid grid-cols-5 gap-2 text-xs bg-gray-50 p-3 rounded-lg">
                <div><span className="text-gray-500">ICMS:</span> <span className="font-semibold">R$ {nota.icms_valor.toFixed(2)}</span></div>
                <div><span className="text-gray-500">ST:</span> <span className="font-semibold text-purple-700">R$ {nota.icms_st.toFixed(2)}</span></div>
                <div><span className="text-gray-500">IPI:</span> <span className="font-semibold">R$ {nota.ipi.toFixed(2)}</span></div>
                <div><span className="text-gray-500">PIS:</span> <span className="font-semibold">R$ {nota.pis.toFixed(2)}</span></div>
                <div><span className="text-gray-500">COFINS:</span> <span className="font-semibold">R$ {nota.cofins.toFixed(2)}</span></div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TabVendas({ vendas, resumo }: { vendas: VendaPDV[]; resumo: any }) {
  const totalVendas = vendas.reduce((acc, v) => acc + v.total, 0);
  const ticketMedio = vendas.length > 0 ? totalVendas / vendas.length : 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <div className="text-sm text-gray-500">Total Vendas (últimas 50)</div>
          <div className="text-xl font-bold text-blue-700">R$ {totalVendas.toFixed(2)}</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <div className="text-sm text-gray-500">Ticket Médio</div>
          <div className="text-xl font-bold text-green-700">R$ {ticketMedio.toFixed(2)}</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <div className="text-sm text-gray-500">Total Vendas (sistema)</div>
          <div className="text-xl font-bold text-purple-700">R$ {(resumo.faturamento_total / 1000).toFixed(0)}k</div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">💰 Últimas Vendas PDV</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-2 font-medium text-gray-600">ID</th>
              <th className="text-left py-3 px-2 font-medium text-gray-600">Data</th>
              <th className="text-left py-3 px-2 font-medium text-gray-600">Cliente</th>
              <th className="text-right py-3 px-2 font-medium text-gray-600">Itens</th>
              <th className="text-right py-3 px-2 font-medium text-gray-600">Desconto</th>
              <th className="text-right py-3 px-2 font-medium text-gray-600">Total</th>
            </tr>
          </thead>
          <tbody>
            {vendas.slice(0, 20).map((v) => (
              <tr key={v.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-2 text-gray-500">{v.id}</td>
                <td className="py-3 px-2">{v.data}</td>
                <td className="py-3 px-2">{v.cliente || 'Consumidor'}</td>
                <td className="py-3 px-2 text-right">R$ {v.vlr_itens.toFixed(2)}</td>
                <td className="py-3 px-2 text-right text-red-500">{v.desconto > 0 ? `-R$ ${v.desconto.toFixed(2)}` : '-'}</td>
                <td className="py-3 px-2 text-right font-semibold">R$ {v.total.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TabSimulador() {
  const [faturamento, setFaturamento] = useState("90732");
  const [aliquotaSimples, setAliquotaSimples] = useState("14.7");
  const [aliquotaPresumido, setAliquotaPresumido] = useState("11.3");
  const [aliquotaReal, setAliquotaReal] = useState("15");

  const fat = parseFloat(faturamento) || 0;
  const simples = fat * (parseFloat(aliquotaSimples) / 100);
  const presumido = fat * 0.32 * (parseFloat(aliquotaPresumido) / 100);
  const real = fat * (parseFloat(aliquotaReal) / 100);

  const menor = Math.min(simples, presumido, real);
  let melhor = "Simples Nacional";
  if (menor === presumido) melhor = "Lucro Presumido";
  if (menor === real) melhor = "Lucro Real";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">🧮 Simulador de Regime Tributário</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Faturamento Mensal (R$)</label>
            <input type="number" value={faturamento} onChange={(e) => setFaturamento(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Simples (%)</label>
              <input type="number" step="0.1" value={aliquotaSimples} onChange={(e) => setAliquotaSimples(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Presumido (%)</label>
              <input type="number" step="0.1" value={aliquotaPresumido} onChange={(e) => setAliquotaPresumido(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Real (%)</label>
              <input type="number" step="0.1" value={aliquotaReal} onChange={(e) => setAliquotaReal(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">📊 Resultado</h3>
        <div className="space-y-3">
          <ResultadoLinha nome="Simples Nacional" valor={simples} melhor={menor === simples} />
          <ResultadoLinha nome="Lucro Presumido" valor={presumido} melhor={menor === presumido} />
          <ResultadoLinha nome="Lucro Real" valor={real} melhor={menor === real} />
          <div className="border-t border-gray-200 pt-3 mt-3">
            <div className="p-4 bg-green-50 rounded-lg border-2 border-green-200">
              <div className="text-sm text-green-600 font-medium">Melhor Regime</div>
              <div className="text-xl font-bold text-green-700">{melhor}</div>
              <div className="text-sm text-green-600 mt-1">Economia: R$ {(simples - menor).toFixed(2)}/mês = R$ {((simples - menor) * 12).toFixed(2)}/ano</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ResultadoLinha({ nome, valor, melhor }: { nome: string; valor: number; melhor: boolean }) {
  return (
    <div className={`p-3 rounded-lg ${melhor ? 'bg-green-50 border-2 border-green-300' : 'bg-gray-50 border border-gray-200'}`}>
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium">{nome}</span>
        <span className={`text-lg font-bold ${melhor ? 'text-green-700' : 'text-gray-700'}`}>R$ {valor.toFixed(2)}</span>
      </div>
    </div>
  );
}

function TabAnalise({ resumo, produtos }: { resumo: any; produtos: Produto[] }) {
  const totalCreditos = resumo.icms_credito + resumo.st_credito + resumo.ipi_credito + resumo.pis_credito + resumo.cofins_credito;
  const produtosSemNCM = produtos.filter(p => !p.ncm || p.ncm.trim() === '').length;
  const produtosSemCusto = produtos.filter(p => p.prc_custo <= 0).length;
  const produtosSemVenda = produtos.filter(p => p.prc_venda <= 0).length;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">🔍 Análise de Conformidade Fiscal</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <AnaliseCard titulo="Produtos s/ NCM" valor={produtosSemNCM} total={produtos.length} cor="red" />
          <AnaliseCard titulo="Produtos s/ Custo" valor={produtosSemCusto} total={produtos.length} cor="yellow" />
          <AnaliseCard titulo="Produtos s/ Preço" valor={produtosSemVenda} total={produtos.length} cor="orange" />
          <AnaliseCard titulo="Créditos Pendentes" valor={totalCreditos > 0 ? 1 : 0} total={1} cor="green" />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">⚠️ Alertas e Recomendações</h3>
        <div className="space-y-3">
          {produtosSemNCM > 0 && (
            <Alerta tipo="erro" texto={`${produtosSemNCM} produtos sem NCM cadastrado. NCM é obrigatório para notas fiscais.`} />
          )}
          {produtosSemCusto > 0 && (
            <Alerta tipo="aviso" texto={`${produtosSemCusto} produtos sem custo. Impossível calcular lucro real e impostos corretamente.`} />
          )}
          {resumo.pis_credito === 0 && resumo.cofins_credito === 0 && (
            <Alerta tipo="aviso" texto="PIS e COFINS com crédito zero. Verificar se notas de entrada estão com CST correto." />
          )}
          {totalCreditos > 0 && (
            <Alerta tipo="ok" texto={`R$ ${totalCreditos.toFixed(2)} em créditos fiscais disponíveis para abater.`} />
          )}
        </div>
      </div>
    </div>
  );
}

function AnaliseCard({ titulo, valor, total, cor }: { titulo: string; valor: number; total: number; cor: string }) {
  const cores: Record<string, string> = {
    red: "bg-red-50 border-red-200 text-red-700",
    yellow: "bg-yellow-50 border-yellow-200 text-yellow-700",
    orange: "bg-orange-50 border-orange-200 text-orange-700",
    green: "bg-green-50 border-green-200 text-green-700",
  };
  const percent = total > 0 ? (valor / total * 100).toFixed(1) : "0";
  return (
    <div className={`rounded-xl border-2 p-4 ${cores[cor]}`}>
      <div className="text-xs font-medium opacity-80">{titulo}</div>
      <div className="text-2xl font-bold mt-1">{valor}</div>
      <div className="text-xs opacity-70">{percent}% do total</div>
    </div>
  );
}

function Alerta({ tipo, texto }: { tipo: "erro" | "aviso" | "ok"; texto: string }) {
  const cores = {
    erro: "bg-red-50 border-red-200 text-red-700",
    aviso: "bg-yellow-50 border-yellow-200 text-yellow-700",
    ok: "bg-green-50 border-green-200 text-green-700",
  };
  const icones = { erro: "❌", aviso: "⚠️", ok: "✅" };
  return (
    <div className={`flex items-start gap-3 p-3 rounded-lg border ${cores[tipo]}`}>
      <span>{icones[tipo]}</span>
      <span className="text-sm">{texto}</span>
    </div>
  );
}
