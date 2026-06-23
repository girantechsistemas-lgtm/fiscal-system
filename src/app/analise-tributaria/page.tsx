"use client";

import { useState, useMemo } from "react";
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

interface ItemAnalise {
  produto: Produto;
  status: "vazio" | "invalido" | "com_sugestao" | "ok";
  ncmSugerido: string | null;
  descSugerida: string;
  icmsAtual: number;
  icmsSugerido: number;
  economiaMensal: number;
  economiaAnual: number;
  risco: "baixo" | "medio" | "alto";
  obs: string;
}

function moeda(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const NCM_MAP: Record<string, Record<string, { ncm: string; desc: string }>> = {
  INSUMOS: {
    AGUA: { ncm: "34022000", desc: "Detergentes" },
    ALCOOL: { ncm: "22072010", desc: "Alcool etilico" },
    AMARULA: { ncm: "22087000", desc: "Licores" },
    SANITARIA: { ncm: "34022000", desc: "Detergentes" },
    BICARBONATO: { ncm: "21069090", desc: "Preparacoes alimenticias" },
    BOLACHA: { ncm: "19059090", desc: "Produtos de padaria" },
    BOMBRIL: { ncm: "96035000", desc: "Escovas para limpeza" },
    DESINFETANTE: { ncm: "34022000", desc: "Detergentes" },
    DESEMGORDURANTE: { ncm: "34022000", desc: "Detergentes" },
    DESINCRUSTANTE: { ncm: "34022000", desc: "Detergentes" },
    DISCO: { ncm: "96035000", desc: "Escovas para limpeza" },
    CANUDO: { ncm: "39232900", desc: "Sacolas de plastico" },
    COPO: { ncm: "39241000", desc: "Artigos de mesa" },
    OLEO: { ncm: "15111000", desc: "Oleo de soja" },
    PARMESAO: { ncm: "04069000", desc: "Outros queijos" },
    SUCO: { ncm: "20098900", desc: "Sumos de frutas" },
    CITRUS: { ncm: "20098900", desc: "Sumos de frutas" },
    BID: { ncm: "20098900", desc: "Sumos de frutas" },
    CARVAO: { ncm: "44029000", desc: "Outros carvoes" },
    CO2: { ncm: "28111900", desc: "Outros gases" },
    BROTOS: { ncm: "07099000", desc: "Hortalicas frescas" },
    DOSADOR: { ncm: "84248990", desc: "Aparelhos de dispersao" },
    REFRESCO: { ncm: "20098900", desc: "Sumos de frutas" },
  },
};

function sugerirVazio(p: Produto): { ncm: string; desc: string } | null {
  const nome = p.nome.toUpperCase();
  const mapa = NCM_MAP[p.grupo];
  if (mapa) {
    for (const [k, v] of Object.entries(mapa)) {
      if (nome.includes(k)) return v;
    }
  }
  if (p.grupo === "INSUMOS" && !nome.includes("DESATIVAR")) {
    return { ncm: "34011900", desc: "Saboes e detergentes" };
  }
  return null;
}

function classificarRisco(a: string, b: string): "baixo" | "medio" | "alto" {
  const d = Math.abs(parseInt(a.substring(0, 2)) - parseInt(b.substring(0, 2)));
  return d === 0 ? "baixo" : d <= 2 ? "medio" : "alto";
}

export default function AnaliseTributariaPage() {
  const produtos = clienteData.produtos as Produto[];
  const [aba, setAba] = useState<"problemas" | "sugestoes" | "grupos">("sugestoes");
  const [busca, setBusca] = useState("");
  const [pagina, setPagina] = useState(1);
  const [expandido, setExpandido] = useState<number | null>(null);

  const listaAnalise = useMemo(() => {
    const resultado: ItemAnalise[] = [];
    const comNCM = produtos
      .filter((p) => p.ncm !== "")
      .map((p) => ({
        id: p.id,
        nome: p.nome,
        ncm: p.ncm,
        prc_venda: p.prc_venda,
        grupo: p.grupo,
      }));
    const mapaAnalise = new Map(
      analisarProdutos(comNCM).map((a) => [a.produtoId, a])
    );

    for (const p of produtos) {
      if (p.nome.startsWith("DESATIVAR")) continue;

      if (p.ncm === "") {
        const s = sugerirVazio(p);
        const info = s ? buscarNCMporCodigo(s.ncm) : null;
        resultado.push({
          produto: p,
          status: "vazio",
          ncmSugerido: s?.ncm || null,
          descSugerida: s?.desc || "Cadastrar NCM",
          icmsAtual: 0,
          icmsSugerido: info?.aliquotaICMS || 0,
          economiaMensal: 0,
          economiaAnual: 0,
          risco: "alto",
          obs: s ? `Sugerir NCM ${s.ncm}` : "NCM nao cadastrado",
        });
        continue;
      }

      const a = mapaAnalise.get(p.id);

      if (!a || !a.ncmSugerido) {
        resultado.push({
          produto: p,
          status: "invalido",
          ncmSugerido: null,
          descSugerida: "Nao encontrado",
          icmsAtual: 0,
          icmsSugerido: 0,
          economiaMensal: 0,
          economiaAnual: 0,
          risco: "alto",
          obs: "NCM nao encontrado na base",
        });
        continue;
      }

      if (a.economiaMensal > 0) {
        resultado.push({
          produto: p,
          status: "com_sugestao",
          ncmSugerido: a.ncmSugerido,
          descSugerida: a.descricaoNCMSugerido,
          icmsAtual: a.aliquotaAtual,
          icmsSugerido: a.aliquotaSugerida,
          economiaMensal: a.economiaMensal,
          economiaAnual: calcularEconomiaAnual(a.economiaMensal),
          risco: a.nivelRisco,
          obs: a.observacao,
        });
      } else {
        resultado.push({
          produto: p,
          status: "ok",
          ncmSugerido: null,
          descSugerida: "",
          icmsAtual: a.aliquotaAtual,
          icmsSugerido: a.aliquotaAtual,
          economiaMensal: 0,
          economiaAnual: 0,
          risco: "baixo",
          obs: "NCM otimo",
        });
      }
    }
    return resultado;
  }, [produtos]);

  const vazios = useMemo(
    () => listaAnalise.filter((p) => p.status === "vazio"),
    [listaAnalise]
  );
  const invalidos = useMemo(
    () => listaAnalise.filter((p) => p.status === "invalido"),
    [listaAnalise]
  );
  const comSugestao = useMemo(
    () => listaAnalise.filter((p) => p.status === "com_sugestao"),
    [listaAnalise]
  );
  const economiaTotal = useMemo(
    () => comSugestao.reduce((s, p) => s + p.economiaMensal, 0),
    [comSugestao]
  );

  const filtrados = useMemo(() => {
    let lista =
      aba === "sugestoes"
        ? comSugestao
        : listaAnalise.filter((p) => p.status !== "ok");
    if (busca) {
      const b = busca.toLowerCase();
      lista = lista.filter(
        (p) =>
          p.produto.nome.toLowerCase().includes(b) ||
          p.produto.grupo.toLowerCase().includes(b) ||
          p.produto.ncm.includes(busca)
      );
    }
    return aba === "sugestoes"
      ? [...lista].sort((a, b) => b.economiaMensal - a.economiaMensal)
      : lista.sort((a, b) => a.produto.grupo.localeCompare(b.produto.grupo));
  }, [listaAnalise, aba, busca, comSugestao]);

  const porPagina = 20;
  const totalPag = Math.ceil(filtrados.length / porPagina);
  const itens = filtrados.slice(
    (pagina - 1) * porPagina,
    pagina * porPagina
  );

  const grupos = useMemo(() => {
    const mapa: Record<
      string,
      {
        total: number;
        problemas: number;
        economia: number;
        top: Array<{ n: string; e: number }>;
      }
    > = {};
    for (const item of listaAnalise) {
      const k = item.produto.grupo;
      if (!mapa[k])
        mapa[k] = { total: 0, problemas: 0, economia: 0, top: [] };
      mapa[k].total++;
      if (item.status !== "ok") mapa[k].problemas++;
      mapa[k].economia += item.economiaMensal;
      if (item.economiaMensal > 0)
        mapa[k].top.push({ n: item.produto.nome, e: item.economiaMensal });
    }
    return Object.entries(mapa)
      .sort((a, b) => b[1].economia - a[1].economia)
      .map(([n, d]) => ({
        nome: n,
        ...d,
        top: d.top
          .sort((a, b) => b.e - a.e)
          .slice(0, 3),
      }));
  }, [listaAnalise]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Analise Tributaria
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Oportunidades de economia via reenquadramento de NCM
          </p>
        </div>
        <button
          onClick={() => {
            const relatorio = {
              data: new Date().toISOString(),
              empresa: clienteData.empresa,
              produtos: listaAnalise.map((i) => ({
                id: i.produto.id,
                nome: i.produto.nome,
                ncm: i.produto.ncm,
                grupo: i.produto.grupo,
                status: i.status,
                ncmSugerido: i.ncmSugerido,
                economiaMensal: i.economiaMensal,
              })),
            };
            const blob = new Blob([JSON.stringify(relatorio, null, 2)], {
              type: "application/json",
            });
            const a = document.createElement("a");
            a.href = URL.createObjectURL(blob);
            a.download = `analise-${new Date().toISOString().split("T")[0]}.json`;
            a.click();
          }}
          className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          Exportar
        </button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-4 gap-4">
        <MetricCard label="Total Produtos" value={produtos.length} />
        <MetricCard label="NCM Vazio" value={vazios.length} color="red" />
        <MetricCard
          label="NCM Invalido"
          value={invalidos.length}
          color="yellow"
        />
        <MetricCard
          label="Com Sugestao"
          value={comSugestao.length}
          color="green"
          sub={moeda(economiaTotal) + "/mes"}
        />
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="flex border-b border-gray-200 px-6">
          {(
            [
              ["sugestoes", "Sugestoes de Troca", comSugestao.length],
              [
                "problemas",
                "Produtos com Problemas",
                vazios.length + invalidos.length,
              ],
              ["grupos", "Por Grupo", grupos.length],
            ] as const
          ).map(([k, label, count]) => (
            <button
              key={k}
              onClick={() => {
                setAba(k);
                setBusca("");
                setPagina(1);
              }}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                aba === k
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {label}{" "}
              <span className="ml-1.5 text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                {count}
              </span>
            </button>
          ))}
        </div>

        <div className="p-6">
          {aba !== "grupos" && (
            <div className="mb-4">
              <input
                type="text"
                placeholder="Buscar produto, grupo ou NCM..."
                value={busca}
                onChange={(e) => {
                  setBusca(e.target.value);
                  setPagina(1);
                }}
                className="w-full max-w-sm px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
          )}

          {/* Tabela Sugestoes */}
          {aba === "sugestoes" && (
            <div>
              <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[900px]">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-3 text-xs font-medium text-gray-500 uppercase">
                      Produto
                    </th>
                    <th className="text-left py-3 px-3 text-xs font-medium text-gray-500 uppercase">
                      Grupo
                    </th>
                    <th className="text-left py-3 px-3 text-xs font-medium text-gray-500 uppercase">
                      NCM Atual
                    </th>
                    <th className="text-left py-3 px-3 text-xs font-medium text-blue-600 uppercase">
                      NCM Sugerida
                    </th>
                    <th className="text-right py-3 px-3 text-xs font-medium text-gray-500 uppercase">
                      ICMS
                    </th>
                    <th className="text-right py-3 px-3 text-xs font-medium text-gray-500 uppercase">
                      ICMS Novo
                    </th>
                    <th className="text-right py-3 px-3 text-xs font-medium text-green-600 uppercase">
                      Economia/mes
                    </th>
                    <th className="text-center py-3 px-3 text-xs font-medium text-gray-500 uppercase">
                      Risco
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {itens.length === 0 ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="py-12 text-center text-gray-400"
                      >
                        Nenhuma sugestao encontrada
                      </td>
                    </tr>
                  ) : (
                    itens.map((item) => (
                      <tr
                        key={item.produto.id}
                        onClick={() =>
                          setExpandido(
                            expandido === item.produto.id
                              ? null
                              : item.produto.id
                          )
                        }
                        className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                      >
                        <td className="py-3 px-3 font-medium text-gray-900">
                          {item.produto.nome}
                        </td>
                        <td className="py-3 px-3 text-gray-500 text-xs">
                          {item.produto.grupo}
                        </td>
                        <td className="py-3 px-3 font-mono text-xs text-gray-600">
                          {item.produto.ncm}
                        </td>
                        <td className="py-3 px-3 font-mono text-xs text-blue-600 font-semibold">
                          {item.ncmSugerido}
                        </td>
                        <td className="py-3 px-3 text-right text-gray-600">
                          {item.icmsAtual}%
                        </td>
                        <td className="py-3 px-3 text-right text-blue-600 font-medium">
                          {item.icmsSugerido}%
                        </td>
                        <td className="py-3 px-3 text-right text-green-600 font-semibold">
                          {moeda(item.economiaMensal)}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                              item.risco === "baixo"
                                ? "bg-green-100 text-green-700"
                                : item.risco === "medio"
                                  ? "bg-yellow-100 text-yellow-700"
                                  : "bg-red-100 text-red-700"
                            }`}
                          >
                            {item.risco === "baixo"
                              ? "Baixo"
                              : item.risco === "medio"
                                ? "Medio"
                                : "Alto"}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
              </div>

              {/* Detalhe expandido */}
              {expandido &&
                (() => {
                  const item = listaAnalise.find(
                    (i) => i.produto.id === expandido
                  );
                  if (!item || item.status !== "com_sugestao") return null;
                  const ncmAtual = buscarNCMporCodigo(item.produto.ncm);
                  const ncmSug = item.ncmSugerido
                    ? buscarNCMporCodigo(item.ncmSugerido)
                    : null;
                  return (
                    <div className="mt-4 bg-gray-50 rounded-xl p-6 border border-gray-200">
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="font-semibold text-gray-900">
                          {item.produto.nome}
                        </h3>
                        <button
                          onClick={() => setExpandido(null)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </div>
                      <div className="grid grid-cols-3 gap-6">
                        <div>
                          <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">
                            NCM Atual
                          </h4>
                          <div className="space-y-1 text-sm">
                            <p>
                              <span className="text-gray-500">Codigo:</span>{" "}
                              {item.produto.ncm}
                            </p>
                            <p>
                              <span className="text-gray-500">Descricao:</span>{" "}
                              {ncmAtual?.descricao || "N/A"}
                            </p>
                            <p>
                              <span className="text-gray-500">ICMS:</span>{" "}
                              {item.icmsAtual}%
                            </p>
                            <p>
                              <span className="text-gray-500">IPI:</span>{" "}
                              {ncmAtual?.aliquotaIPI || 0}%
                            </p>
                            <p>
                              <span className="text-gray-500">ST:</span>{" "}
                              {ncmAtual?.stObrigatorio ? "Sim" : "Nao"}
                            </p>
                          </div>
                        </div>
                        <div>
                          <h4 className="text-xs font-semibold text-blue-600 uppercase mb-2">
                            NCM Sugerida
                          </h4>
                          <div className="space-y-1 text-sm">
                            <p>
                              <span className="text-gray-500">Codigo:</span>{" "}
                              <span className="text-blue-600 font-semibold">
                                {item.ncmSugerido}
                              </span>
                            </p>
                            <p>
                              <span className="text-gray-500">Descricao:</span>{" "}
                              {ncmSug?.descricao || item.descSugerida}
                            </p>
                            <p>
                              <span className="text-gray-500">ICMS:</span>{" "}
                              <span className="text-blue-600">
                                {item.icmsSugerido}%
                              </span>
                            </p>
                            <p>
                              <span className="text-gray-500">IPI:</span>{" "}
                              {ncmSug?.aliquotaIPI || 0}%
                            </p>
                            <p>
                              <span className="text-gray-500">ST:</span>{" "}
                              {ncmSug?.stObrigatorio ? "Sim" : "Nao"}
                            </p>
                          </div>
                        </div>
                        <div>
                          <h4 className="text-xs font-semibold text-green-600 uppercase mb-2">
                            Impacto Financeiro
                          </h4>
                          <div className="space-y-1 text-sm">
                            <p>
                              <span className="text-gray-500">
                                Economia mensal:
                              </span>{" "}
                              <span className="text-green-600 font-bold">
                                {moeda(item.economiaMensal)}
                              </span>
                            </p>
                            <p>
                              <span className="text-gray-500">
                                Economia anual:
                              </span>{" "}
                              <span className="text-green-600 font-bold">
                                {moeda(item.economiaAnual)}
                              </span>
                            </p>
                            <p>
                              <span className="text-gray-500">Risco:</span>{" "}
                              <span
                                className={
                                  item.risco === "baixo"
                                    ? "text-green-600"
                                    : item.risco === "medio"
                                      ? "text-yellow-600"
                                      : "text-red-600"
                                }
                              >
                                {item.risco.charAt(0).toUpperCase() +
                                  item.risco.slice(1)}
                              </span>
                            </p>
                          </div>
                          <p className="mt-3 text-xs text-gray-500 leading-relaxed">
                            {item.obs}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })()}

              {/* Paginacao */}
              {totalPag > 1 && (
                <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-100">
                  <span className="text-xs text-gray-500">
                    {filtrados.length} resultados - Pagina {pagina} de{" "}
                    {totalPag}
                  </span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setPagina((p) => Math.max(1, p - 1))}
                      disabled={pagina === 1}
                      className="px-3 py-1 text-xs border border-gray-200 rounded disabled:opacity-40 hover:bg-gray-50"
                    >
                      Anterior
                    </button>
                    <button
                      onClick={() =>
                        setPagina((p) => Math.min(totalPag, p + 1))
                      }
                      disabled={pagina === totalPag}
                      className="px-3 py-1 text-xs border border-gray-200 rounded disabled:opacity-40 hover:bg-gray-50"
                    >
                      Proxima
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tabela Problemas */}
          {aba === "problemas" && (
            <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[700px]">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-3 text-xs font-medium text-gray-500 uppercase">
                    Produto
                  </th>
                  <th className="text-left py-3 px-3 text-xs font-medium text-gray-500 uppercase">
                    Grupo
                  </th>
                  <th className="text-left py-3 px-3 text-xs font-medium text-gray-500 uppercase">
                    NCM Atual
                  </th>
                  <th className="text-center py-3 px-3 text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="text-left py-3 px-3 text-xs font-medium text-gray-500 uppercase">
                    Acao Sugerida
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtrados.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="py-12 text-center text-gray-400"
                    >
                      Nenhum problema encontrado
                    </td>
                  </tr>
                ) : (
                  filtrados.map((i) => (
                    <tr
                      key={i.produto.id}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="py-3 px-3 font-medium text-gray-900">
                        {i.produto.nome}
                      </td>
                      <td className="py-3 px-3 text-gray-500 text-xs">
                        {i.produto.grupo}
                      </td>
                      <td className="py-3 px-3 font-mono text-xs text-gray-600">
                        {i.produto.ncm || "-"}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                            i.status === "vazio"
                              ? "bg-red-100 text-red-700"
                              : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {i.status === "vazio" ? "Vazio" : "Invalido"}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-xs text-gray-600">
                        {i.ncmSugerido ? (
                          <span>
                            Usar{" "}
                            <span className="font-mono text-blue-600 font-semibold">
                              {i.ncmSugerido}
                            </span>{" "}
                            - {i.descSugerida}
                          </span>
                        ) : (
                          <span className="text-gray-400">{i.obs}</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            </div>
          )}

          {/* Grupos */}
          {aba === "grupos" && (
            <div className="grid grid-cols-3 gap-4">
              {grupos.map((g) => (
                <div
                  key={g.nome}
                  className="bg-gray-50 rounded-xl p-5 border border-gray-200"
                >
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-semibold text-gray-900 text-sm">
                      {g.nome}
                    </h3>
                    <span className="text-xs text-gray-500">
                      {g.total} produtos
                    </span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Com problemas</span>
                      <span
                        className={
                          g.problemas > 0
                            ? "text-yellow-600 font-medium"
                            : "text-green-600"
                        }
                      >
                        {g.problemas}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Economia/mes</span>
                      <span
                        className={
                          g.economia > 0
                            ? "text-green-600 font-semibold"
                            : "text-gray-400"
                        }
                      >
                        {g.economia > 0 ? moeda(g.economia) : "-"}
                      </span>
                    </div>
                    {g.top.length > 0 && (
                      <div className="pt-2 border-t border-gray-200 mt-2">
                        <p className="text-xs text-gray-500 mb-1">
                          Maiores economias
                        </p>
                        {g.top.map((t, j) => (
                          <div
                            key={j}
                            className="flex justify-between text-xs"
                          >
                            <span className="text-gray-600 truncate">
                              {t.n}
                            </span>
                            <span className="text-green-600 font-medium ml-2">
                              {moeda(t.e)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  color = "gray",
  sub,
}: {
  label: string;
  value: number;
  color?: string;
  sub?: string;
}) {
  const colors: Record<string, string> = {
    gray: "text-gray-900",
    red: "text-red-600",
    yellow: "text-yellow-600",
    green: "text-green-600",
  };
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${colors[color]}`}>{value}</p>
      {sub && <p className="text-xs text-green-600 mt-0.5">{sub}</p>}
    </div>
  );
}
