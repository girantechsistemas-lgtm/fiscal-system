/**
 * Parser de XML de NF-e (Nota Fiscal Eletronica) brasileira.
 * Extrai emitente, itens, totais e impostos (ICMS, IPI, PIS, COFINS).
 */

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

export interface NFeImpostos {
  /** Valor total do ICMS */
  icms: number;
  /** Valor total do IPI */
  ipi: number;
  /** Valor total do PIS */
  pis: number;
  /** Valor total da COFINS */
  cofins: number;
  /** Valor total do Substituicao Tributaria */
  st: number;
}

export interface NFeItemImpostos {
  icms: {
    origem: string;
    cst: string;
    baseCalculo: number;
    aliquota: number;
    valor: number;
    percentualReducaoBase?: number;
    baseCalculoST?: number;
    aliquotaST?: number;
    valorST?: number;
  };
  ipi: {
    cst: string;
    baseCalculo: number;
    aliquota: number;
    valor: number;
  } | null;
  pis: {
    cst: string;
    baseCalculo: number;
    aliquota: number;
    valor: number;
  };
  cofins: {
    cst: string;
    baseCalculo: number;
    aliquota: number;
    valor: number;
  };
}

export interface NFeItem {
  /** Codigo do produto (tag cProd) */
  codigo: string;
  /** Descricao do produto (tag xProd) */
  nome: string;
  /** Codigo NCM (tag NCM) */
  ncm: string;
  /** CFOP (tag CFOP) */
  cfop: string;
  /** CEST (tag CEST) */
 cest?: string;
  /** Unidade comercial (tag uCom) */
  unidade: string;
  /** Quantidade (tag qCom) */
  quantidade: number;
  /** Valor unitario de comercializacao (tag vUnCom) */
  valorUnitario: number;
  /** Valor total do produto (tag vProd) */
  valorTotal: number;
  /** Impostos do item */
  impostos: NFeItemImpostos;
}

export interface NFeEmitente {
  /** CNPJ do emitente (tag CNPJ) */
  cnpj: string;
  /** Razao social (tag xNome) */
  razaoSocial: string;
  /** Nome fantasia (tag xFant) */
  nomeFantasia?: string;
  /** Inscricao Estadual (tag IE) */
  inscricaoEstadual?: string;
  /** Regime tributario (tag CRT) */
  regimeTributario?: string;
  /** Endereco do emitente */
  endereco?: {
    logradouro: string;
    numero: string;
    complemento?: string;
    bairro: string;
    municipio: string;
    uf: string;
    cep: string;
    codigoMunicipio?: string;
    pais?: string;
  };
}

export interface NFeDestinatario {
  /** CPF ou CNPJ do destinatario */
  cpfCnpj?: string;
  /** Razao social ou nome */
  razaoSocial?: string;
  /** Inscricao Estadual */
  inscricaoEstadual?: string;
  /** Endereco */
  endereco?: {
    logradouro: string;
    numero: string;
    complemento?: string;
    bairro: string;
    municipio: string;
    uf: string;
    cep: string;
  };
}

export interface NFeTotais {
  /** Base de calculo do ICMS */
  baseCalculoIcms: number;
  /** Valor total do ICMS */
  valorIcms: number;
  /** Base de calculo do ICMS-ST */
  baseCalculoIcmsSt: number;
  /** Valor total do ICMS-ST */
  valorIcmsSt: number;
  /** Valor total dos produtos e servicos */
  valorProdutos: number;
  /** Valor total do frete */
  valorFrete: number;
  /** Valor total do seguro */
  valorSeguro: number;
  /** Valor total do desconto */
  valorDesconto: number;
  /** Valor total do II (Imposto de Importacao) */
  valorIi: number;
  /** Valor total do IPI */
  valorIpi: number;
  /** Valor total da PIS */
  valorPis: number;
  /** Valor total da COFINS */
  valorCofins: number;
  /** Valor total da NF-e (tag vNF) */
  valorNF: number;
  /** Valor total dos descontos do item */
  valorDescontos?: number;
}

