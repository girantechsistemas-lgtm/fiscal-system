"use client";

import { useState, useEffect, useMemo } from "react";
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

const ITENS_POR_PAGINA = 20;

export default function AnaliseNCMPage() {
  const produtos = clienteData.produtos as Produto[];
  const [resultados, setResultados] = useState<AnaliseNCM[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState("");
  const [pagina, setPagina] = useState(1);
  const [produtoSelecionado, setProdutoSelecionado] = useState<AnaliseNCM | null>(null);
  const [ordenacao, setOrdenacao] = useState<"economiaMensal" | "economiaPercentual" | "nivelRisco">("economiaMensal");

  useEffect(() => {
    const produtosFormatados = produtos.map((p) => ({
      id: p.id,
      nome: p.nome,
      ncm: p.ncm,
      prc_venda: p.prc_venda,
      grupo: p.grupo,
    }));
    const analise = analisarProdutos(produtosFormatados);
    setResultados(analise);
    setCarregando(false);
  }, [produtos]);

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

    return [...filtrados].sort((a, b) => {
      if (ordenacao === "economiaMensal") return b.economiaMensal - a.economiaMensal;
      if (ordenacao === "economiaPercentual") return b.economiaPercentual - a.economiaPercentual;
      const riscoOrdem: Record<string, number> = { alto: 3, medio: 2, baixo: 1 };
      return riscoOrdem[b.nivelRisco] - riscoOrdem[a.nivelRisco];
    });
  }, [resultados, busca, ordenacao]);

  const totalPaginas = Math.ceil(resultadosFiltrados.length / ITENS_POR_PAGINA);
  const itensPagina = resultadosFiltrados.slice(
    (pagina - 1) * ITENS_POR_PAGINA,
    pagina * ITENS_POR_PAGINA
  );

  const totalProdutos = resultados.length;
  const produtosComSugestao = resultados.filter((r) => r.ncmSugerido !== null).length;
  const economiaMensalTotal = resultados.reduce((acc, r) => acc + r.economiaMensal, 0);
  const economiaAnualTotal = calcularEconomiaAnual(economiaMensalTotal);

  const top10 = [...resultados]
    .filter((r) => r.economiaMensal > 0)
    .sort((a, b) => b.economiaMensal - a.economiaMensal)
    .slice(0, 10);

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

  function exportarRelatorio() {
    const relatorio = {
      dataGeracao: new Date().toISOString(),
      empresa: clienteData.empresa,
      resumo: {
        totalProdutos,
        produtosComSugestao,
        economiaMensalTotal,
        economiaAnualTotal,
      },
      resultados,
    };
    const blob = new Blob([JSON.stringify(relatorio, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `relatorio-ncm-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function formatarMoeda(valor: number): string {
    return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }

  if (carregando) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Analisando produtos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Analise de NCM - Otimizacao Tributaria</h1>
        <p className="text-sm text-gray-500 mt-1">Identificacao de produtos com potencial de economia</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <SummaryCard titulo="Produtos Analisados" valor={String(totalProdutos)} subtitulo="Total na base" cor="blue" />
        <SummaryCard titulo="Com Sugestao" valor={String(produtosComSugestao)} subtitulo={`${totalProdutos > 0 ? ((produtosComSugestao / totalProdutos) * 100).toFixed(1) : 0}% do total`} cor="green" />
        <SummaryCard titulo="Economia Mensal" valor={formatarMoeda(economiaMensalTotal)} subtitulo="Estimativa" cor="emerald" />
        <SummaryCard titulo="Economia Anual" valor={formatarMoeda(economiaAnualTotal)} subtitulo="Projeção 12 meses" cor="purple" />
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 min-w-0">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
              <h2 className="font-semibold text-gray-900">Produtos com Sugestao de Alteracao</h2>
              <div className="flex items-center gap-2">
                <select
                  value={ordenacao}
                  onChange={(e) => {
                    setOrdenacao(e.target.value as typeof ordenacao);
                    setPagina(1);
                  }}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                >
                  <option value="economiaMensal">Maior Economia Mensal</option>
                  <option value="economiaPercentual">Maior Economia %</option>
                  <option value="nivelRisco">Maior Risco</option>
                </select>
                <input
                  type="text"
                  placeholder="Buscar por nome ou NCM..."
                  value={busca}
                  onChange={(e) => {
                    setBusca(e.target.value);
                    setPagina(1);
                  }}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 w-56"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2.5 px-2 font-medium text-gray-600">ID</th>
                    <th className="text-left py-2.5 px-2 font-medium text-gray-600">Produto</th>
                    <th className="text-left py-2.5 px-2 font-medium text-gray-600">NCM Atual</th>
                    <th className="text-left py-2.5 px-2 font-medium text-gray-600">NCM Sugerido</th>
                    <th className="text-right py-2.5 px-2 font-medium text-gray-600">Aliq. Atual</th>
                    <th className="text-right py-2.5 px-2 font-medium text-gray-600">Aliq. Sugerida</th>
                    <th className="text-right py-2.5 px-2 font-medium text-gray-600">Economia %</th>
                    <th className="text-center py-2.5 px-2 font-medium text-gray-600">Risco</th>
                    <th className="text-right py-2.5 px-2 font-medium text-gray-600">Economia Mensal</th>
                  </tr>
                </thead>
                <tbody>
                  {itensPagina.map((r) => (
                    <tr
                      key={r.produtoId}
                      onClick={() => setProdutoSelecionado(r)}
                      className={`border-b border-gray-100 cursor-pointer transition-colors ${
                        r.ncmSugerido ? "bg-green-50/50 hover:bg-green-100/70" : "hover:bg-gray-50"
                      } ${produtoSelecionado?.produtoId === r.produtoId ? "ring-2 ring-blue-500" : ""}`}
                    >
                      <td className="py-2.5 px-2 text-gray-500">{r.produtoId}</td>
                      <td className="py-2.5 px-2 font-medium text-gray-900 max-w-[200px] truncate">{r.nomeProduto}</td>
                      <td className="py-2.5 px-2 text-gray-600 font-mono text-xs">{r.ncmAtual}</td>
                      <td className="py-2.5 px-2 font-mono text-xs">
                        {r.ncmSugerido ? (
                          <span className="text-blue-600">{r.ncmSugerido}</span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="py-2.5 px-2 text-right text-gray-600">{r.aliquotaAtual}%</td>
                      <td className="py-2.5 px-2 text-right">
                        {r.ncmSugerido ? (
                          <span className="text-blue-600">{r.aliquotaSugerida}%</span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="py-2.5 px-2 text-right">
                        {r.economiaPercentual > 0 ? (
                          <span className="text-green-600 font-medium">{r.economiaPercentual.toFixed(1)}%</span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="py-2.5 px-2 text-center">
                        <RiskBadge nivel={r.nivelRisco} />
                      </td>
                      <td className="py-2.5 px-2 text-right font-medium">
                        {r.economiaMensal > 0 ? (
                          <span className="text-green-700">{formatarMoeda(r.economiaMensal)}</span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {itensPagina.length === 0 && (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-gray-400">
                        Nenhum resultado encontrado
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {totalPaginas > 1 && (
              <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-200">
                <span className="text-sm text-gray-500">
                  {resultadosFiltrados.length} resultados - Pagina {pagina} de {totalPaginas}
                </span>
                <div className="flex gap-1">
                  <button
                    onClick={() => setPagina((p) => Math.max(1, p - 1))}
                    disabled={pagina === 1}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
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
                        className={`px-3 py-1 text-sm rounded-lg ${
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
                    className="px-3 py-1 text-sm border border-gray-300 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Proxima
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="w-full lg:w-80 flex-shrink-0 space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-3">Top 10 Maiores Economias</h3>
            <div className="space-y-2">
              {top10.length === 0 && (
                <p className="text-sm text-gray-400">Nenhuma economia identificada</p>
              )}
              {top10.map((r, i) => (
                <div
                  key={r.produtoId}
                  onClick={() => setProdutoSelecionado(r)}
                  className="flex items-start gap-2 p-2 rounded-lg hover:bg-gray-50 cursor-pointer"
                >
                  <span className="text-xs font-bold text-gray-400 mt-0.5 w-4">{i + 1}.</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{r.nomeProduto}</p>
                    <p className="text-xs text-gray-500">{r.ncmAtual} {r.ncmSugerido ? `> ${r.ncmSugerido}` : ""}</p>
                  </div>
                  <span className="text-sm font-semibold text-green-700 whitespace-nowrap">
                    {formatarMoeda(r.economiaMensal)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-3">Produtos por Nivel de Risco</h3>
            <div className="space-y-3">
              <RiskRow label="Baixo" count={contagemRisco.baixo} total={totalProdutos} cor="green" />
              <RiskRow label="Medio" count={contagemRisco.medio} total={totalProdutos} cor="yellow" />
              <RiskRow label="Alto" count={contagemRisco.alto} total={totalProdutos} cor="red" />
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-3">Resumo por Grupo</h3>
            <div className="space-y-2">
              {resumoPorGrupo.map(([grupo, dados]) => (
                <div key={grupo} className="flex justify-between items-center text-sm">
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 truncate">{grupo}</p>
                    <p className="text-xs text-gray-500">{dados.total} produtos</p>
                  </div>
                  <span className="text-sm font-semibold text-green-700 whitespace-nowrap">
                    {formatarMoeda(dados.economia)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={exportarRelatorio}
            className="w-full px-4 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            Exportar Relatorio
          </button>
        </div>
      </div>

      {produtoSelecionado && (
        <div className="mt-6 bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{produtoSelecionado.nomeProduto}</h2>
              <p className="text-sm text-gray-500">Detalhes da analise tributaria</p>
            </div>
            <button
              onClick={() => setProdutoSelecionado(null)}
              className="text-gray-400 hover:text-gray-600 text-sm"
            >
              Fechar
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">NCM Atual</h3>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <DetailRow label="Codigo" valor={produtoSelecionado.ncmAtual} />
                <DetailRow label="Aliquota ICMS" valor={`${produtoSelecionado.aliquotaAtual}%`} />
                <DetailRow label="Produto ID" valor={String(produtoSelecionado.produtoId)} />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">NCM Sugerido</h3>
              <div className="bg-blue-50 rounded-lg p-4 space-y-2">
                <DetailRow
                  label="Codigo"
                  valor={produtoSelecionado.ncmSugerido || "N/A"}
                  valorClassName={produtoSelecionado.ncmSugerido ? "text-blue-600 font-semibold" : ""}
                />
                <DetailRow label="Aliquota ICMS" valor={`${produtoSelecionado.aliquotaSugerida}%`} />
                <DetailRow label="Descricao" valor={produtoSelecionado.descricaoNCMSugerido} />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Impacto Financeiro</h3>
              <div className="bg-green-50 rounded-lg p-4 space-y-2">
                <DetailRow label="Economia Mensal" valor={formatarMoeda(produtoSelecionado.economiaMensal)} valorClassName="text-green-700 font-semibold" />
                <DetailRow label="Economia Anual" valor={formatarMoeda(calcularEconomiaAnual(produtoSelecionado.economiaMensal))} valorClassName="text-green-700 font-semibold" />
                <DetailRow label="Reducao de Aliquota" valor={`${produtoSelecionado.economiaPercentual.toFixed(1)}%`} />
                <DetailRow label="Nivel de Risco" valor={produtoSelecionado.nivelRisco.charAt(0).toUpperCase() + produtoSelecionado.nivelRisco.slice(1)} />
              </div>
            </div>
          </div>

          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Recomendacao</h4>
            <p className="text-sm text-gray-600 leading-relaxed">{produtoSelecionado.observacao}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryCard({
  titulo,
  valor,
  subtitulo,
  cor,
}: {
  titulo: string;
  valor: string;
  subtitulo: string;
  cor: string;
}) {
  const cores: Record<string, string> = {
    blue: "bg-blue-50 border-blue-200",
    green: "bg-green-50 border-green-200",
    emerald: "bg-emerald-50 border-emerald-200",
    purple: "bg-purple-50 border-purple-200",
  };
  return (
    <div className={`rounded-xl border-2 p-4 ${cores[cor] || cores.blue}`}>
      <div className="text-xs font-medium text-gray-600">{titulo}</div>
      <div className="text-xl font-bold text-gray-900 mt-1">{valor}</div>
      <div className="text-xs text-gray-500 mt-0.5">{subtitulo}</div>
    </div>
  );
}

function RiskBadge({ nivel }: { nivel: "baixo" | "medio" | "alto" }) {
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
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${estilos[nivel]}`}>
      {labels[nivel]}
    </span>
  );
}

function RiskRow({
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
  const cores: Record<string, { bg: string; bar: string }> = {
    green: { bg: "bg-green-50", bar: "bg-green-500" },
    yellow: { bg: "bg-yellow-50", bar: "bg-yellow-500" },
    red: { bg: "bg-red-50", bar: "bg-red-500" },
  };
  const estilo = cores[cor] || cores.green;
  const percent = total > 0 ? (count / total) * 100 : 0;
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="font-medium text-gray-700">{label}</span>
        <span className="text-gray-500">{count} ({percent.toFixed(0)}%)</span>
      </div>
      <div className={`h-2 rounded-full ${estilo.bg}`}>
        <div className={`h-full rounded-full ${estilo.bar}`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

function DetailRow({
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
