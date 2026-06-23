// ============================================================
// BIBLIOTECA DE CÁLCULOS TRIBUTÁRIOS - FiscalZim
// ============================================================

/**
 * Calcula crédito de ICMS
 * @param valorProduto - Valor do produto
 * @param aliquotaICMS - Alíquota do ICMS (ex: 18 para 18%)
 * @returns Valor do crédito de ICMS
 */
export function calcularCreditoICMS(valorProduto: number, aliquotaICMS: number): number {
  return valorProduto * (aliquotaICMS / 100);
}

/**
 * Calcula crédito de IPI
 * @param valorProduto - Valor do produto
 * @param aliquotaIPI - Alíquota do IPI (ex: 5 para 5%)
 * @returns Valor do crédito de IPI
 */
export function calcularCreditoIPI(valorProduto: number, aliquotaIPI: number): number {
  return valorProduto * (aliquotaIPI / 100);
}

/**
 * Calcula crédito de PIS
 * @param valorProduto - Valor do produto
 * @param aliquotaPIS - Alíquota do PIS (ex: 1.65 para 1.65%)
 * @returns Valor do crédito de PIS
 */
export function calcularCreditoPISCOFINS(valorProduto: number, aliquotaPIS: number = 1.65): number {
  return valorProduto * (aliquotaPIS / 100);
}

/**
 * Calcula crédito de COFINS
 * @param valorProduto - Valor do produto
 * @param aliquotaCOFINS - Alíquota da COFINS (ex: 7.6 para 7.6%)
 * @returns Valor do crédito de COFINS
 */
export function calcularCreditoCOFINS(valorProduto: number, aliquotaCOFINS: number = 7.6): number {
  return valorProduto * (aliquotaCOFINS / 100);
}

/**
 * Calcula Substituição Tributária (ST)
 * @param valorProduto - Valor do produto
 * @param aliquotaInterna - Alíquota interna do estado (ex: 18%)
 * @param aliquotaST - Alíquota de ST (ex: 40%)
 * @returns Valor da ST
 */
export function calcularST(valorProduto: number, aliquotaInterna: number, aliquotaST: number): number {
  const baseST = valorProduto * (1 + aliquotaST / 100);
  const stDevida = baseST * (aliquotaInterna / 100);
  return stDevida;
}

/**
 * Calcula DIFAL (Diferencial de Alíquota)
 * @param valorProduto - Valor do produto
 * @param aliquotaOrigem - Alíquota do estado de origem
 * @param aliquotaDestino - Alíquota do estado de destino
 * @returns Valor do DIFAL
 */
export function calcularDIFAL(valorProduto: number, aliquotaOrigem: number, aliquotaDestino: number): number {
  const icmsOrigem = valorProduto * (aliquotaOrigem / 100);
  const icmsDestino = valorProduto * (aliquotaDestino / 100);
  return Math.max(0, icmsDestino - icmsOrigem);
}

/**
 * Simula qual regime tributário é mais vantajoso
 * @param faturamentoMensal - Faturamento mensal da empresa
 * @param despesas - Despesas mensais dedutíveis
 * @param aliquotaSimples - Alíquota efetiva do Simples Nacional
 * @param aliquotaPresumido - Alíquota do Lucro Presumido
 * @returns Objeto com resultados da simulação
 */
export function simularRegime(
  faturamentoMensal: number,
  despesas: number,
  aliquotaSimples: number,
  aliquotaPresumido: number
) {
  // Simples Nacional: imposto sobre faturamento bruto
  const cargaSimples = faturamentoMensal * aliquotaSimples;

  // Lucro Presumido: 32% de margem presumida para comércio
  const lucroPresumido = faturamentoMensal * 0.32;
  const cargaPresumido = lucroPresumido * aliquotaPresumido;

  // Lucro Real: imposto sobre lucro efetivo
  const lucroReal = Math.max(0, faturamentoMensal - despesas);
  const cargaReal = lucroReal * 0.15; // 15% IRPJ + 9% CSLL = ~24%, simplificado

  const melhorRegime = Math.min(cargaSimples, cargaPresumido, cargaReal);
  let regimeMelhor = "Simples Nacional";
  if (melhorRegime === cargaPresumido) regimeMelhor = "Lucro Presumido";
  if (melhorRegime === cargaReal) regimeMelhor = "Lucro Real";

  return {
    simples: cargaSimples,
    presumido: cargaPresumido,
    real: cargaReal,
    melhorRegime,
    economia: Math.abs(cargaSimples - melhorRegime),
    economiaAnual: Math.abs(cargaSimples - melhorRegime) * 12,
  };
}

/**
 * Calcula impostos de uma venda
 * @param valorVenda - Valor total da venda
 * @param regime - Regime tributário
 * @returns Objeto com todos os impostos calculados
 */
export function calcularImpostosVenda(valorVenda: number, regime: string) {
  const impostos: Record<string, number> = {};

  switch (regime) {
    case "simples":
      // Simples Nacional: alíquota varia por faixa (simplificado aqui)
      const aliquotaSimples = 0.147; // 14.7% médio para varejo
      impostos.das = valorVenda * aliquotaSimples;
      break;

    case "presumido":
      // Lucro Presumido
      impostos.icms = valorVenda * 0.18;
      impostos.pis = valorVenda * 0.0165;
      impostos.cofins = valorVenda * 0.076;
      impostos.irpj = valorVenda * 0.32 * 0.15;
      impostos.csll = valorVenda * 0.32 * 0.09;
      impostos.total = impostos.icms + impostos.pis + impostos.cofins + impostos.irpj + impostos.csll;
      break;

    case "real":
      // Lucro Real (aproximação)
      impostos.icms = valorVenda * 0.18;
      impostos.pis = valorVenda * 0.0165;
      impostos.cofins = valorVenda * 0.076;
      impostos.total = impostos.icms + impostos.pis + impostos.cofins;
      break;

    default:
      impostos.total = 0;
  }

  return impostos;
}

/**
 * Calcula a economia anual com planejamento tributário
 * @param faturamentoMensal - Faturamento mensal
 * @param aliquotaAtual - Alíquota atual paga
 * @param aliquotaOtimizada - Alíquota otimizada
 * @returns Objeto com economia mensal e anual
 */
export function calcularEconomia(faturamentoMensal: number, aliquotaAtual: number, aliquotaOtimizada: number) {
  const impostoAtual = faturamentoMensal * aliquotaAtual;
  const impostoOtimizado = faturamentoMensal * aliquotaOtimizada;
  const economiaMensal = impostoAtual - impostoOtimizado;

  return {
    mensal: economiaMensal,
    anual: economiaMensal * 12,
    percentual: ((aliquotaAtual - aliquotaOtimizada) / aliquotaAtual) * 100,
  };
}