export interface NFeData {
  /** Chave de acesso da NF-e */
  chaveAcesso?: string;
  /** Numero da NF-e (tag nNF) */
  numeroNf: string;
  /** Serie da NF-e (tag serie) */
  serie?: string;
  /** Data de emissao (tag dhEmi) */
  dataEmissao: string;
  /** Data de saida/entrada (tag dhSaiEnt) */
  dataSaidaEntrada?: string;
  /** Natureza da operacao (tag natOp) */
  naturezaOperacao?: string;
  /** Tipo de operacao (0 = Entrada, 1 = Saida) */
  tipoOperacao?: string;
  /** Emitente */
  emitente: NFeEmitente;
  /** Destinatario */
  destinatario?: NFeDestinatario;
  /** Itens da NF-e */
  itens: NFeItem[];
  /** Totais da NF-e */
  totais: NFeTotais;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Converte uma string para numero, substituindo virgula por ponto e
 * lidando com valores ausentes ou invalidos.
 */
function toNumber(value: string | null | undefined): number {
  if (!value) return 0;
  const cleaned = value.replace(",", ".").trim();
  const num = parseFloat(cleaned);
  return Number.isFinite(num) ? num : 0;
}

/**
 * Extrai o conteudo de texto de um elemento XML pelo caminho indicado.
 * Suporta caminhos com namespace prefixo (ex: "tag:tag2").
 */
function getText(
  parent: Element | Document,
  tagName: string,
): string | null {
  // Tenta direto e com namespace
  const el = parent.getElementsByTagName(tagName)[0];
  if (el) return el.textContent?.trim() ?? null;

  // Tenta com prefixo de namespace comum
  const parts = tagName.split(":");
  if (parts.length === 2) {
    const el2 = parent.getElementsByTagName(parts[1])[0];
    if (el2) return el2.textContent?.trim() ?? null;
  }
  return null;
}

/**
 * Extrai o primeiro elemento filho com a tag especificada.
 */
function getElement(
  parent: Element | Document,
  tagName: string,
): Element | null {
  return parent.getElementsByTagName(tagName)[0] ?? null;
}

/**
 * Obtem o valor de uma tag dentro de um elemento, com fallback.
 */
function getTagValue(
  parent: Element,
  tag: string,
  fallback: string = "",
): string {
  return getText(parent, tag) ?? fallback;
}

// ---------------------------------------------------------------------------
// Parser
// ---------------------------------------------------------------------------

/**
 * Converte o CST/CSOSN do ICMS em uma string descritiva.
 */
function descreverCstIcms(cst: string): string {
  const map: Record<string, string> = {
    "00": "Tributada integralmente",
    "10": "Tributada e com cobranca do ICMS-ST",
    "20": "Com reducao de base de calculo",
    "30": "Isenta ou nao tributada e com cobranca do ICMS-ST",
    "40": "Isenta",
    "41": "Nao tributada",
    "50": "Suspensao",
    "60": "ICMS cobrado anteriormente por ST",
    "70": "Com reducao de base de calculo e cobranca do ICMS-ST",
    "90": "Outros",
    "102": "Sem permissao de credito",
    "103": "Com permissao de credito",
    "202": "Sem permissao de credito",
    "203": "Com permissao de credito",
    "500": "ICMS antecipado",
    "900": "Outros",
  };
  return map[cst] ?? "Desconhecido";
}

/**
 * Extrai a tag de imposto ICMS do item (ICMS00, ICMS10, ICMS20, etc).
 */
function extrairIcms(itemEl: Element): NFeItemImpostos["icms"] {
  const imposto = getElement(itemEl, "imposto");
  if (!imposto) {
    return {
      origem: "",
      cst: "",
      baseCalculo: 0,
      aliquota: 0,
      valor: 0,
    };
  }

  // Procura por todas as tags possiveis de ICMS
  const tagsIcms = [
    "ICMS00",
    "ICMS10",
    "ICMS20",
    "ICMS30",
    "ICMS40",
    "ICMS51",
    "ICMS60",
    "ICMS70",
    "ICMS90",
    "ICMSSN101",
    "ICMSSN102",
    "ICMSSN201",
    "ICMSSN202",
    "ICMSSN500",
    "ICMSSN900",
  ];

  let icmsEl: Element | null = null;
  for (const tag of tagsIcms) {
    icmsEl = getElement(imposto, tag);
    if (icmsEl) break;
  }

  if (!icmsEl) {
    return {
      origem: "",
      cst: "",
      baseCalculo: 0,
      aliquota: 0,
      valor: 0,
    };
  }

  const origem = getTagValue(icmsEl, "orig", "");
  const cst = getTagValue(icmsEl, "CST", getTagValue(icmsEl, "CSOSN", ""));
  const baseCalculo = toNumber(getText(icmsEl, "vBC"));
  const aliquota = toNumber(getText(icmsEl, "pICMS"));
  const valor = toNumber(getText(icmsEl, "vICMS"));

  // Valores que podem nao existir
  const percentualReducaoBase = toNumber(getText(icmsEl, "pRedBC")) || undefined;
  const baseCalculoST = toNumber(getText(icmsEl, "vBCST")) || undefined;
  const aliquotaST = toNumber(getText(icmsEl, "pICMSST")) || undefined;
  const valorST = toNumber(getText(icmsEl, "vICMSST")) || undefined;

  const result: NFeItemImpostos["icms"] = {
    origem,
    cst,
    baseCalculo,
    aliquota,
    valor,
  };

  if (percentualReducaoBase !== undefined)
    result.percentualReducaoBase = percentualReducaoBase;
  if (baseCalculoST !== undefined) result.baseCalculoST = baseCalculoST;
  if (aliquotaST !== undefined) result.aliquotaST = aliquotaST;
  if (valorST !== undefined) result.valorST = valorST;

  return result;
}

/**
 * Extrai a tag de imposto PIS do item.
 */
function extrairPis(itemEl: Element): NFeItemImpostos["pis"] {
  const imposto = getElement(itemEl, "imposto");
  if (!imposto) {
    return { cst: "", baseCalculo: 0, aliquota: 0, valor: 0 };
  }

  const tagsPis = ["PISAliq", "PISQtde", "PISNT", "PISOutr"];
  let pisEl: Element | null = null;
  for (const tag of tagsPis) {
    pisEl = getElement(imposto, tag);
    if (pisEl) break;
  }

  if (!pisEl) {
    return { cst: "", baseCalculo: 0, aliquota: 0, valor: 0 };
  }

  const cst = getTagValue(pisEl, "CST", "");
  const baseCalculo = toNumber(getText(pisEl, "vBC")) || toNumber(getText(pisEl, "qBCProd"));
  const aliquota = toNumber(getText(pisEl, "pPIS"));
  const valor = toNumber(getText(pisEl, "vPIS"));

  return { cst, baseCalculo, aliquota, valor };
}

/**
 * Extrai a tag de imposto COFINS do item.
 */
function extrairCofins(itemEl: Element): NFeItemImpostos["cofins"] {
  const imposto = getElement(itemEl, "imposto");
  if (!imposto) {
    return { cst: "", baseCalculo: 0, aliquota: 0, valor: 0 };
  }

  const tagsCofins = [
    "COFINSAliq",
    "COFINSQtde",
    "COFINSNT",
    "COFINSOutr",
  ];
  let cofinsEl: Element | null = null;
  for (const tag of tagsCofins) {
    cofinsEl = getElement(imposto, tag);
    if (cofinsEl) break;
  }

  if (!cofinsEl) {
    return { cst: "", baseCalculo: 0, aliquota: 0, valor: 0 };
  }

  const cst = getTagValue(cofinsEl, "CST", "");
  const baseCalculo =
    toNumber(getText(cofinsEl, "vBC")) || toNumber(getText(cofinsEl, "qBCProd"));
  const aliquota = toNumber(getText(cofinsEl, "pCOFINS"));
  const valor = toNumber(getText(cofinsEl, "vCOFINS"));

  return { cst, baseCalculo, aliquota, valor };
}

/**
 * Extrai a tag de imposto IPI do item.
 */
function extrairIpi(itemEl: Element): NFeItemImpostos["ipi"] {
  const imposto = getElement(itemEl, "imposto");
  if (!imposto) return null;

  const ipiEl = getElement(imposto, "IPI");
  if (!ipiEl) return null;

  const tribEl = getElement(ipiEl, "IPITrib");
  if (!tribEl) {
    // IPINT - IPI Nao Tributado
    const ntEl = getElement(ipiEl, "IPINT");
    if (ntEl) {
      return {
        cst: getTagValue(ntEl, "CST", ""),
        baseCalculo: 0,
        aliquota: 0,
        valor: 0,
      };
    }
    return null;
  }

  return {
    cst: getTagValue(tribEl, "CST", ""),
    baseCalculo: toNumber(getText(tribEl, "vBC")),
    aliquota: toNumber(getText(tribEl, "pIPI")),
    valor: toNumber(getText(tribEl, "vIPI")),
  };
}

/**
 * Extrai um item (det) da NF-e.
 */
function extrairItem(detEl: Element): NFeItem {
  const prod = getElement(detEl, "prod");
  if (!prod) {
    throw new ElementoAusenteError("Elemento 'prod' nao encontrado no item");
  }

  return {
    codigo: getTagValue(prod, "cProd", ""),
    nome: getTagValue(prod, "xProd", ""),
    ncm: getTagValue(prod, "NCM", ""),
    cfop: getTagValue(prod, "CFOP", ""),
    cest: getText(prod, "CEST") ?? undefined,
    unidade: getTagValue(prod, "uCom", ""),
    quantidade: toNumber(getText(prod, "qCom")),
    valorUnitario: toNumber(getText(prod, "vUnCom")),
    valorTotal: toNumber(getText(prod, "vProd")),
    impostos: {
      icms: extrairIcms(detEl),
      ipi: extrairIpi(detEl),
      pis: extrairPis(detEl),
      cofins: extrairCofins(detEl),
    },
  };
}

/**
 * Extrai o emitente da NF-e.
 */
function extrairEmitente(nfeEl: Element): NFeEmitente {
  const emit = getElement(nfeEl, "emit");
  if (!emit) {
    throw new ElementoAusenteError("Elemento 'emit' nao encontrado");
  }

  const endEl = getElement(emit, "enderEmit");

  const emitente: NFeEmitente = {
    cnpj: getTagValue(emit, "CNPJ", ""),
    razaoSocial: getTagValue(emit, "xNome", ""),
    nomeFantasia: getText(emit, "xFant") ?? undefined,
    inscricaoEstadual: getText(emit, "IE") ?? undefined,
    regimeTributario: getText(emit, "CRT") ?? undefined,
  };

  if (endEl) {
    emitente.endereco = {
      logradouro: getTagValue(endEl, "xLgr", ""),
      numero: getTagValue(endEl, "nro", ""),
      complemento: getText(endEl, "xCpl") ?? undefined,
      bairro: getTagValue(endEl, "xBairro", ""),
      municipio: getTagValue(endEl, "xMun", ""),
      uf: getTagValue(endEl, "UF", ""),
      cep: getTagValue(endEl, "CEP", ""),
      codigoMunicipio: getText(endEl, "cMun") ?? undefined,
      pais: getText(endEl, "xPais") ?? undefined,
    };
  }

  return emitente;
}

/**
 * Extrai o destinatario da NF-e.
 */
function extrairDestinatario(nfeEl: Element): NFeDestinatario | undefined {
  const dest = getElement(nfeEl, "dest");
  if (!dest) return undefined;

  const cpfCnpj = getText(dest, "CNPJ") ?? getText(dest, "CPF") ?? undefined;
  const razaoSocial = getText(dest, "xNome") ?? undefined;
  const inscricaoEstadual = getText(dest, "IE") ?? undefined;

  const endEl = getElement(dest, "enderDest");

  const destinatario: NFeDestinatario = {
    cpfCnpj,
    razaoSocial,
    inscricaoEstadual,
  };

  if (endEl) {
    destinatario.endereco = {
      logradouro: getTagValue(endEl, "xLgr", ""),
      numero: getTagValue(endEl, "nro", ""),
      complemento: getText(endEl, "xCpl") ?? undefined,
      bairro: getTagValue(endEl, "xBairro", ""),
      municipio: getTagValue(endEl, "xMun", ""),
      uf: getTagValue(endEl, "UF", ""),
      cep: getTagValue(endEl, "CEP", ""),
    };
  }

  return destinatario;
}

/**
 * Extrai os totais da NF-e a partir do ICMSTot.
 */
function extrairTotais(nfeEl: Element): NFeTotais {
  const totalEl = getElement(nfeEl, "total");
  const icmsTotal = totalEl ? getElement(totalEl, "ICMSTot") : null;

  if (!icmsTotal) {
    return {
      baseCalculoIcms: 0,
      valorIcms: 0,
      baseCalculoIcmsSt: 0,
      valorIcmsSt: 0,
      valorProdutos: 0,
      valorFrete: 0,
      valorSeguro: 0,
      valorDesconto: 0,
      valorIi: 0,
      valorIpi: 0,
      valorPis: 0,
      valorCofins: 0,
      valorNF: 0,
    };
  }

  return {
    baseCalculoIcms: toNumber(getText(icmsTotal, "vBC")),
    valorIcms: toNumber(getText(icmsTotal, "vICMS")),
    baseCalculoIcmsSt: toNumber(getText(icmsTotal, "vBCST")),
    valorIcmsSt: toNumber(getText(icmsTotal, "vST")),
    valorProdutos: toNumber(getText(icmsTotal, "vProd")),
    valorFrete: toNumber(getText(icmsTotal, "vFrete")),
    valorSeguro: toNumber(getText(icmsTotal, "vSeg")),
    valorDesconto: toNumber(getText(icmsTotal, "vDesc")),
    valorIi: toNumber(getText(icmsTotal, "vII")),
    valorIpi: toNumber(getText(icmsTotal, "vIPI")),
    valorPis: toNumber(getText(icmsTotal, "vPIS")),
    valorCofins: toNumber(getText(icmsTotal, "vCOFINS")),
    valorNF: toNumber(getText(icmsTotal, "vNF")),
  };
}

// ---------------------------------------------------------------------------
// Erro customizado
// ---------------------------------------------------------------------------

export class ElementoAusenteError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ElementoAusenteError";
  }
}

