"use client";

import { useState, useMemo } from "react";
import clienteData from "@/data/cliente_gourmet.json";
import {
  analisarProdutos,
  buscarNCMporCodigo,
  calcularEconomiaAnual,
  type AnaliseNCM,
} from "@/lib/analiseNCM";

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

const ITENS_POR_PAGINA = 15;

function formatarMoeda(valor: number): string {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function AnaliseNCMPage() {
  const produtos = clienteData.produtos as Produto[];

  const resultados = useMemo(() => {
    const produtosFormatados = produtos.map((p) => ({
      id: p.id,
      nome: p.nome,
      ncm: p.ncm,
      prc_venda: p.prc_venda,
      grupo: p.grupo,
    }));
    return analisarProdutos(produtosFormatados);
  }, [produtos]);

  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState<"todos" | "com_sugestao" | "alto_risco">("todos");
  const [pagina, setPagina] = useState(1);
  const [linhaExpandida, setLinhaExpandida] = useState<number | null>(null);

  const resultadosFiltrados = useMemo(() => {
    let filtrados = resultados;

    if (busca) {
      const buscaLower = busca.toLowerCase();
      filtrados = filtrados.filter(
        (r) =>
          r.nomeProduto.toLowerCase().includes(buscaLower) ||
          r.ncmAtual.includes(busca) ||
          (r.ncmSugerido && r.ncmSugerido.includes(busca))
      );
    }

    if (filtro === "com_sugestao") {
      filtrados = filtrados.filter((r) => r.ncmSugerido !== null);
    } else if (filtro === "alto_risco") {
      filtrados = filtrados.filter((r) => r.nivelRisco === "alto");
    }

    return [...filtrados].sort((a, b) => b.economiaMensal - a.economiaMensal);
  }, [resultados, busca, filtro]);

  const totalPaginas = Math.ceil(resultadosFiltrados.length / ITENS_POR_PAGINA);
  const itensPagina = resultadosFiltrados.slice(
    (pagina - 1) * ITENS_POR_PAGINA,
    pagina * ITENS_POR_PAGINA
  );

  const totalProdutos = resultados.length;
  const produtosComSugestao = resultados.filter((r) => r.ncmSugerido !== null).length;
  const percentualSugestao = totalProdutos > 0 ? ((produtosComSugestao / totalProdutos) * 100).toFixed(1) : "0";
  const economiaMensalTotal = resultados.reduce((acc, r) => acc + r.economiaMensal, 0);
  const economiaAnualTotal = calcularEconomiaAnual(economiaMensalTotal);

  const top5 = [...resultados]
    .filter((r) => r.economiaMensal > 0)
    .sort((a, b) => b.economiaMensal - a.economiaMensal)
    .slice(0, 5);

  const contagemRisco = {
    baixo: resultados.filter((r) => r.nivelRisco === "baixo").length,
    medio: resultados.filter((r) => r.nivelRisco === "medio").length,
    alto: resultados.filter((r) => r.nivelRisco === "alto").length,
  };

  const resumoPorGrupo = useMemo(() => {
    const grupos: Record<string, { total: number; economia: number }> = {};
    for (const r of resultados) {
      const produto = produtos.find((p) => p.id === r.produtoId);
      const grupo = produto?.grupo || "Outros";
      if (!grupos[grupo]) grupos[grupo] = { total: 0, economia: 0 };
      grupos[grupo].total++;
      grupos[grupo].economia += r.economiaMensal;
    }
    return Object.entries(grupos)
      .sort(([, a], [, b]) => b.economia - a.economia)
      .slice(0, 10);
  }, [resultados, produtos]);

  function toggleLinha(id: number) {
    setLinhaExpandida(linhaExpandida === id ? null : id);
  }

  return (
    <div className="max-w-[1400px] mx-auto space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Analise de NCM</h1>
        <p className="text-sm text-gray-500 mt-1">
          Identificacao de produtos com potencial de economia tributaria
        </p>
      </div>

      {/* Section 1: Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <p className="text-sm text-gray-500">Produtos Analisados</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{totalProdutos}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <p className="text-sm text-gray-500">Com Sugestao</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{produtosComSugestao}</p>
          <p className="text-xs text-gray-400 mt-1">{percentualSugestao}% do total</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <p className="text-sm text-gray-500">Economia Mensal</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{formatarMoeda(economiaMensalTotal)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <p className="text-sm text-gray-500">Economia Anual</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{formatarMoeda(economiaAnualTotal)}</p>
        </div>
      </div>

      {/* Main content with sidebar */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left column: Filter + Table */}
        <div className="flex-1 min-w-0 space-y-4">
          {/* Section 2: Filter Bar */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              {/* Search input */}
              <div className="relative flex-1 w-full">
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <input
                  type="text"
                  placeholder="Buscar por nome ou NCM..."
                  value={busca}
                  onChange={(e) => {
                    setBusca(e.target.value);
                    setPagina(1);
                  }}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
              {/* Filter pills */}
              <div className="flex gap-2">
                <button
                  onClick={() => { setFiltro("todos"); setPagina(1); }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filtro === "todos"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  Todos
                </button>
                <button
                  onClick={() => { setFiltro("com_sugestao"); setPagina(1); }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filtro === "com_sugestao"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  Com Sugestao
                </button>
                <button
                  onClick={() => { setFiltro("alto_risco"); setPagina(1); }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filtro === "alto_risco"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  Alto Risco
                </button>
              </div>
            </div>
          </div>

          {/* Section 3: Main Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-xs font-medium text-gray-500 uppercase">
                    <th className="text-left py-3 px-4 rounded-l-lg">Produto</th>
                    <th className="text-left py-3 px-4">NCM Atual</th>
                    <th className="text-left py-3 px-4">NCM Sugerida</th>
                    <th className="text-right py-3 px-4">Aliq Atual</th>
                    <th className="text-right py-3 px-4">Aliq Sugerida</th>
                    <th className="text-right py-3 px-4">Economia</th>
                    <th className="text-center py-3 px-4 rounded-r-lg">Risco</th>
                  </tr>
                </thead>
                <tbody>
                  {itensPagina.map((r) => (
                    <>
                      <tr
                        key={r.produtoId}
                        onClick={() => toggleLinha(r.produtoId)}
                        className="border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors"
                      >
                        <td className="py-3 px-4 font-medium text-gray-900 max-w-[200px] truncate">
                          {r.nomeProduto}
                        </td>
                        <td className="py-3 px-4 text-gray-600 font-mono text-xs">
                          {r.ncmAtual}
                        </td>
                        <td className="py-3 px-4 font-mono text-xs">
                          {r.ncmSugerido ? (
                            <span className="text-blue-600">{r.ncmSugerido}</span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right text-gray-600">
                          {r.aliquotaAtual}%
                        </td>
                        <td className="py-3 px-4 text-right">
                          {r.ncmSugerido ? (
                            <span className="text-blue-600">{r.aliquotaSugerida}%</span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {r.economiaMensal > 0 ? (
                            <span className="text-green-600 font-medium">
                              {formatarMoeda(r.economiaMensal)}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <RiscoBadge nivel={r.nivelRisco} />
                        </td>
                      </tr>
                      {linhaExpandida === r.produtoId && (
                        <tr key={`${r.produtoId}-detail`}>
                          <td colSpan={7} className="p-0">
                            <DetalheExpandido resultado={r} onFechar={() => setLinhaExpandida(null)} />
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                  {itensPagina.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-gray-400">
                        Nenhum resultado encontrado
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPaginas > 1 && (
              <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-100">
                <span className="text-sm text-gray-500">
                  {resultadosFiltrados.length} resultados - Pagina {pagina} de {totalPaginas}
                </span>
                <div className="flex gap-1">
                  <button
                    onClick={() => setPagina((p) => Math.max(1, p - 1))}
                    disabled={pagina === 1}
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Anterior
                  </button>
                  {Array.from({ length: Math.min(5, totalPaginas) }, (_, i) => {
                    let num: number;
                    if (totalPaginas <= 5) {
                      num = i + 1;
                    } else if (pagina <= 3) {
                      num = i + 1;
                    } else if (pagina >= totalPaginas - 2) {
                      num = totalPaginas - 4 + i;
                    } else {
                      num = pagina - 2 + i;
                    }
                    return (
                      <button
                        key={num}
                        onClick={() => setPagina(num)}
                        className={`px-3 py-1.5 text-sm rounded-lg ${
                          num === pagina
                            ? "bg-blue-600 text-white"
                            : "border border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        {num}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
                    disabled={pagina === totalPaginas}
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Proxima
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Section 5: Right Sidebar */}
        <div className="w-full lg:w-80 flex-shrink-0 space-y-4">
          {/* Top 5 Maiores Economias */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Top 5 Maiores Economias</h3>
            <div className="space-y-3">
              {top5.length === 0 && (
                <p className="text-sm text-gray-400">Nenhuma economia identificada</p>
              )}
              {top5.map((r, i) => (
                <div
                  key={r.produtoId}
                  onClick={() => toggleLinha(r.produtoId)}
                  className="flex items-start gap-2 p-2 rounded-lg hover:bg-gray-50 cursor-pointer"
                >
                  <span className="text-xs font-bold text-gray-400 mt-0.5 w-4">{i + 1}.</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{r.nomeProduto}</p>
                    <p className="text-xs text-gray-500">
                      {r.ncmAtual} {r.ncmSugerido ? `> ${r.ncmSugerido}` : ""}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-green-600 whitespace-nowrap">
                    {formatarMoeda(r.economiaMensal)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Por Nivel de Risco */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Por Nivel de Risco</h3>
            <div className="space-y-3">
              <BarraRisco
                label="Baixo"
                count={contagemRisco.baixo}
                total={totalProdutos}
                cor="bg-green-500"
              />
              <BarraRisco
                label="Medio"
                count={contagemRisco.medio}
                total={totalProdutos}
                cor="bg-yellow-500"
              />
              <BarraRisco
                label="Alto"
                count={contagemRisco.alto}
                total={totalProdutos}
                cor="bg-red-500"
              />
            </div>
          </div>

          {/* Por Grupo */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Por Grupo</h3>
            <div className="space-y-2">
              {resumoPorGrupo.map(([grupo, dados]) => (
                <div key={grupo} className="flex justify-between items-center text-sm">
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 truncate">{grupo}</p>
                    <p className="text-xs text-gray-500">{dados.total} produtos</p>
                  </div>
                  <span className="text-sm font-semibold text-green-600 whitespace-nowrap">
                    {formatarMoeda(dados.economia)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function RiscoBadge({ nivel }: { nivel: "baixo" | "medio" | "alto" }) {
  const estilos: Record<string, string> = {
    baixo: "bg-green-100 text-green-700",
    medio: "bg-yellow-100 text-yellow-700",
    alto: "bg-red-100 text-red-700",
  };
  const labels: Record<string, string> = {
    baixo: "Baixo",
    medio: "Medio",
    alto: "Alto",
  };
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${estilos[nivel]}`}>
      {labels[nivel]}
    </span>
  );
}

function BarraRisco({
  label,
  count,
  total,
  cor,
}: {
  label: string;
  count: number;
  total: number;
  cor: string;
}) {
  const percent = total > 0 ? (count / total) * 100 : 0;
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="font-medium text-gray-700">{label}</span>
        <span className="text-gray-500">
          {count} ({percent.toFixed(0)}%)
        </span>
      </div>
      <div className="h-2 rounded-full bg-gray-100">
        <div className={`h-full rounded-full ${cor}`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

function DetalheExpandido({
  resultado,
  onFechar,
}: {
  resultado: AnaliseNCM;
  onFechar: () => void;
}) {
  const ncmAtualInfo = buscarNCMporCodigo(resultado.ncmAtual.replace(/\D/g, ""));
  const ncmSugeridoInfo = resultado.ncmSugerido
    ? buscarNCMporCodigo(resultado.ncmSugerido.replace(/\D/g, ""))
    : null;

  return (
    <div className="bg-gray-50 border-t border-b border-gray-100 px-6 py-5">
      <div className="flex justify-between items-start mb-4">
        <h4 className="text-sm font-semibold text-gray-900">{resultado.nomeProduto}</h4>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onFechar();
          }}
          className="text-gray-400 hover:text-gray-600 p-1"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* NCM Atual */}
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            NCM Atual
          </h5>
          <div className="space-y-2">
            <DetalheLinha label="Codigo" valor={resultado.ncmAtual} />
            <DetalheLinha label="Descricao" valor={ncmAtualInfo?.descricao || "N/A"} />
            <DetalheLinha label="ICMS %" valor={`${resultado.aliquotaAtual}%`} />
            <DetalheLinha label="IPI %" valor={`${ncmAtualInfo?.aliquotaIPI ?? 0}%`} />
            <DetalheLinha label="ST" valor={ncmAtualInfo?.stObrigatorio ? "Obrigatorio" : "Nao"} />
          </div>
        </div>

        {/* NCM Sugerida */}
        <div className="bg-white rounded-lg p-4 border border-blue-200">
          <h5 className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-3">
            NCM Sugerida
          </h5>
          {ncmSugeridoInfo ? (
            <div className="space-y-2">
              <DetalheLinha label="Codigo" valor={resultado.ncmSugerido!} valorClassName="text-blue-600 font-semibold" />
              <DetalheLinha label="Descricao" valor={ncmSugeridoInfo.descricao} />
              <DetalheLinha label="ICMS %" valor={`${resultado.aliquotaSugerida}%`} />
              <DetalheLinha label="IPI %" valor={`${ncmSugeridoInfo.aliquotaIPI}%`} />
              <DetalheLinha label="ST" valor={ncmSugeridoInfo.stObrigatorio ? "Obrigatorio" : "Nao"} />
            </div>
          ) : (
            <p className="text-sm text-gray-400">Nenhuma sugestao disponivel</p>
          )}
        </div>
      </div>

      {/* Bottom: Recommendation + Risk + Annual Savings */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg p-4 border border-gray-200 md:col-span-2">
          <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Recomendacao
          </h5>
          <p className="text-sm text-gray-600 leading-relaxed">{resultado.observacao}</p>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200 space-y-2">
          <DetalheLinha
            label="Nivel de Risco"
            valor={resultado.nivelRisco.charAt(0).toUpperCase() + resultado.nivelRisco.slice(1)}
          />
          <DetalheLinha
            label="Economia Mensal"
            valor={formatarMoeda(resultado.economiaMensal)}
            valorClassName="text-green-600 font-semibold"
          />
          <DetalheLinha
            label="Economia Anual"
            valor={formatarMoeda(calcularEconomiaAnual(resultado.economiaMensal))}
            valorClassName="text-green-600 font-semibold"
          />
        </div>
      </div>
    </div>
  );
}

function DetalheLinha({
  label,
  valor,
  valorClassName = "",
}: {
  label: string;
  valor: string;
  valorClassName?: string;
}) {
  return (
    <div className="flex justify-between items-start gap-2">
      <span className="text-xs text-gray-500">{label}</span>
      <span className={`text-sm text-right ${valorClassName || "text-gray-900"}`}>{valor}</span>
    </div>
  );
}
