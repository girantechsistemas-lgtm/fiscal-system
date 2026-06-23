// ============================================================
// TABELA DE NCMs - Referência para Cálculos Tributários
// ============================================================

export interface NCMItem {
  codigo: string;
  descricao: string;
  aliquotaICMS: number;
  aliquotaIPI: number;
  stObrigatorio: boolean;
  observacoes?: string;
}

export const NCM_TABLE: NCMItem[] = [
  // Alimentos Básicos
  { codigo: "10063020", descricao: "Arroz", aliquotaICMS: 18, aliquotaIPI: 0, stObrigatorio: true, observacoes: "Substituição tributária" },
  { codigo: "07133319", descricao: "Feijão Carioca", aliquotaICMS: 18, aliquotaIPI: 0, stObrigatorio: false },
  { codigo: "11010010", descricao: "Farinha de Trigo", aliquotaICMS: 18, aliquotaIPI: 0, stObrigatorio: true },
  { codigo: "17019900", descricao: "Açúcar", aliquotaICMS: 18, aliquotaIPI: 0, stObrigatorio: true },

  // Óleos e Gorduras
  { codigo: "15079011", descricao: "Óleo de Soja", aliquotaICMS: 18, aliquotaIPI: 0, stObrigatorio: true, observacoes: "Substituição tributária" },
  { codigo: "15162000", descricao: "Margarina", aliquotaICMS: 18, aliquotaIPI: 0, stObrigatorio: true },

  // Carnes e Laticínios
  { codigo: "02013000", descricao: "Carne Bovina", aliquotaICMS: 18, aliquotaIPI: 0, stObrigatorio: true, observacoes: "ST obrigatória para carnes" },
  { codigo: "02071100", descricao: "Carne de Frango", aliquotaICMS: 18, aliquotaIPI: 0, stObrigatorio: true },
  { codigo: "04012020", descricao: "Leite Integral", aliquotaICMS: 18, aliquotaIPI: 0, stObrigatorio: true, observacoes: "Substituição tributária" },
  { codigo: "04022100", descricao: "Leite em Pó", aliquotaICMS: 18, aliquotaIPI: 0, stObrigatorio: true },
  { codigo: "04051000", descricao: "Manteiga", aliquotaICMS: 18, aliquotaIPI: 0, stObrigatorio: true },
  { codigo: "04061000", descricao: "Queijo Mussarela", aliquotaICMS: 18, aliquotaIPI: 0, stObrigatorio: true },

  // Bebidas
  { codigo: "09011100", descricao: "Café Torrado", aliquotaICMS: 18, aliquotaIPI: 0, stObrigatorio: false },
  { codigo: "22011000", descricao: "Água Mineral", aliquotaICMS: 12, aliquotaIPI: 0, stObrigatorio: false },
  { codigo: "22021000", descricao: "Refrigerantes", aliquotaICMS: 18, aliquotaIPI: 15, stObrigatorio: true, observacoes: "IPI + ST" },
  { codigo: "22030000", descricao: "Cerveja", aliquotaICMS: 18, aliquotaIPI: 10, stObrigatorio: true },
  { codigo: "22042100", descricao: "Vinho de Mesa", aliquotaICMS: 18, aliquotaIPI: 0, stObrigatorio: false },

  // Higiene e Limpeza
  { codigo: "34011100", descricao: "Sabão em Pó", aliquotaICMS: 18, aliquotaIPI: 0, stObrigatorio: true },
  { codigo: "34022000", descricao: "Detergente", aliquotaICMS: 18, aliquotaIPI: 0, stObrigatorio: true },
  { codigo: "96190000", descricao: "Fralda Descartável", aliquotaICMS: 18, aliquotaIPI: 0, stObrigatorio: false },

  // Hortifruti
  { codigo: "07139000", descricao: "Outras Leguminosas", aliquotaICMS: 12, aliquotaIPI: 0, stObrigatorio: false },
  { codigo: "08039000", descricao: "Banana", aliquotaICMS: 12, aliquotaIPI: 0, stObrigatorio: false },
  { codigo: "07131000", descricao: "Ervilha", aliquotaICMS: 12, aliquotaIPI: 0, stObrigatorio: false },

  // Produtos de Limpeza
  { codigo: "34029000", descricao: "Outros Produtos de Limpeza", aliquotaICMS: 18, aliquotaIPI: 0, stObrigatorio: false },
];

/**
 * Busca NCM por código
 */
export function buscarNCM(codigo: string): NCMItem | undefined {
  return NCM_TABLE.find((item) => item.codigo === codigo);
}

/**
 * Busca NCMs por descrição (busca parcial)
 */
export function buscarNCMPorDescricao(descricao: string): NCMItem[] {
  const termo = descricao.toLowerCase();
  return NCM_TABLE.filter((item) => item.descricao.toLowerCase().includes(termo));
}

/**
 * Retorna todos os NCMs com ST obrigatório
 */
export function listarNCMsComST(): NCMItem[] {
  return NCM_TABLE.filter((item) => item.stObrigatorio);
}

/**
 * Retorna NCMs de um grupo específico
 */
export function listarNCMsPorGrupo(grupo: string): NCMItem[] {
  const grupos: Record<string, string[]> = {
    "alimentos": ["10063020", "07133319", "11010010", "17019900"],
    "carnes": ["02013000", "02071100"],
    "laticinios": ["04012020", "04022100", "04051000", "04061000"],
    "bebidas": ["09011100", "22011000", "22021000", "22030000", "22042100"],
    "limpeza": ["34011100", "34022000", "34029000"],
  };

  const codigos = grupos[grupo.toLowerCase()] || [];
  return NCM_TABLE.filter((item) => codigos.includes(item.codigo));
}
