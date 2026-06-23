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

interface ArquivoNota {
  id: string;
  arquivo: File;
  nome: string;
  tamanho: number;
  status: "aguardando" | "processando" | "sucesso" | "erro";
  nota?: NotaImportada;
  erro?: string;
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
    return new Date(data).toLocaleDateString("pt-BR");
  } catch {
    return data;
  }
}

function formatarTamanho(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function gerarId(): string {
  return `nf_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

function UploadIcon() {
  return (
    <svg
      className="mx-auto h-12 w-12 text-gray-400"
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
  );
}

function CheckIcon() {
  return (
    <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function Spinner() {
  return (
    <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-blue-500" />
  );
}

export default function ImportarPage() {
  const [arquivos, setArquivos] = useState<ArquivoNota[]>([]);
  const [notasImportadas, setNotasImportadas] = useState<NotaImportada[]>([]);
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

  const processarArquivos = useCallback(
    async (lista: File[]) => {
      const novosArquivos: ArquivoNota[] = lista.map((arquivo) => ({
        id: gerarId(),
        arquivo,
        nome: arquivo.name,
        tamanho: arquivo.size,
        status: "aguardando" as const,
      }));

      setArquivos((prev) => [...prev, ...novosArquivos]);

      for (const item of novosArquivos) {
        setArquivos((prev) =>
          prev.map((a) => (a.id === item.id ? { ...a, status: "processando" } : a))
        );

        try {
          if (!item.nome.toLowerCase().endsWith(".xml")) {
            throw new Error("Arquivo nao e XML");
          }

          const conteudo = await item.arquivo.text();
          const dados = parseNFeXML(conteudo);

          if (!dados) {
            throw new Error("Falha ao parsear XML");
          }

          const creditos = calcularCreditosNFe(dados);
          const nota: NotaImportada = {
            id: item.id,
            dados,
            creditos,
            importadaEm: new Date().toISOString(),
          };

          setArquivos((prev) =>
            prev.map((a) =>
              a.id === item.id ? { ...a, status: "sucesso", nota } : a
            )
          );
        } catch (error) {
          setArquivos((prev) =>
            prev.map((a) =>
              a.id === item.id
                ? {
                    ...a,
                    status: "erro",
                    erro: error instanceof Error ? error.message : "Erro desconhecido",
                  }
                : a
            )
          );
        }
      }
    },
    []
  );

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
        processarArquivos(Array.from(e.dataTransfer.files));
      }
    },
    [processarArquivos]
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        processarArquivos(Array.from(e.target.files));
        e.target.value = "";
      }
    },
    [processarArquivos]
  );

  const handleImportar = useCallback(() => {
    const prontas = arquivos.filter((a) => a.status === "sucesso" && a.nota);
    if (prontas.length === 0) return;

    const notasNovas = prontas.map((a) => a.nota!);
    const todasNotas = [...notasImportadas, ...notasNovas];
    salvarNotas(todasNotas);
    setArquivos((prev) => prev.filter((a) => a.status !== "sucesso"));
  }, [arquivos, notasImportadas, salvarNotas]);

  const handleLimpar = useCallback(() => {
    setArquivos([]);
  }, []);

  const handleLimparHistorico = useCallback(() => {
    if (confirm("Tem certeza que deseja limpar todo o historico?")) {
      salvarNotas([]);
    }
  }, [salvarNotas]);

  const arquivosProntos = arquivos.filter((a) => a.status === "sucesso");
  const podeImportar = arquivosProntos.length > 0;

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Importar NF-e</h1>
        <p className="text-sm text-gray-500 mt-1">
          Importe notas fiscais eletronicas para analise de creditos
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
            <div
              className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors cursor-pointer ${
                arrastando
                  ? "border-blue-400 bg-blue-50"
                  : "border-gray-300 hover:border-gray-400"
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
              <UploadIcon />
              <p className="mt-4 text-sm font-medium text-gray-700">
                Arraste os arquivos XML aqui
              </p>
              <p className="mt-1 text-sm text-gray-500">
                ou clique para selecionar
              </p>
            </div>

            {arquivos.length > 0 && (
              <div className="mt-6 space-y-3">
                {arquivos.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-4 py-3"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="flex-shrink-0">
                        {item.status === "sucesso" && <CheckIcon />}
                        {item.status === "erro" && <XIcon />}
                        {item.status === "processando" && <Spinner />}
                        {item.status === "aguardando" && (
                          <span className="inline-block h-5 w-5 rounded-full border-2 border-gray-300" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {item.nome}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatarTamanho(item.tamanho)}
                          {item.status === "sucesso" && item.nota && (
                            <span className="ml-2 text-gray-400">
                              Fornecedor: {item.nota.dados.emitente.razaoSocial || "-"}, Total:{" "}
                              {formatarMoeda(item.nota.dados.totais.valorNF)}
                            </span>
                          )}
                          {item.status === "erro" && item.erro && (
                            <span className="ml-2 text-red-500">{item.erro}</span>
                          )}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`ml-4 flex-shrink-0 rounded-full px-2 py-1 text-xs font-medium ${
                        item.status === "sucesso"
                          ? "bg-green-50 text-green-700"
                          : item.status === "erro"
                          ? "bg-red-50 text-red-700"
                          : item.status === "processando"
                          ? "bg-blue-50 text-blue-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {item.status === "sucesso"
                        ? "Sucesso"
                        : item.status === "erro"
                        ? "Erro"
                        : item.status === "processando"
                        ? "Processando"
                        : "Aguardando"}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {arquivos.length > 0 && (
              <div className="mt-6 flex items-center gap-3">
                <button
                  onClick={handleLimpar}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Limpar
                </button>
                <button
                  onClick={handleImportar}
                  disabled={!podeImportar}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Importar Selecionados
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
              Notas Importadas
            </h2>

            {notasImportadas.length === 0 ? (
              <p className="mt-6 text-sm text-gray-400 text-center py-8">
                Nenhuma nota importada ainda
              </p>
            ) : (
              <div className="mt-4 space-y-2">
                {notasImportadas.map((nota) => (
                  <div
                    key={nota.id}
                    className="rounded-lg border border-gray-100 px-4 py-3 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {nota.dados.emitente.razaoSocial || "Sem emitente"}
                      </p>
                      <span className="ml-2 flex-shrink-0 text-sm font-semibold text-green-600">
                        {formatarMoeda(nota.creditos.total)}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-3 text-xs text-gray-500">
                      <span>{formatarData(nota.dados.dataEmissao)}</span>
                      <span>{nota.dados.itens.length} itens</span>
                      <span>{formatarMoeda(nota.dados.totais.valorNF)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {notasImportadas.length > 0 && (
              <div className="mt-6 pt-4 border-t border-gray-100">
                <button
                  onClick={handleLimparHistorico}
                  className="text-sm text-gray-500 hover:text-red-600 transition-colors"
                >
                  Limpar Historico
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