// ---------------------------------------------------------------------------
// Funcao principal
// ---------------------------------------------------------------------------

/**
 * Faz o parse de uma string contendo o XML de uma NF-e.
 *
 * Utiliza DOMParser (API disponivel em browsers e em ambientes que a
 * disponibilizam, como Deno ou JSDOM).
 *
 * @param xml - String com o conteudo XML da NF-e.
 * @returns Objeto NFeData estruturado ou null em caso de falha.
 */
export function parseNFeXML(xml: string): NFeData | null {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xml, "text/xml");

    // Verificar se houve erro de parsing
    const parseError = doc.querySelector("parsererror");
    if (parseError) {
      console.error("Erro ao parsear XML:", parseError.textContent);
      return null;
    }

    // Buscar o elemento raiz da NF-e
    const nfeEl = getElement(doc, "nfeProc") ?? doc.documentElement;

    // InfNFe contem os dados principais
    const infNFe = getElement(nfeEl, "infNFe");
    if (!infNFe) {
      console.error("Elemento 'infNFe' nao encontrado");
      return null;
    }

    // Extrair chave de acesso
    const chaveAcesso = infNFe.getAttribute("Id")?.replace("NFe", "") ?? "";

    // Extrair identificacao (ide)
    const ide = getElement(infNFe, "ide");

    // Extrair itens (det)
    const detElements = infNFe.getElementsByTagName("det");
    const itens: NFeItem[] = [];
    for (let i = 0; i < detElements.length; i++) {
      try {
        itens.push(extrairItem(detElements[i]));
      } catch (e) {
        console.warn(`Erro ao extrair item ${i + 1}:`, e);
      }
    }

    // Extrair emitente
    let emitente: NFeEmitente;
    try {
      emitente = extrairEmitente(infNFe);
    } catch (e) {
      console.error("Erro ao extrair emitente:", e);
      return null;
    }

    // Extrair destinatario (opcional)
    const destinatario = extrairDestinatario(infNFe);

    // Extrair totais
    const totais = extrairTotais(infNFe);

    // Montar objeto de retorno
    const data: NFeData = {
      chaveAcesso: chaveAcesso || undefined,
      numeroNf: ide ? getTagValue(ide, "nNF", "") : "",
      serie: ide ? getText(ide, "serie") ?? undefined : undefined,
      dataEmissao: ide ? getTagValue(ide, "dhEmi", "") : "",
      dataSaidaEntrada: ide ? getText(ide, "dhSaiEnt") ?? undefined : undefined,
      naturezaOperacao: ide ? getText(ide, "natOp") ?? undefined : undefined,
      tipoOperacao: ide ? getText(ide, "tpNF") ?? undefined : undefined,
      emitente,
      destinatario,
      itens,
      totais,
    };

    return data;
  } catch (error) {
    console.error("Erro inesperado ao parsear NF-e:", error);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Calculo de creditos
// ---------------------------------------------------------------------------

/**
 * Calcula os creditos fiscais de uma NF-e com base nos impostos dos itens.
 *
 * Para NF-e de entrada (compra), o valor dos creditos equivale a soma dos
 * valores de impostos de cada item. Para notas de saida, esses valores
 * representam as obrigacoes a recolher.
 *
 * @param nfe - Objeto NFeData ja parseado.
 * @returns Objeto com os valores de credito por imposto e o total.
 */
export function calcularCreditosNFe(
  nfe: NFeData,
): { icms: number; ipi: number; pis: number; cofins: number; st: number; total: number } {
  let icms = 0;
  let ipi = 0;
  let pis = 0;
  let cofins = 0;
  let st = 0;

  for (const item of nfe.itens) {
    icms += item.impostos.icms.valor;
    if (item.impostos.icms.valorST) {
      st += item.impostos.icms.valorST;
    }
    if (item.impostos.ipi) {
      ipi += item.impostos.ipi.valor;
    }
    pis += item.impostos.pis.valor;
    cofins += item.impostos.cofins.valor;
  }

  // Valores alternativos: usar os totais do cabecalho quando disponiveis
  // e se os itens nao tiverem impostos calculados
  if (icms === 0 && nfe.totais.valorIcms > 0) {
    icms = nfe.totais.valorIcms;
  }
  if (ipi === 0 && nfe.totais.valorIpi > 0) {
    ipi = nfe.totais.valorIpi;
  }
  if (pis === 0 && nfe.totais.valorPis > 0) {
    pis = nfe.totais.valorPis;
  }
  if (cofins === 0 && nfe.totais.valorCofins > 0) {
    cofins = nfe.totais.valorCofins;
  }
  if (st === 0 && nfe.totais.valorIcmsSt > 0) {
    st = nfe.totais.valorIcmsSt;
  }

  const total = icms + ipi + pis + cofins + st;

  return { icms, ipi, pis, cofins, st, total };
}

// ---------------------------------------------------------------------------
// Helpers de formatacao
// ---------------------------------------------------------------------------

/**
 * Formata um CNPJ (somente digitos) para o padrao XX.XXX.XXX/XXXX-XX.
 *
 * @param cnpj - String com os 14 digitos do CNPJ.
 * @returns CNPJ formatado ou a string original se nao tiver 14 digitos.
 */
export function formatarCNPJ(cnpj: string): string {
  const apenasDigitos = cnpj.replace(/\D/g, "");
  if (apenasDigitos.length !== 14) return cnpj;
  return apenasDigitos.replace(
    /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
    "$1.$2.$3/$4-$5",
  );
}

/**
 * Formata uma chave de acesso de NF-e (44 digitos) em grupos de 4.
 *
 * @param chave - Chave de acesso com 44 digitos.
 * @returns Chave formatada.
 */
export function formatarChaveAcesso(chave: string): string {
  const apenasDigitos = chave.replace(/\D/g, "");
  if (apenasDigitos.length !== 44) return chave;
  return apenasDigitos.replace(/(\d{4})(?=\d)/g, "$1 ");
}

/**
 * Retorna a descricao do CST/CSOSN do ICMS.
 */
export function describirCstIcms(cst: string): string {
  return descreverCstIcms(cst);
}
