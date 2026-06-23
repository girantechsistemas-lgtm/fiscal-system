"use client";

import { useState, useMemo, useCallback, useRef } from "react";
import clienteData from "@/data/cliente_gourmet.json";
import {
  analisarProdutos,
  buscarNCMporCodigo,
  calcularEconomiaAnual,
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

type StatusProduto = "vazio" | "invalido" | "com_sugestao" | "ok";

interface ProdutoComAnalise {
  produto: Produto;
  status: StatusProduto;
  ncmSugerido: string | null;
  descricaoSugerida: string;
  aliquotaAtual: number;
  aliquotaSugerida: number;
  economiaMensal: number;
  economiaAnual: number;
  nivelRisco: "baixo" | "medio" | "alto";
  observacao: string;
  temSTAtual: boolean;
  temSTSugerido: boolean;
}

const ITENS_POR_PAGINA = 15;

function formatarMoeda(valor: number): string {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatarPercentual(valor: number): string {
  return `${valor.toFixed(1)}%`;
}

const NCM_SUGESTOES_VAZIOS: Record<string, Record<string, { ncm: string; desc: string }>> = {
  INSUMOS: {
    AGUA: { ncm: "34022000", desc: "Detergentes orgânicos para lavagem" },
    ALCOOL: { ncm: "22072010", desc: "Álcool etílico não desnaturado" },
    AMARULA: { ncm: "22087000", desc: "Licores" },
    SANITARIA: { ncm: "34022000", desc: "Detergentes orgânicos para lavagem" },
    BICARBONATO: { ncm: "21069090", desc: "Outras preparações alimentícias" },
    BOLACHA: { ncm: "19059090", desc: "Outros produtos de padaria e pastelaria" },
    BOMBRIL: { ncm: "96035000", desc: "Escovas e brochas para limpeza" },
    DESINFETANTE: { ncm: "34022000", desc: "Detergentes orgânicos para lavagem" },
    DESEMGORDURANTE: { ncm: "34022000", desc: "Detergentes orgânicos para lavagem" },
    DESINCRUSTANTE: { ncm: "34022000", desc: "Detergentes orgânicos para lavagem" },
    DISCO: { ncm: "96035000", desc: "Escovas e brochas para limpeza" },
    CANUDO: { ncm: "39232900", desc: "Outros sacos e sacolas de plástico" },
    COPO: { ncm: "39241000", desc: "Artigos para serviço de mesa" },
    OLEO: { ncm: "15111000", desc: "Óleo de soja refinado" },
    PARMESAO: { ncm: "04069000", desc: "Outros queijos" },
    SUCO: { ncm: "20098900", desc: "Outros sumos de frutas" },
    CITRUS: { ncm: "20098900", desc: "Outros sumos de frutas" },
    BID: { ncm: "20098900", desc: "Outros sumos de frutas" },
    CARVÃO: { ncm: "44029000", desc: "Outros carvões" },
    CO2: { ncm: "28111900", desc: "Outros gases inorgânicos" },
    BROTOS: { ncm: "07099000", desc: "Outras hortaliças frescas" },
    DOSADOR: { ncm: "84248990", desc: "Outros aparelhos mecânicos de dispersão" },
    REFRESCO: { ncm: "20098900", desc: "Outros sumos de frutas" },
  },
  "BEBIDAS EM GERAL": {
    LATA: { ncm: "22029100", desc: "Refrigerantes" },
  },
};

function sugerirNCMVazio(produto: Produto): { ncm: string; desc: string } | null {
  const grupo = produto.grupo;
  const nome = produto.nome.toUpperCase();

  const sugestoesGrupo = NCM_SUGESTOES_VAZIOS[grupo];
  if (sugestoesGrupo) {
    for (const [chave, valor] of Object.entries(sugestoesGrupo)) {
      if (nome.includes(chave)) {
        return valor;
      }
    }
  }

  for (const [grupoDb, sugestoes] of Object.entries(NCM_SUGESTOES_VAZIOS)) {
    if (grupoDb === grupo) continue;
    for (const [chave, valor] of Object.entries(sugestoes)) {
      if (nome.includes(chave)) {
        return valor;
      }
    }
  }

  if (grupo === "INSUMOS") {
    if (nome.includes("DESATIVAR")) return null;
    return { ncm: "34011900", desc: "Sabões e detergentes orgânicos" };
  }

  return null;
}

function classificarRisco(
  ncmAtual: string,
  ncmSugerido: string
): "baixo" | "medio" | "alto" {
  const capAtual = parseInt(ncmAtual.substring(0, 2), 10);
  const capSugerido = parseInt(ncmSugerido.substring(0, 2), 10);
  const diferenca = Math.abs(capAtual - capSugerido);

  if (diferenca === 0) return "baixo";
  if (diferenca <= 2) return "medio";
  return "alto";
}

export default function AnaliseTributariaPage() {
  const produtos = clienteData.produtos as Produto[];
  const [abaAtiva, setAbaAtiva] = useState<"problemas" | "sugestoes" | "grupos">("problemas");
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [linhaExpandida, setLinhaExpandida] = useState<number | null>(null);
  const [busca, setBusca] = useState("");

  const analiseProdutos = useMemo(() => {
    const resultados: ProdutoComAnalise[] = [];

    const produtosParaAnalise = produtos
      .filter((p) => p.ncm !== "")
      .map((p) => ({
        id: p.id,
        nome: p.nome,
        ncm: p.ncm,
        prc_venda: p.prc_venda,
        grupo: p.grupo,
      }));

    const analiseResultados = analisarProdutos(produtosParaAnalise);

    const mapaAnalise = new Map<number, (typeof analiseResultados)[0]>();
    for (const r of analiseResultados) {
      mapaAnalise.set(r.produtoId, r);
    }

    for (const produto of produtos) {
      if (produto.nome.startsWith("DESATIVAR")) continue;

      if (produto.ncm === "") {
        const sugestao = sugerirNCMVazio(produto);
        const ncmInfo = sugestao ? buscarNCMporCodigo(sugestao.ncm) : null;

        resultados.push({
          produto,
          status: "vazio",
          ncmSugerido: sugestao?.ncm || null,
          descricaoSugerida: sugestao?.desc || "Nenhuma sugestão disponível",
          aliquotaAtual: 0,
          aliquotaSugerida: ncmInfo?.aliquotaICMS || 0,
          economiaMensal: 0,
          economiaAnual: 0,
          nivelRisco: "alto",
          observacao: sugestao
            ? `Produto sem NCM cadastrado. NCM sugerido: ${sugestao.ncm} - ${sugestao.desc}`
            : "Produto sem NCM. Necessário cadastro manual do NCM correto.",
          temSTAtual: false,
          temSTSugerido: ncmInfo?.stObrigatorio || false,
        });
        continue;
      }

      const analise = mapaAnalise.get(produto.id);

      if (!analise || !analise.ncmSugerido) {
        const ncmInfo = buscarNCMporCodigo(produto.ncm.replace(/\D/g, ""));
        resultados.push({
          produto,
          status: "invalido",
          ncmSugerido: null,
          descricaoSugerida: "NCM não encontrado na base de dados",
          aliquotaAtual: 0,
          aliquotaSugerida: 0,
          economiaMensal: 0,
          economiaAnual: 0,
          nivelRisco: "alto",
          observacao: "NCM não encontrado na base de dados. Verificar cadastro.",
          temSTAtual: false,
          temSTSugerido: false,
        });
        continue;
      }

      if (analise.economiaMensal > 0) {
        const ncmAtualInfo = buscarNCMporCodigo(produto.ncm.replace(/\D/g, ""));
        const ncmSugInfo = buscarNCMporCodigo(analise.ncmSugerido);

        resultados.push({
          produto,
          status: "com_sugestao",
          ncmSugerido: analise.ncmSugerido,
          descricaoSugerida: analise.descricaoNCMSugerido,
          aliquotaAtual: analise.aliquotaAtual,
          aliquotaSugerida: analise.aliquotaSugerida,
          economiaMensal: analise.economiaMensal,
          economiaAnual: calcularEconomiaAnual(analise.economiaMensal),
          nivelRisco: analise.nivelRisco,
          observacao: analise.observacao,
          temSTAtual: ncmAtualInfo?.stObrigatorio || false,
          temSTSugerido: ncmSugInfo?.stObrigatorio || false,
        });
      } else {
        resultados.push({
          produto,
          status: "ok",
          ncmSugerido: null,
          descricaoSugerida: "",
          aliquotaAtual: analise.aliquotaAtual,
          aliquotaSugerida: analise.aliquotaAtual,
          economiaMensal: 0,
          economiaAnual: 0,
          nivelRisco: "baixo",
          observacao: "Produto já possui a melhor alíquota disponível.",
          temSTAtual: false,
          temSTSugerido: false,
        });
      }
    }

    return resultados;
  }, [produtos]);

  const produtosVazios = useMemo(
    () => analiseProdutos.filter((p) => p.status === "vazio"),
    [analiseProdutos]
  );

  const produtosInvalidos = useMemo(
    () => analiseProdutos.filter((p) => p.status === "invalido"),
    [analiseProdutos]
  );

  const produtosComSugestao = useMemo(
    () => analiseProdutos.filter((p) => p.status === "com_sugestao"),
    [analiseProdutos]
  );

  const totalEconomiaMensal = useMemo(
    () => produtosComSugestao.reduce((acc, p) => acc + p.economiaMensal, 0),
    [produtosComSugestao]
  );

  const totalEconomiaAnual = useMemo(
    () => calcularEconomiaAnual(totalEconomiaMensal),
    [totalEconomiaMensal]
  );

  const produtosProblemas = useMemo(() => {
    return analiseProdutos
      .filter((p) => p.status === "vazio" || p.status === "invalido" || p.status === "com_sugestao")
      .sort((a, b) => a.produto.grupo.localeCompare(b.produto.grupo));
  }, [analiseProdutos]);

  const produtosProblemasFiltrados = useMemo(() => {
    if (!busca) return produtosProblemas;
    const buscaLower = busca.toLowerCase();
    return produtosProblemas.filter(
      (p) =>
        p.produto.nome.toLowerCase().includes(buscaLower) ||
        p.produto.grupo.toLowerCase().includes(buscaLower) ||
        p.produto.ncm.includes(busca)
    );
  }, [produtosProblemas, busca]);

  const sugestoesFiltradas = useMemo(() => {
    let filtrados = produtosComSugestao;
    if (busca) {
      const buscaLower = busca.toLowerCase();
      filtrados = filtrados.filter(
        (p) =>
          p.produto.nome.toLowerCase().includes(buscaLower) ||
          p.ncmSugerido?.includes(busca) ||
          p.produto.ncm.includes(busca)
      );
    }
    return [...filtrados].sort((a, b) => b.economiaMensal - a.economiaMensal);
  }, [produtosComSugestao, busca]);

  const totalPaginas = Math.ceil(sugestoesFiltradas.length / ITENS_POR_PAGINA);
  const itensPagina = sugestoesFiltradas.slice(
    (paginaAtual - 1) * ITENS_POR_PAGINA,
    paginaAtual * ITENS_POR_PAGINA
  );

  const resumoGrupos = useMemo(() => {
    const grupos: Record<
      string,
      {
        total: number;
        comProblema: number;
        economiaMensal: number;
        aliquotaMedia: number;
        totalAliquota: number;
        produtosComEconomia: Array<{ nome: string; economia: number }>;
      }
    > = {};

    for (const item of analiseProdutos) {
      const grupo = item.produto.grupo;
      if (!grupos[grupo]) {
        grupos[grupo] = {
          total: 0,
          comProblema: 0,
          economiaMensal: 0,
          aliquotaMedia: 0,
          totalAliquota: 0,
          produtosComEconomia: [],
        };
      }
      grupos[grupo].total++;
      if (item.status !== "ok") {
        grupos[grupo].comProblema++;
      }
      grupos[grupo].economiaMensal += item.economiaMensal;
      if (item.aliquotaAtual > 0) {
        grupos[grupo].totalAliquota += item.aliquotaAtual;
      }
      if (item.economiaMensal > 0) {
        grupos[grupo].produtosComEconomia.push({
          nome: item.produto.nome,
          economia: item.economiaMensal,
        });
      }
    }

    for (const grupo of Object.values(grupos)) {
      const comAliquota = analiseProdutos.filter(
        (p) => p.produto.grupo === grupo.toString() && p.aliquotaAtual > 0
      );
      grupo.aliquotaMedia =
        comAliquota.length > 0
          ? comAliquota.reduce((acc, p) => acc + p.aliquotaAtual, 0) / comAliquota.length
          : 0;
    }

    return Object.entries(grupos)
      .sort(([, a], [, b]) => b.economiaMensal - a.economiaMensal)
      .map(([nome, dados]) => ({
        nome,
        ...dados,
        produtosComEconomia: dados.produtosComEconomia
          .sort((a, b) => b.economia - a.economia)
          .slice(0, 3),
      }));
  }, [analiseProdutos]);

  const toggleLinha = useCallback(
    (id: number) => {
      setLinhaExpandida(linhaExpandida === id ? null : id);
    },
    [linhaExpandida]
  );

  const exportarRelatorio = useCallback(() => {
    const relatorio = {
      dataGeracao: new Date().toISOString(),
      empresa: clienteData.empresa,
      resumo: {
        totalProdutos: produtos.length,
        produtosVazios: produtosVazios.length,
        produtosInvalidos: produtosInvalidos.length,
        produtosComSugestao: produtosComSugestao.length,
        economiaMensalTotal: totalEconomiaMensal,
        economiaAnualTotal: totalEconomiaAnual,
      },
      produtosVazios: produtosVazios.map((p) => ({
        id: p.produto.id,
        nome: p.produto.nome,
        grupo: p.produto.grupo,
        ncmSugerido: p.ncmSugerido,
        descricaoSugerida: p.descricaoSugerida,
      })),
      produtosInvalidos: produtosInvalidos.map((p) => ({
        id: p.produto.id,
        nome: p.produto.nome,
        ncmAtual: p.produto.ncm,
        grupo: p.produto.grupo,
      })),
      sugestoes: produtosComSugestao.map((p) => ({
        id: p.produto.id,
        nome: p.produto.nome,
        ncmAtual: p.produto.ncm,
        ncmSugerido: p.ncmSugerido,
        descricaoSugerida: p.descricaoSugerida,
        aliquotaAtual: p.aliquotaAtual,
        aliquotaSugerida: p.aliquotaSugerida,
        economiaMensal: p.economiaMensal,
        economiaAnual: p.economiaAnual,
        nivelRisco: p.nivelRisco,
        observacao: p.observacao,
      })),
      resumoPorGrupo: resumoGrupos.map((g) => ({
        grupo: g.nome,
        totalProdutos: g.total,
        produtosComProblema: g.comProblema,
        economiaMensal: g.economiaMensal,
        economiaAnual: calcularEconomiaAnual(g.economiaMensal),
      })),
    };

    const blob = new Blob([JSON.stringify(relatorio, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `relatorio-tributario-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [
    produtos,
    produtosVazios,
    produtosInvalidos,
    produtosComSugestao,
    totalEconomiaMensal,
    totalEconomiaAnual,
    resumoGrupos,
  ]);

  return (
    <div className="max-w-[1400px] mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Analise Tributaria</h1>
        <p className="text-sm text-gray-500 mt-1">
          Oportunidades de economia via reenquadramento de NCM e tributacao
        </p>
      </div>

      {/* Section 1: Alert Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: NCM Vazio */}
        <div className="bg-white rounded-xl shadow-sm border-2 border-red-200 p-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-red-700">NCM Vazio</h3>
            <span className="bg-red-100 text-red-700 text-xs font-bold px-2.5 py-1 rounded-full">
              {produtosVazios.length}
            </span>
          </div>
          <p className="text-xs text-gray-500 mb-3">Produtos sem NCM cadastrado</p>
          <div className="max-h-32 overflow-y-auto space-y-1">
            {produtosVazios.length === 0 ? (
              <p className="text-xs text-gray-400">Nenhum produto com NCM vazio</p>
            ) : (
              produtosVazios.map((p) => (
                <div
                  key={p.produto.id}
                  className="flex items-center gap-2 text-xs text-gray-600 py-0.5"
                >
                  <span className="w-1.5 h-1.5 bg-red-400 rounded-full flex-shrink-0" />
                  <span className="truncate">{p.produto.nome}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Card 2: NCM Nao Encontrado */}
        <div className="bg-white rounded-xl shadow-sm border-2 border-yellow-200 p-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-yellow-700">NCM Nao Encontrado</h3>
            <span className="bg-yellow-100 text-yellow-700 text-xs font-bold px-2.5 py-1 rounded-full">
              {produtosInvalidos.length}
            </span>
          </div>
          <p className="text-xs text-gray-500 mb-3">NCM nao encontrado na base de dados</p>
          <div className="max-h-32 overflow-y-auto space-y-1">
            {produtosInvalidos.length === 0 ? (
              <p className="text-xs text-gray-400">Nenhum problema encontrado</p>
            ) : (
              produtosInvalidos.slice(0, 10).map((p) => (
                <div
                  key={p.produto.id}
                  className="flex items-center gap-2 text-xs text-gray-600 py-0.5"
                >
                  <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full flex-shrink-0" />
                  <span className="truncate">{p.produto.nome}</span>
                  <span className="text-gray-400 ml-auto flex-shrink-0 font-mono text-[10px]">
                    {p.produto.ncm}
                  </span>
                </div>
              ))
            )}
            {produtosInvalidos.length > 10 && (
              <p className="text-xs text-gray-400">
                ...e mais {produtosInvalidos.length - 10} produtos
              </p>
            )}
          </div>
        </div>

        {/* Card 3: Com Sugestao de Troca */}
        <div className="bg-white rounded-xl shadow-sm border-2 border-green-200 p-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-green-700">Com Sugestao de Troca</h3>
            <span className="bg-green-100 text-green-700 text-xs font-bold px-2.5 py-1 rounded-full">
              {produtosComSugestao.length}
            </span>
          </div>
          <p className="text-xs text-gray-500 mb-3">Produtos com oportunidade de economia</p>
          <div className="mt-3">
            <p className="text-xs text-gray-500">Economia potencial mensal</p>
            <p className="text-xl font-bold text-green-600">{formatarMoeda(totalEconomiaMensal)}</p>
          </div>
          <div className="mt-2">
            <p className="text-xs text-gray-500">Economia potencial anual</p>
            <p className="text-lg font-bold text-green-600">{formatarMoeda(totalEconomiaAnual)}</p>
          </div>
        </div>
      </div>

      {/* Section 2: Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        {/* Tab Navigation */}
        <div className="border-b border-gray-200 px-6">
          <nav className="flex gap-6">
            <button
              onClick={() => {
                setAbaAtiva("problemas");
                setBusca("");
                setPaginaAtual(1);
              }}
              className={`py-4 text-sm font-medium border-b-2 transition-colors ${
                abaAtiva === "problemas"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Produtos com Problemas
              <span className="ml-2 bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">
                {produtosProblemas.length}
              </span>
            </button>
            <button
              onClick={() => {
                setAbaAtiva("sugestoes");
                setBusca("");
                setPaginaAtual(1);
              }}
              className={`py-4 text-sm font-medium border-b-2 transition-colors ${
                abaAtiva === "sugestoes"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Sugestoes de Troca
              <span className="ml-2 bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">
                {produtosComSugestao.length}
              </span>
            </button>
            <button
              onClick={() => {
                setAbaAtiva("grupos");
                setBusca("");
              }}
              className={`py-4 text-sm font-medium border-b-2 transition-colors ${
                abaAtiva === "grupos"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Resumo por Grupo
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* Search Bar */}
          {abaAtiva !== "grupos" && (
            <div className="mb-4">
              <input
                type="text"
                placeholder="Buscar por nome, grupo ou NCM..."
                value={busca}
                onChange={(e) => {
                  setBusca(e.target.value);
                  setPaginaAtual(1);
                }}
                className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
          )}

          {/* Tab 1: Produtos com Problemas */}
          {abaAtiva === "problemas" && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-xs font-medium text-gray-500 uppercase">
                    <th className="text-left py-3 px-4 rounded-l-lg">Produto</th>
                    <th className="text-left py-3 px-4">NCM Atual</th>
                    <th className="text-left py-3 px-4">Grupo</th>
                    <th className="text-center py-3 px-4">Status</th>
                    <th className="text-left py-3 px-4 rounded-r-lg">Acao Sugerida</th>
                  </tr>
                </thead>
                <tbody>
                  {produtosProblemasFiltrados.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-gray-400">
                        Nenhum produto com problemas encontrado
                      </td>
                    </tr>
                  ) : (
                    produtosProblemasFiltrados.map((item) => (
                      <tr
                        key={item.produto.id}
                        className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                      >
                        <td className="py-3 px-4 font-medium text-gray-900 max-w-[250px] truncate">
                          {item.produto.nome}
                        </td>
                        <td className="py-3 px-4 text-gray-600 font-mono text-xs">
                          {item.produto.ncm || "-"}
                        </td>
                        <td className="py-3 px-4 text-gray-600 text-xs">
                          {item.produto.grupo}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <StatusBadge status={item.status} />
                        </td>
                        <td className="py-3 px-4 text-xs text-gray-600 max-w-[300px]">
                          {item.ncmSugerido ? (
                            <span>
                              Usar NCM{" "}
                              <span className="font-mono text-blue-600 font-medium">
                                {item.ncmSugerido}
                              </span>
                              {" - "}
                              <span className="text-gray-500">{item.descricaoSugerida}</span>
                            </span>
                          ) : (
                            <span className="text-gray-400">{item.observacao}</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Tab 2: Sugestoes de Troca */}
          {abaAtiva === "sugestoes" && (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-xs font-medium text-gray-500 uppercase">
                      <th className="text-left py-3 px-4 rounded-l-lg">Produto</th>
                      <th className="text-left py-3 px-4">NCM Atual</th>
                      <th className="text-left py-3 px-4">NCM Sugerida</th>
                      <th className="text-right py-3 px-4">ICMS Atual</th>
                      <th className="text-right py-3 px-4">ICMS Sugerido</th>
                      <th className="text-right py-3 px-4">Economia Mensal</th>
                      <th className="text-right py-3 px-4">Economia Anual</th>
                      <th className="text-center py-3 px-4 rounded-r-lg">Risco</th>
                    </tr>
                  </thead>
                  <tbody>
                    {itensPagina.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-gray-400">
                          Nenhuma sugestao de troca encontrada
                        </td>
                      </tr>
                    ) : (
                      itensPagina.map((item) => (
                        <>
                          <tr
                            key={item.produto.id}
                            onClick={() => toggleLinha(item.produto.id)}
                            className={`border-b border-gray-100 cursor-pointer transition-colors ${
                              item.economiaMensal > 0 ? "bg-green-50/30 hover:bg-green-50/60" : "hover:bg-gray-50"
                            }`}
                          >
                            <td className="py-3 px-4 font-medium text-gray-900 max-w-[200px] truncate">
                              {item.produto.nome}
                            </td>
                            <td className="py-3 px-4 text-gray-600 font-mono text-xs">
                              {item.produto.ncm}
                            </td>
                            <td className="py-3 px-4 font-mono text-xs text-blue-600">
                              {item.ncmSugerido}
                            </td>
                            <td className="py-3 px-4 text-right text-gray-600">
                              {formatarPercentual(item.aliquotaAtual)}
                            </td>
                            <td className="py-3 px-4 text-right text-blue-600 font-medium">
                              {formatarPercentual(item.aliquotaSugerida)}
                            </td>
                            <td className="py-3 px-4 text-right">
                              {item.economiaMensal > 0 ? (
                                <span className="text-green-600 font-medium">
                                  {formatarMoeda(item.economiaMensal)}
                                </span>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-right">
                              {item.economiaAnual > 0 ? (
                                <span className="text-green-600 font-medium">
                                  {formatarMoeda(item.economiaAnual)}
                                </span>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <RiscoBadge nivel={item.nivelRisco} />
                            </td>
                          </tr>
                          {linhaExpandida === item.produto.id && (
                            <tr key={`${item.produto.id}-detail`}>
                              <td colSpan={8} className="p-0">
                                <DetalheExpandido item={item} onFechar={() => setLinhaExpandida(null)} />
                              </td>
                            </tr>
                          )}
                        </>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPaginas > 1 && (
                <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-100">
                  <span className="text-sm text-gray-500">
                    {sugestoesFiltradas.length} resultados - Pagina {paginaAtual} de {totalPaginas}
                  </span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setPaginaAtual((p) => Math.max(1, p - 1))}
                      disabled={paginaAtual === 1}
                      className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Anterior
                    </button>
                    {Array.from({ length: Math.min(5, totalPaginas) }, (_, i) => {
                      let num: number;
                      if (totalPaginas <= 5) {
                        num = i + 1;
                      } else if (paginaAtual <= 3) {
                        num = i + 1;
                      } else if (paginaAtual >= totalPaginas - 2) {
                        num = totalPaginas - 4 + i;
                      } else {
                        num = paginaAtual - 2 + i;
                      }
                      return (
                        <button
                          key={num}
                          onClick={() => setPaginaAtual(num)}
                          className={`px-3 py-1.5 text-sm rounded-lg ${
                            num === paginaAtual
                              ? "bg-blue-600 text-white"
                              : "border border-gray-300 hover:bg-gray-50"
                          }`}
                        >
                          {num}
                        </button>
                      );
                    })}
                    <button
                      onClick={() => setPaginaAtual((p) => Math.min(totalPaginas, p + 1))}
                      disabled={paginaAtual === totalPaginas}
                      className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Proxima
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Tab 3: Resumo por Grupo */}
          {abaAtiva === "grupos" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {resumoGrupos.map((grupo) => (
                <div
                  key={grupo.nome}
                  className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-gray-900">{grupo.nome}</h3>
                    <span className="text-xs text-gray-500">{grupo.total} produtos</span>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">Com problemas</span>
                      <span
                        className={`text-sm font-medium ${
                          grupo.comProblema > 0 ? "text-yellow-600" : "text-green-600"
                        }`}
                      >
                        {grupo.comProblema}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">Economia mensal</span>
                      <span
                        className={`text-sm font-semibold ${
                          grupo.economiaMensal > 0 ? "text-green-600" : "text-gray-400"
                        }`}
                      >
                        {grupo.economiaMensal > 0
                          ? formatarMoeda(grupo.economiaMensal)
                          : "-"}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">Aliquota media</span>
                      <span className="text-sm text-gray-700">
                        {formatarPercentual(grupo.aliquotaMedia)}
                      </span>
                    </div>

                    {grupo.produtosComEconomia.length > 0 && (
                      <div className="pt-3 border-t border-gray-100">
                        <p className="text-xs text-gray-500 mb-2">Maiores economias</p>
                        <div className="space-y-1.5">
                          {grupo.produtosComEconomia.map((p, i) => (
                            <div key={i} className="flex justify-between items-center text-xs">
                              <span className="text-gray-600 truncate max-w-[150px]">{p.nome}</span>
                              <span className="text-green-600 font-medium ml-2">
                                {formatarMoeda(p.economia)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Section 3: Export Button */}
      <div className="flex justify-end">
        <button
          onClick={exportarRelatorio}
          className="px-6 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          Exportar Relatorio
        </button>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: StatusProduto }) {
  const config: Record<StatusProduto, { bg: string; text: string; label: string }> = {
    vazio: {
      bg: "bg-red-100",
      text: "text-red-700",
      label: "Vazio",
    },
    invalido: {
      bg: "bg-yellow-100",
      text: "text-yellow-700",
      label: "Invalido",
    },
    com_sugestao: {
      bg: "bg-orange-100",
      text: "text-orange-700",
      label: "Incorreto",
    },
    ok: {
      bg: "bg-green-100",
      text: "text-green-700",
      label: "OK",
    },
  };

  const { bg, text, label } = config[status];

  return (
    <span
      className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${bg} ${text}`}
    >
      {label}
    </span>
  );
}

function RiscoBadge({ nivel }: { nivel: "baixo" | "medio" | "alto" }) {
  const config: Record<string, { bg: string; text: string; label: string }> = {
    baixo: { bg: "bg-green-100", text: "text-green-700", label: "Baixo" },
    medio: { bg: "bg-yellow-100", text: "text-yellow-700", label: "Medio" },
    alto: { bg: "bg-red-100", text: "text-red-700", label: "Alto" },
  };

  const { bg, text, label } = config[nivel];

  return (
    <span
      className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${bg} ${text}`}
    >
      {label}
    </span>
  );
}

function DetalheExpandido({
  item,
  onFechar,
}: {
  item: ProdutoComAnalise;
  onFechar: () => void;
}) {
  const ncmAtualInfo = buscarNCMporCodigo(item.produto.ncm.replace(/\D/g, ""));
  const ncmSugInfo = item.ncmSugerido
    ? buscarNCMporCodigo(item.ncmSugerido)
    : null;

  return (
    <div className="bg-gray-50 border-t border-b border-gray-100 px-6 py-5">
      <div className="flex justify-between items-start mb-4">
        <h4 className="text-sm font-semibold text-gray-900">{item.produto.nome}</h4>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onFechar();
          }}
          className="text-gray-400 hover:text-gray-600 p-1"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
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
            <DetalheLinha label="Codigo" valor={item.produto.ncm || "N/A"} />
            <DetalheLinha label="Descricao" valor={ncmAtualInfo?.descricao || "N/A"} />
            <DetalheLinha
              label="ICMS %"
              valor={item.aliquotaAtual > 0 ? `${item.aliquotaAtual}%` : "N/A"}
            />
            <DetalheLinha
              label="IPI %"
              valor={`${ncmAtualInfo?.aliquotaIPI ?? 0}%`}
            />
            <DetalheLinha
              label="ST"
              valor={item.temSTAtual ? "Obrigatorio" : "Nao"}
            />
          </div>
        </div>

        {/* NCM Sugerida */}
        <div className="bg-white rounded-lg p-4 border border-blue-200">
          <h5 className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-3">
            NCM Sugerida
          </h5>
          {ncmSugInfo ? (
            <div className="space-y-2">
              <DetalheLinha
                label="Codigo"
                valor={item.ncmSugerido!}
                valorClassName="text-blue-600 font-semibold"
              />
              <DetalheLinha label="Descricao" valor={ncmSugInfo.descricao} />
              <DetalheLinha
                label="ICMS %"
                valor={`${item.aliquotaSugerida}%`}
                valorClassName="text-blue-600"
              />
              <DetalheLinha
                label="IPI %"
                valor={`${ncmSugInfo.aliquotaIPI}%`}
              />
              <DetalheLinha
                label="ST"
                valor={item.temSTSugerido ? "Obrigatorio" : "Nao"}
              />
            </div>
          ) : (
            <p className="text-sm text-gray-400">Nenhuma sugestao disponivel</p>
          )}
        </div>
      </div>

      {/* Bottom: Recommendation + Risk + Savings */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg p-4 border border-gray-200 md:col-span-2">
          <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Recomendacao
          </h5>
          <p className="text-sm text-gray-600 leading-relaxed">{item.observacao}</p>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200 space-y-2">
          <DetalheLinha
            label="Nivel de Risco"
            valor={item.nivelRisco.charAt(0).toUpperCase() + item.nivelRisco.slice(1)}
          />
          <DetalheLinha
            label="Economia Mensal"
            valor={formatarMoeda(item.economiaMensal)}
            valorClassName="text-green-600 font-semibold"
          />
          <DetalheLinha
            label="Economia Anual"
            valor={formatarMoeda(item.economiaAnual)}
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
      <span className={`text-sm text-right ${valorClassName || "text-gray-900"}`}>
        {valor}
      </span>
    </div>
  );
}
