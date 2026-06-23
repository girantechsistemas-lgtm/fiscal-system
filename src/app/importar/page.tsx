"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  parseNFeXML,
  calcularCreditosNFe,
  formatarCNPJ,
} from "@/lib/parserNFe";
import type { NFeData } from "@/lib/parserNFe";

interface NotaImportada {
  id: string;
  dados: NFeData;
  creditos: {
    icms: number;
    ipi: number;
    pis: number;
    cofins: number;
    st: number;
    total: number;
  };
  importadaEm: string;
}

const STORAGE_KEY = "fiscalzim_notas_importadas";

function formatarMoeda(valor: number): string {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatarData(data: string): string {
  if (!data) return "-";
  try {
    const d = new Date(data);
    return d.toLocaleDateString("pt-BR");
  } catch {
    return data;
  }
}

function gerarId(): string {
  return `nf_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

export default function ImportarPage() {
  const [notasParaImportar, setNotasParaImportar] = useState<NotaImportada[]>([]);
  const [notasImportadas, setNotasImportadas] = useState<NotaImportada[]>([]);
  const [processando, setProcessando] = useState(false);
  const [erros, setErros] = useState<string[]>([]);
  const [notaSelecionada, setNotaSelecionada] = useState<NotaImportada | null>(null);
  const [arrastando, setArrastando] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const salvo = localStorage.getItem(STORAGE_KEY);
    if (salvo) {
      try {
        setNotasImportadas(JSON.parse(salvo));
      } catch {
        setNotasImportadas([]);
      }
    }
  }, []);

  const salvarNotas = useCallback((notas: NotaImportada[]) => {
    setNotasImportadas(notas);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notas));
  }, []);

  const processarArquivos = useCallback(async (arquivos: FileList | File[]) => {
    setProcessando(true);
    setErros([]);
    const novasNotas: NotaImportada[] = [];
    const errosEncontrados: string[] = [];

    const arquivosArray = Array.from(arquivos);

    for (const arquivo of arquivosArray) {
      if (!arquivo.name.toLowerCase().endsWith(".xml")) {
        errosEncontrados.push(`${arquivo.name}: Arquivo nao e XML`);
        continue;
      }

      try {
        const conteudo = await arquivo.text();
        const dados = parseNFeXML(conteudo);

        if (!dados) {
          errosEncontrados.push(`${arquivo.name}: Falha ao parsear XML`);
          continue;
        }

        const creditos = calcularCreditosNFe(dados);
        novasNotas.push({
          id: gerarId(),
          dados,
          creditos,
          importadaEm: new Date().toISOString(),
        });
      } catch (error) {
        errosEncontrados.push(
          `${arquivo.name}: ${error instanceof Error ? error.message : "Erro desconhecido"}`
        );
      }
    }

    setNotasParaImportar((prev) => [...prev, ...novasNotas]);
    setErros(errosEncontrados);
    setProcessando(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setArrastando(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setArrastando(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setArrastando(false);
      if (e.dataTransfer.files.length > 0) {
        processarArquivos(e.dataTransfer.files);
      }
    },
    [processarArquivos]
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        processarArquivos(e.target.files);
        e.target.value = "";
      }
    },
    [processarArquivos]
  );

  const handleConfirmarImportacao = useCallback(() => {
    const todasNotas = [...notasImportadas, ...notasParaImportar];
    salvarNotas(todasNotas);
    setNotasParaImportar([]);
  }, [notasImportadas, notasParaImportar, salvarNotas]);

  const handleLimparNotas = useCallback(() => {
    if (confirm("Tem certeza que deseja limpar todas as notas importadas?")) {
      salvarNotas([]);
      setNotasParaImportar([]);
    }
  }, [salvarNotas]);

  const handleExportar = useCallback(() => {
    const dados = JSON.stringify(notasImportadas, null, 2);
    const blob = new Blob([dados], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fiscalzim_notas_${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [notasImportadas]);

  const removerNotaPendente = useCallback((id: string) => {
    setNotasParaImportar((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const todosCreditos = notasImportadas.reduce(
    (acc, nota) => ({
      icms: acc.icms + nota.creditos.icms,
      ipi: acc.ipi + nota.creditos.ipi,
      pis: acc.pis + nota.creditos.pis,
      cofins: acc.cofins + nota.creditos.cofins,
      st: acc.st + nota.creditos.st,
      total: acc.total + nota.creditos.total,
    }),
    { icms: 0, ipi: 0, pis: 0, cofins: 0, st: 0, total: 0 }
  );

  const creditosPendentes = notasParaImportar.reduce(
    (acc, nota) => ({
      icms: acc.icms + nota.creditos.icms,
      ipi: acc.ipi + nota.creditos.ipi,
      pis: acc.pis + nota.creditos.pis,
      cofins: acc.cofins + nota.creditos.cofins,
      st: acc.st + nota.creditos.st,
      total: acc.total + nota.creditos.total,
    }),
    { icms: 0, ipi: 0, pis: 0, cofins: 0, st: 0, total: 0 }
  );

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Importar NF-e</h1>
        <p className="text-gray-500 mt-1">
          Importe arquivos XML de Notas Fiscais Eletronicas para calcular creditos fiscais
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-sm font-medium text-gray-500">Notas Importadas</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">
            {notasImportadas.length}
          </div>
          <div className="text-xs text-gray-400 mt-1">Salvas no sistema</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-sm font-medium text-gray-500">Creditos Totais</div>
          <div className="text-2xl font-bold text-green-600 mt-1">
            {formatarMoeda(todosCreditos.total)}
          </div>
          <div className="text-xs text-gray-400 mt-1">ICMS + ST + PIS + COFINS + IPI</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-sm font-medium text-gray-500">Pendentes</div>
          <div className="text-2xl font-bold text-amber-600 mt-1">
            {notasParaImportar.length}
          </div>
          <div className="text-xs text-gray-400 mt-1">
            {formatarMoeda(creditosPendentes.total)} em creditos
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div
              className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors cursor-pointer ${
                arrastando
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-300 hover:border-blue-400 hover:bg-gray-50"
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => inputRef.current?.click()}
            >
              <input
                ref={inputRef}
                type="file"
                multiple
                accept=".xml"
                className="hidden"
                onChange={handleFileChange}
              />
              <div className="text-gray-400 mb-3">
                <svg
                  className="mx-auto h-12 w-12"
                  stroke="currentColor"
                  fill="none"
                  viewBox="0 0 48 48"
                >
                  <path
                    d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <p className="text-gray-600 font-medium">
                Arraste arquivos XML aqui ou clique para selecionar
              </p>
              <p className="text-sm text-gray-400 mt-2">
                Aceita multiplos arquivos .xml de NF-e
              </p>
              {processando && (
                <p className="text-sm text-blue-600 mt-3 font-medium">
                  Processando arquivos...
                </p>
              )}
            </div>

            {erros.length > 0 && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm font-medium text-red-700 mb-2">
                  Erros encontrados:
                </p>
                <ul className="text-sm text-red-600 space-y-1">
                  {erros.map((erro, i) => (
                    <li key={i}>- {erro}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {notasParaImportar.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  Notas para Importar ({notasParaImportar.length})
                </h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => setNotasParaImportar([])}
                    className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleConfirmarImportacao}
                    className="px-4 py-2 text-sm font-medium text-white bg-[#2563eb] rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Confirmar Importacao
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-2 font-medium text-gray-600">
                        NF-e
                      </th>
                      <th className="text-left py-3 px-2 font-medium text-gray-600">
                        Data
                      </th>
                      <th className="text-left py-3 px-2 font-medium text-gray-600">
                        Emitente
                      </th>
                      <th className="text-left py-3 px-2 font-medium text-gray-600">
                        CNPJ
                      </th>
                      <th className="text-right py-3 px-2 font-medium text-gray-600">
                        Itens
                      </th>
                      <th className="text-right py-3 px-2 font-medium text-gray-600">
                        Total
                      </th>
                      <th className="text-right py-3 px-2 font-medium text-gray-600">
                        Creditos
                      </th>
                      <th className="text-center py-3 px-2 font-medium text-gray-600">
                        Acao
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {notasParaImportar.map((nota) => (
                      <tr
                        key={nota.id}
                        className="border-b border-gray-100 hover:bg-gray-50"
                      >
                        <td className="py-3 px-2 font-medium">
                          {nota.dados.numeroNf || "-"}
                        </td>
                        <td className="py-3 px-2 text-gray-600">
                          {formatarData(nota.dados.dataEmissao)}
                        </td>
                        <td className="py-3 px-2 text-gray-600 max-w-[200px] truncate">
                          {nota.dados.emitente.razaoSocial || "-"}
                        </td>
                        <td className="py-3 px-2 text-gray-600 font-mono text-xs">
                          {formatarCNPJ(nota.dados.emitente.cnpj)}
                        </td>
                        <td className="py-3 px-2 text-right">
                          {nota.dados.itens.length}
                        </td>
                        <td className="py-3 px-2 text-right font-semibold">
                          {formatarMoeda(nota.dados.totais.valorNF)}
                        </td>
                        <td className="py-3 px-2 text-right text-green-600 font-semibold">
                          {formatarMoeda(nota.creditos.total)}
                        </td>
                        <td className="py-3 px-2 text-center">
                          <button
                            onClick={() => removerNotaPendente(nota.id)}
                            className="text-red-500 hover:text-red-700 text-xs font-medium"
                          >
                            Remover
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {notasImportadas.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  Notas Importadas ({notasImportadas.length})
                </h2>
                <div className="flex gap-2">
                  <button
                    onClick={handleLimparNotas}
                    className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
                  >
                    Limpar Tudo
                  </button>
                  <button
                    onClick={handleExportar}
                    className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 border border-gray-200 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Exportar JSON
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-2 font-medium text-gray-600">
                        NF-e
                      </th>
                      <th className="text-left py-3 px-2 font-medium text-gray-600">
                        Data
                      </th>
                      <th className="text-left py-3 px-2 font-medium text-gray-600">
                        Emitente
                      </th>
                      <th className="text-left py-3 px-2 font-medium text-gray-600">
                        CNPJ
                      </th>
                      <th className="text-right py-3 px-2 font-medium text-gray-600">
                        Itens
                      </th>
                      <th className="text-right py-3 px-2 font-medium text-gray-600">
                        Total
                      </th>
                      <th className="text-right py-3 px-2 font-medium text-gray-600">
                        ICMS
                      </th>
                      <th className="text-right py-3 px-2 font-medium text-gray-600">
                        ST
                      </th>
                      <th className="text-right py-3 px-2 font-medium text-gray-600">
                        PIS
                      </th>
                      <th className="text-right py-3 px-2 font-medium text-gray-600">
                        COFINS
                      </th>
                      <th className="text-right py-3 px-2 font-medium text-gray-600">
                        IPI
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {notasImportadas.map((nota) => (
                      <tr
                        key={nota.id}
                        className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                        onClick={() =>
                          setNotaSelecionada(
                            notaSelecionada?.id === nota.id ? null : nota
                          )
                        }
                      >
                        <td className="py-3 px-2 font-medium">
                          {nota.dados.numeroNf || "-"}
                        </td>
                        <td className="py-3 px-2 text-gray-600">
                          {formatarData(nota.dados.dataEmissao)}
                        </td>
                        <td className="py-3 px-2 text-gray-600 max-w-[150px] truncate">
                          {nota.dados.emitente.razaoSocial || "-"}
                        </td>
                        <td className="py-3 px-2 text-gray-600 font-mono text-xs">
                          {formatarCNPJ(nota.dados.emitente.cnpj)}
                        </td>
                        <td className="py-3 px-2 text-right">
                          {nota.dados.itens.length}
                        </td>
                        <td className="py-3 px-2 text-right font-semibold">
                          {formatarMoeda(nota.dados.totais.valorNF)}
                        </td>
                        <td className="py-3 px-2 text-right text-green-600">
                          {formatarMoeda(nota.creditos.icms)}
                        </td>
                        <td className="py-3 px-2 text-right text-purple-600">
                          {formatarMoeda(nota.creditos.st)}
                        </td>
                        <td className="py-3 px-2 text-right text-green-600">
                          {formatarMoeda(nota.creditos.pis)}
                        </td>
                        <td className="py-3 px-2 text-right text-orange-600">
                          {formatarMoeda(nota.creditos.cofins)}
                        </td>
                        <td className="py-3 px-2 text-right text-red-600">
                          {formatarMoeda(nota.creditos.ipi)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Resumo de Creditos
            </h2>
            <div className="space-y-3">
              <CreditoLinha
                tipo="ICMS"
                valor={todosCreditos.icms}
                cor="text-blue-600"
              />
              <CreditoLinha
                tipo="ST"
                valor={todosCreditos.st}
                cor="text-purple-600"
              />
              <CreditoLinha
                tipo="PIS"
                valor={todosCreditos.pis}
                cor="text-green-600"
              />
              <CreditoLinha
                tipo="COFINS"
                valor={todosCreditos.cofins}
                cor="text-orange-600"
              />
              <CreditoLinha
                tipo="IPI"
                valor={todosCreditos.ipi}
                cor="text-red-600"
              />
              <div className="border-t border-gray-200 pt-3 mt-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-gray-900">TOTAL</span>
                  <span className="text-lg font-bold text-green-600">
                    {formatarMoeda(todosCreditos.total)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {notaSelecionada && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  Detalhes NF-e {notaSelecionada.dados.numeroNf}
                </h2>
                <button
                  onClick={() => setNotaSelecionada(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
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

              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">
                    Emitente
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-3 text-sm">
                    <p className="font-medium">
                      {notaSelecionada.dados.emitente.razaoSocial}
                    </p>
                    <p className="text-gray-600 font-mono text-xs mt-1">
                      {formatarCNPJ(notaSelecionada.dados.emitente.cnpj)}
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">
                    Itens ({notaSelecionada.dados.itens.length})
                  </h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {notaSelecionada.dados.itens.map((item, index) => (
                      <div
                        key={index}
                        className="bg-gray-50 rounded-lg p-3 text-sm"
                      >
                        <div className="flex justify-between">
                          <span className="font-medium truncate max-w-[180px]">
                            {item.nome || item.codigo}
                          </span>
                          <span className="text-gray-600">
                            {formatarMoeda(item.valorTotal)}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          NCM: {item.ncm} | CFOP: {item.cfop} | Qtd:{" "}
                          {item.quantidade} {item.unidade}
                        </div>
                        <div className="flex gap-3 mt-1 text-xs">
                          {item.impostos.icms.valor > 0 && (
                            <span className="text-blue-600">
                              ICMS: {formatarMoeda(item.impostos.icms.valor)}
                            </span>
                          )}
                          {item.impostos.icms.valorST &&
                            item.impostos.icms.valorST > 0 && (
                              <span className="text-purple-600">
                                ST:{" "}
                                {formatarMoeda(item.impostos.icms.valorST)}
                              </span>
                            )}
                          {item.impostos.pis.valor > 0 && (
                            <span className="text-green-600">
                              PIS: {formatarMoeda(item.impostos.pis.valor)}
                            </span>
                          )}
                          {item.impostos.cofins.valor > 0 && (
                            <span className="text-orange-600">
                              COFINS:{" "}
                              {formatarMoeda(item.impostos.cofins.valor)}
                            </span>
                          )}
                          {item.impostos.ipi &&
                            item.impostos.ipi.valor > 0 && (
                              <span className="text-red-600">
                                IPI: {formatarMoeda(item.impostos.ipi.valor)}
                              </span>
                            )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">
                    Creditos por Imposto
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-3 text-sm space-y-1">
                    <div className="flex justify-between">
                      <span className="text-blue-600">ICMS</span>
                      <span>{formatarMoeda(notaSelecionada.creditos.icms)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-purple-600">ST</span>
                      <span>{formatarMoeda(notaSelecionada.creditos.st)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-green-600">PIS</span>
                      <span>{formatarMoeda(notaSelecionada.creditos.pis)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-orange-600">COFINS</span>
                      <span>
                        {formatarMoeda(notaSelecionada.creditos.cofins)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-red-600">IPI</span>
                      <span>{formatarMoeda(notaSelecionada.creditos.ipi)}</span>
                    </div>
                    <div className="border-t border-gray-200 pt-1 mt-1">
                      <div className="flex justify-between font-bold">
                        <span>Total</span>
                        <span className="text-green-600">
                          {formatarMoeda(notaSelecionada.creditos.total)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CreditoLinha({
  tipo,
  valor,
  cor,
}: {
  tipo: string;
  valor: number;
  cor: string;
}) {
  return (
    <div className="flex justify-between items-center">
      <span className={`text-sm font-medium ${cor}`}>{tipo}</span>
      <span className="text-sm text-gray-700">{formatarMoeda(valor)}</span>
    </div>
  );
}
