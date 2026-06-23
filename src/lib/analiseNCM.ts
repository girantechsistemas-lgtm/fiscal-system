/**
 * Módulo de Análise de NCM - Nomenclatura Comum do Mercosul
 * Sistema de Planejamento Tributário para Restaurantes/Bares/Indústria Alimentícia
 *
 * Este módulo contém a base de dados de NCMs com alíquotas tributárias
 * e funções de análise para sugestão de reenquadramento fiscal.
 */

// =============================================================================
// INTERFACES
// =============================================================================

/** Entrada de NCM na base de dados */
export interface NCMEntrada {
  codigo: string;
  descricao: string;
  aliquotaICMS: number;
  aliquotaIPI: number;
  stObrigatorio: boolean;
  cstPis: string;
  cstCofins: string;
  grupo: string;
  observacoes: string;
}

/** Resultado da análise de reenquadramento de produto */
export interface AnaliseNCM {
  produtoId: number;
  nomeProduto: string;
  ncmAtual: string;
  ncmSugerido: string | null;
  descricaoNCMSugerido: string;
  aliquotaAtual: number;
  aliquotaSugerida: number;
  economiaPercentual: number;
  economiaMensal: number;
  nivelRisco: 'baixo' | 'medio' | 'alto';
  observacao: string;
}

// =============================================================================
// BASE DE DADOS DE NCMs
// =============================================================================

/**
 * Base de dados abrangente de NCMs com alíquotas tributárias.
 * Cobertura: Bebidas, Alimentos, Limpeza e Embalagens.
 * Nota: Alíquotas podem variar conforme estado (contribuinte/indicado).
 * Valores apresentados referem-se à situação padrão nacional.
 */
const bancoNCM: NCMEntrada[] = [
  // ===========================================================================
  // BEBIDAS ALCOÓLICAS (Cap. 22)
  // ===========================================================================
  {
    codigo: '22030000',
    descricao: 'Cerveja de malte',
    aliquotaICMS: 18,
    aliquotaIPI: 0,
    stObrigatorio: true,
    cstPis: '01',
    cstCofins: '01',
    grupo: 'Bebidas',
    observacoes: 'Cerveja artesanal pode ter enquadramento tributário diferenciado',
  },
  {
    codigo: '22041000',
    descricao: 'Vinhos de uvas frescas',
    aliquotaICMS: 18,
    aliquotaIPI: 0,
    stObrigatorio: true,
    cstPis: '01',
    cstCofins: '01',
    grupo: 'Bebidas',
    observacoes: 'Vinhos nacionais com selo de procedência',
  },
  {
    codigo: '22042100',
    descricao: 'Vinhos de uvas frescas, em recipientes <= 2L',
    aliquotaICMS: 18,
    aliquotaIPI: 0,
    stObrigatorio: true,
    cstPis: '01',
    cstCofins: '01',
    grupo: 'Bebidas',
    observacoes: 'Garrafas comuns e premium',
  },
  {
    codigo: '22042900',
    descricao: 'Vinhos de uvas frescas, em recipientes > 2L',
    aliquotaICMS: 18,
    aliquotaIPI: 0,
    stObrigatorio: true,
    cstPis: '01',
    cstCofins: '01',
    grupo: 'Bebidas',
    observacoes: 'Litro ou garrafaão - custo por litro inferior',
  },
  {
    codigo: '22043000',
    descricao: 'Mostos de uvas',
    aliquotaICMS: 18,
    aliquotaIPI: 0,
    stObrigatorio: true,
    cstPis: '01',
    cstCofins: '01',
    grupo: 'Bebidas',
    observacoes: 'Matéria-prima para vinificação',
  },
  {
    codigo: '22051000',
    descricao: 'Vermutes em recipientes <= 2L',
    aliquotaICMS: 18,
    aliquotaIPI: 0,
    stObrigatorio: true,
    cstPis: '01',
    cstCofins: '01',
    grupo: 'Bebidas',
    observacoes: 'Vermute e apéritivos à base de vinho',
  },
  {
    codigo: '22059000',
    descricao: 'Outros vinhos enriquecidos',
    aliquotaICMS: 18,
    aliquotaIPI: 0,
    stObrigatorio: true,
    cstPis: '01',
    cstCofins: '01',
    grupo: 'Bebidas',
    observacoes: 'Demais bebidas à base de vinho',
  },
  {
    codigo: '22060010',
    descricao: 'Licores e其它 bebidas fermentadas',
    aliquotaICMS: 18,
    aliquotaIPI: 0,
    stObrigatorio: true,
    cstPis: '01',
    cstCofins: '01',
    grupo: 'Bebidas',
    observacoes: 'Licor, cachaça, sake e similares',
  },
  {
    codigo: '22060090',
    descricao: 'Outras bebidas fermentadas não especificadas',
    aliquotaICMS: 18,
    aliquotaIPI: 0,
    stObrigatorio: true,
    cstPis: '01',
    cstCofins: '01',
    grupo: 'Bebidas',
    observacoes: 'Combinações de bebidas fermentadas',
  },
  {
    codigo: '22082000',
    descricao: 'Aguardantes de vinho ou bagaceira',
    aliquotaICMS: 18,
    aliquotaIPI: 15,
    stObrigatorio: true,
    cstPis: '01',
    cstCofins: '01',
    grupo: 'Bebidas',
    observacoes: 'Cachaça artesanal e industrial',
  },
  {
    codigo: '22083010',
    descricao: 'Uísque de whisky de malte',
    aliquotaICMS: 18,
    aliquotaIPI: 15,
    stObrigatorio: true,
    cstPis: '01',
    cstCofins: '01',
    grupo: 'Bebidas',
    observacoes: 'Scotch whisky e similares importados',
  },
  {
    codigo: '22083020',
    descricao: 'Uísque de outros',
    aliquotaICMS: 18,
    aliquotaIPI: 15,
    stObrigatorio: true,
    cstPis: '01',
    cstCofins: '01',
    grupo: 'Bebidas',
    observacoes: 'Whisky nacional e blends',
  },
  {
    codigo: '22084000',
    descricao: 'Rum e outras aguardentes de cana-de-açúcar',
    aliquotaICMS: 18,
    aliquotaIPI: 15,
    stObrigatorio: true,
    cstPis: '01',
    cstCofins: '01',
    grupo: 'Bebidas',
    observacoes: 'Rum, grappa e aguardentes diversas',
  },
  {
    codigo: '22085000',
    descricao: 'Gim e genebra',
    aliquotaICMS: 18,
    aliquotaIPI: 15,
    stObrigatorio: true,
    cstPis: '01',
    cstCofins: '01',
    grupo: 'Bebidas',
    observacoes: 'Gin destilado com botânicos',
  },
  {
    codigo: '22086000',
    descricao: 'Vodka',
    aliquotaICMS: 18,
    aliquotaIPI: 15,
    stObrigatorio: true,
    cstPis: '01',
    cstCofins: '01',
    grupo: 'Bebidas',
    observacoes: 'Vodka nacional e importado',
  },
  {
    codigo: '22087000',
    descricao: 'Licores',
    aliquotaICMS: 18,
    aliquotaIPI: 15,
    stObrigatorio: true,
    cstPis: '01',
    cstCofins: '01',
    grupo: 'Bebidas',
    observacoes: 'Aperitivos, licor de café, chocolate etc.',
  },
  {
    codigo: '22089000',
    descricao: 'Outras bebidas destiladas',
    aliquotaICMS: 18,
    aliquotaIPI: 15,
    stObrigatorio: true,
    cstPis: '01',
    cstCofins: '01',
    grupo: 'Bebidas',
    observacoes: 'Conhaque, tequila, sambuca e similares',
  },
  // ===========================================================================
  // BEBIDAS NÃO ALCOÓLICAS (Cap. 22)
  // ===========================================================================
  {
    codigo: '22011000',
    descricao: 'Águas minerais naturais, com gás',
    aliquotaICMS: 12,
    aliquotaIPI: 0,
    stObrigatorio: true,
    cstPis: '01',
    cstCofins: '01',
    grupo: 'Bebidas',
    observacoes: 'Água mineral com gás - alíquota reduzida',
  },
  {
    codigo: '22019000',
    descricao: 'Águas minerais naturais, sem gás',
    aliquotaICMS: 12,
    aliquotaIPI: 0,
    stObrigatorio: true,
    cstPis: '01',
    cstCofins: '01',
    grupo: 'Bebidas',
    observacoes: 'Água mineral sem gás - alíquota reduzida',
  },
  {
    codigo: '22021000',
    descricao: 'Águas com gás artificialmente carbonatadas',
    aliquotaICMS: 18,
    aliquotaIPI: 0,
    stObrigatorio: true,
    cstPis: '01',
    cstCofins: '01',
    grupo: 'Bebidas',
    observacoes: 'Água tonica, seltzer e similares',
  },
  {
    codigo: '22029900',
    descricao: 'Outras águas minerais e potáveis',
    aliquotaICMS: 12,
    aliquotaIPI: 0,
    stObrigatorio: true,
    cstPis: '01',
    cstCofins: '01',
    grupo: 'Bebidas',
    observacoes: 'Água de mesa e sabores',
  },
  {
    codigo: '22029100',
    descricao: 'Refrigerantes',
    aliquotaICMS: 18,
    aliquotaIPI: 0,
    stObrigatorio: true,
    cstPis: '01',
    cstCofins: '01',
    grupo: 'Bebidas',
    observacoes: 'Refrigerantes de colas, laranja, etc.',
  },
  {
    codigo: '20091100',
    descricao: 'Sucos de laranja, congelados',
    aliquotaICMS: 12,
    aliquotaIPI: 0,
    stObrigatorio: true,
    cstPis: '01',
    cstCofins: '01',
    grupo: 'Bebidas',
    observacoes: 'Suco de laranja congelado - não concentrado',
  },
  {
    codigo: '20091900',
    descricao: 'Outros sumos de frutas, congelados',
    aliquotaICMS: 12,
    aliquotaIPI: 0,
    stObrigatorio: true,
    cstPis: '01',
    cstCofins: '01',
    grupo: 'Bebidas',
    observacoes: 'Sucos de frutas diversas congelados',
  },
  {
    codigo: '20098900',
    descricao: 'Outros sumos de frutas',
    aliquotaICMS: 12,
    aliquotaIPI: 0,
    stObrigatorio: true,
    cstPis: '01',
    cstCofins: '01',
    grupo: 'Bebidas',
    observacoes: 'Sucos prontos e néctares',
  },
  {
    codigo: '21069010',
    descricao: 'Pré-misturas para bebidas',
    aliquotaICMS: 18,
    aliquotaIPI: 0,
    stObrigatorio: true,
    cstPis: '01',
    cstCofins: '01',
    grupo: 'Bebidas',
    observacoes: 'Concentrados para preparação de bebidas',
  },
  // ===========================================================================
  // CAFÉ E CHÁ (Cap. 09)
  // ===========================================================================
  {
    codigo: '09011110',
    descricao: 'Café torrado, não moído, sem descafeinar',
    aliquotaICMS: 12,
    aliquotaIPI: 0,
    stObrigatorio: false,
    cstPis: '01',
    cstCofins: '01',
    grupo: 'Alimentos',
    observacoes: 'Café em grão - alíquota reduzida para alimentação',
  },
  {
    codigo: '09011200',
    descricao: 'Café torrado, moído, sem descafeinar',
    aliquotaICMS: 12,
    aliquotaIPI: 0,
    stObrigatorio: false,
    cstPis: '01',
    cstCofins: '01',
    grupo: 'Alimentos',
    observacoes: 'Café moído para consumo imediato',
  },
  {
    codigo: '09012100',
    descricao: 'Café torrado, não moído, descafeinado',
    aliquotaICMS: 12,
    aliquotaIPI: 0,
    stObrigatorio: false,
    cstPis: '01',
    cstCofins: '01',
    grupo: 'Alimentos',
    observacoes: 'Café descafeinado em grão',
  },
  {
    codigo: '09012200',
    descricao: 'Café torrado, moído, descafeinado',
    aliquotaICMS: 12,
    aliquotaIPI: 0,
    stObrigatorio: false,
    cstPis: '01',
    cstCofins: '01',
    grupo: 'Alimentos',
    observacoes: 'Café descafeinado moído',
  },
  {
    codigo: '09021000',
    descricao: 'Chá verde (não fermentado), em embalagens <= 3kg',
    aliquotaICMS: 12,
    aliquotaIPI: 0,
    stObrigatorio: false,
    cstPis: '01',
    cstCofins: '01',
    grupo: 'Alimentos',
    observacoes: 'Chá verde para preparo',
  },
  {
    codigo: '09022000',
    descricao: 'Outros chás fermentados parcialmente',
    aliquotaICMS: 12,
    aliquotaIPI: 0,
    stObrigatorio: false,
    cstPis: '01',
    cstCofins: '01',
    grupo: 'Alimentos',
    observacoes: 'Chá preto, oolong e especiados',
  },
  // ===========================================================================
  // CARNES E PROTEÍNAS (Cap. 02)
  // ===========================================================================
  {
    codigo: '02011000',
    descricao: 'Carne bovina, fresca ou refrigerada, de animais < 1 ano',
    aliquotaICMS: 18,
    aliquotaIPI: 0,
    stObrigatorio: true,
    cstPis: '01',
    cstCofins: '01',
    grupo: 'Alimentos',
    observacoes: 'Cortes nobres e comuns - ST obrigatório',
  },
  {
    codigo: '02012000',
    descricao: 'Carne bovina, fresca, de animais >= 1 ano',
    aliquotaICMS: 18,
    aliquotaIPI: 0,
    stObrigatorio: true,
    cstPis: '01',
    cstCofins: '01',
    grupo: 'Alimentos',
    observacoes: 'Cortes de animais adultos',
  },
  {
    codigo: '02021000',
    descricao: 'Carne bovina congelada, com osso',
    aliquotaICMS: 18,
    aliquotaIPI: 0,
    stObrigatorio: true,
    cstPis: '01',
    cstCofins: '01',
    grupo: 'Alimentos',
    observacoes: 'Carne bovina congelada com osso',
  },
  {
    codigo: '02022000',
    descricao: 'Carne bovina congelada, sem osso',
    aliquotaICMS: 18,
    aliquotaIPI: 0,
    stObrigatorio: true,
    cstPis: '01',
    cstCofins: '01',
    grupo: 'Alimentos',
    observacoes: 'Cortes nobres congelados',
  },
  {
    codigo: '02071100',
    descricao: 'Fígado de aves, fresco ou refrig.',
    aliquotaICMS: 18,
    aliquotaIPI: 0,
    stObrigatorio: true,
    cstPis: '01',
    cstCofins: '01',
    grupo: 'Alimentos',
    observacoes: 'Miúdos de frango',
  },
  {
    codigo: '02071200',
    descricao: 'Fígado de aves, congelado',
    aliquotaICMS: 18,
    aliquotaIPI: 0,
    stObrigatorio: true,
    cstPis: '01',
    cstCofins: '01',
    grupo: 'Alimentos',
    observacoes: 'Miúdos de frango congelados',
  },
  {
    codigo: '02071300',
    descricao: 'Outras carnes e miúdos de aves, frescos',
    aliquotaICMS: 18,
    aliquotaIPI: 0,
    stObrigatorio: true,
    cstPis: '01',
    cstCofins: '01',
    grupo: 'Alimentos',
    observacoes: 'Peitos, coxas e sobrecoxas de frango',
  },
  {
    codigo: '02071400',
    descricao: 'Outras carnes e miúdos de aves, congelados',
    aliquotaICMS: 18,
    aliquotaIPI: 0,
    stObrigatorio: true,
    cstPis: '01',
    cstCofins: '01',
    grupo: 'Alimentos',
    observacoes: 'Cortes de frango congelados',
  },
  {
    codigo: '02041000',
    descricao: 'Carne de cordeiro, fresca ou refrigerada',
    aliquotaICMS: 18,
    aliquotaIPI: 0,
    stObrigatorio: true,
    cstPis: '01',
    cstCofins: '01',
    grupo: 'Alimentos',
    observacoes: 'Carne de cordeiro fresca',
  },
  {
    codigo: '02042100',
    descricao: 'Carne de cordeiro, congelada, com osso',
    aliquotaICMS: 18,
    aliquotaIPI: 0,
    stObrigatorio: true,
    cstPis: '01',
    cstCofins: '01',
    grupo: 'Alimentos',
    observacoes: 'Carne de cordeiro congelada com osso',
  },
  {
    codigo: '02042200',
    descricao: 'Carne de cordeiro, congelada, sem osso',
    aliquotaICMS: 18,
    aliquotaIPI: 0,
    stObrigatorio: true,
    cstPis: '01',
    cstCofins: '01',
    grupo: 'Alimentos',
    observacoes: 'Carne de cordeiro congelada sem osso',
  },
  {
    codigo: '02031100',
    descricao: 'Carne de suínos, fresca ou refrigerada',
    aliquotaICMS: 18,
    aliquotaIPI: 0,
    stObrigatorio: true,
    cstPis: '01',
    cstCofins: '01',
    grupo: 'Alimentos',
    observacoes: 'Lombo, costela e pernil de porco',
  },
  {
    codigo: '02031200',
    descricao: 'Carne de suínos, congelada',
    aliquotaICMS: 18,
    aliquotaIPI: 0,
    stObrigatorio: true,
    cstPis: '01',
    cstCofins: '01',
    grupo: 'Alimentos',
    observacoes: 'Carne suína congelada',
  },
  // ===========================================================================
  // PRODUTOS DE ORIGEM ANIMAL (Cap. 04)
  // ===========================================================================
  {
    codigo: '04011000',
    descricao: 'Leite fresco, não concentrado, com gordura <= 1%',
    aliquotaICMS: 12,
    aliquotaIPI: 0,
    stObrigatorio: false,
    cstPis: '01',
    cstCofins: '01',
    grupo: 'Alimentos',
    observacoes: 'Leite desnatado - alíquota reduzida',
  },
  {
    codigo: '04012000',
    descricao: 'Leite fresco, com gordura > 1% e <= 6%',
    aliquotaICMS: 12,
    aliquotaIPI: 0,
    stObrigatorio: false,
    cstPis: '01',
    cstCofins: '01',
    grupo: 'Alimentos',
    observacoes: 'Leite integral - alíquota reduzida',
  },
  {
    codigo: '04021010',
    descricao: 'Leite em pó, com gordura <= 1,5%',
    aliquotaICMS: 12,
    aliquotaIPI: 0,
    stObrigatorio: false,
    cstPis: '01',
    cstCofins: '01',
    grupo: 'Alimentos',
    observacoes: 'Leite em pó desnatado',
  },
  {
    codigo: '04022100',
    descricao: 'Leite em pó, com gordura > 1,5%',
    aliquotaICMS: 12,
    aliquotaIPI: 0,
    stObrigatorio: false,
    cstPis: '01',
    cstCofins: '01',
    grupo: 'Alimentos',
    observacoes: 'Leite em pó integral',
  },
  {
    codigo: '04061000',
    descricao: 'Queijo fresco "mozzarella"',
    aliquotaICMS: 12,
    aliquotaIPI: 0,
    stObrigatorio: false,
    cstPis: '01',
    cstCofins: '01',
    grupo: 'Alimentos',
    observacoes: 'Mozzarella e queijos frescos',
  },
  {
    codigo: '04069000',
    descricao: 'Outros queijos',
    aliquotaICMS: 12,
    aliquotaIPI: 0,
    stObrigatorio: false,
    cstPis: '01',
    cstCofins: '01',
    grupo: 'Alimentos',
    observacoes: 'Queijos curados, processados e fundidos',
  },
  {
    codigo: '04031000',
    descricao: 'Iogurte',
    aliquotaICMS: 12,
    aliquotaIPI: 0,
    stObrigatorio: false,
    cstPis: '01',
    cstCofins: '01',
    grupo: 'Alimentos',
    observacoes: 'Iogurte natural e com sabores',
  },
  {
    codigo: '04039000',
    descricao: 'Outros leites fermentados',
    aliquotaICMS: 12,
    aliquotaIPI: 0,
    stObrigatorio: false,
    cstPis: '01',
    cstCofins: '01',
    grupo: 'Alimentos',
    observacoes: 'Kefir, leite fermentado probiótico',
  },
  // ===========================================================================
  // VERDURAS E LEGUMES (Cap. 07)
  // ===========================================================================
  {
    codigo: '07011000',
    descricao: 'Batatas frescas',
    aliquotaICMS: 12,
    aliquotaIPI: 0,
    stObrigatorio: false,
    cstPis: '01',
    cstCofins: '01',
    grupo: 'Alimentos',
    observacoes: 'Batata para processamento ou consumo direto',
  },
  {
    codigo: '07031000',
    descricao: 'Cebolas frescas',
    aliquotaICMS: 12,
    aliquotaIPI: 0,
    stObrigatorio: false,
    cstPis: '01',
    cstCofins: '01',
    grupo: 'Alimentos',
    observacoes: 'Cebola branca e roxa',
  },
  {
    codigo: '07032000',
    descricao: 'Alhos frescos',
    aliquotaICMS: 12,
    aliquotaIPI: 0,
    stObrigatorio: false,
    cstPis: '01',
    cstCofins: '01',
    grupo: 'Alimentos',
    observacoes: 'Alho em cabeças',
  },
  {
    codigo: '07069000',
    descricao: 'Outras raízes e tubérculos frescos',
    aliquotaICMS: 12,
    aliquotaIPI: 0,
    stObrigatorio: false,
    cstPis: '01',
    cstCofins: '01',
    grupo: 'Alimentos',
    observacoes: 'Mandioca, batata-doce, cenoura etc.',
  },
  {
    codigo: '07091000',
    descricao: 'Espinafres frescos',
    aliquotaICMS: 12,
    aliquotaIPI: 0,
    stObrigatorio: false,
    cstPis: '01',
    cstCofins: '01',
    grupo: 'Alimentos',
    observacoes: 'Hortaliças de folha',
  },
  {
    codigo: '07099000',
    descricao: 'Outras hortaliças frescas',
    aliquotaICMS: 12,
    aliquotaIPI: 0,
    stObrigatorio: false,
    cstPis: '01',
    cstCofins: '01',
    grupo: 'Alimentos',
    observacoes: 'Alface, rúcula, agrião etc.',
  },
  // ===========================================================================
  // FARINHAS E MASSAS (Cap. 11)
  // ===========================================================================
  {
    codigo: '11010010',
    descricao: 'Farinha de trigo',
    aliquotaICMS: 12,
    aliquotaIPI: 0,
    stObrigatorio: false,
    cstPis: '01',
    cstCofins: '01',
    grupo: 'Alimentos',
    observacoes: 'Farinha de trigo comum e especial',
  },
  {
    codigo: '19019000',
    descricao: 'Massas alimentícias, não cozidas',
    aliquotaICMS: 12,
    aliquotaIPI: 0,
    stObrigatorio: false,
    cstPis: '01',
    cstCofins: '01',
    grupo: 'Alimentos',
    observacoes: 'Macarrão, espaguete, penne etc.',
  },
  {
    codigo: '19021100',
    descricao: 'Macarrão recheado, não cozido',
    aliquotaICMS: 12,
    aliquotaIPI: 0,
    stObrigatorio: false,
    cstPis: '01',
    cstCofins: '01',
    grupo: 'Alimentos',
    observacoes: 'Nhoque, raviole e massas recheadas',
  },
  {
    codigo: '11029000',
    descricao: 'Outras farinhas',
    aliquotaICMS: 12,
    aliquotaIPI: 0,
    stObrigatorio: false,
    cstPis: '01',
    cstCofins: '01',
    grupo: 'Alimentos',
    observacoes: 'Farinha de milho, arroz, mandioca etc.',
  },
  // ===========================================================================
  // ÓLEOS E GORDURAS (Cap. 15)
  // ===========================================================================
  {
    codigo: '15091000',
    descricao: 'Azeite de oliva virgem',
    aliquotaICMS: 12,
    aliquotaIPI: 0,
    stObrigatorio: false,
    cstPis: '01',
    cstCofins: '01',
    grupo: 'Alimentos',
    observacoes: 'Azeite extra virgem - alíquota reduzida',
  },
  {
    codigo: '15099000',
    descricao: 'Outros azeites de oliva',
    aliquotaICMS: 12,
    aliquotaIPI: 0,
    stObrigatorio: false,
    cstPis: '01',
    cstCofins: '01',
    grupo: 'Alimentos',
    observacoes: 'Azeite refinado e lampante',
  },
  {
    codigo: '15111000',
    descricao: 'Óleo de soja refinado',
    aliquotaICMS: 12,
    aliquotaIPI: 0,
    stObrigatorio: false,
    cstPis: '01',
    cstCofins: '01',
    grupo: 'Alimentos',
    observacoes: 'Óleo de soja para frituras',
  },
  {
    codigo: '15171000',
    descricao: 'Margarina',
    aliquotaICMS: 12,
    aliquotaIPI: 0,
    stObrigatorio: false,
    cstPis: '01',
    cstCofins: '01',
    grupo: 'Alimentos',
    observacoes: 'Margarina comum e light',
  },
  // ===========================================================================
  // AÇÚCAR E PRODUTOS DE CONFEITARIA (Cap. 17)
  // ===========================================================================
  {
    codigo: '17011400',
    descricao: 'Açúcar de cana, em bruto',
    aliquotaICMS: 12,
    aliquotaIPI: 0,
    stObrigatorio: false,
    cstPis: '01',
    cstCofins: '01',
    grupo: 'Alimentos',
    observacoes: 'Açúcar cristal e demerara',
  },
  {
    codigo: '17019100',
    descricao: 'Açúcar refinado',
    aliquotaICMS: 12,
    aliquotaIPI: 0,
    stObrigatorio: false,
    cstPis: '01',
    cstCofins: '01',
    grupo: 'Alimentos',
    observacoes: 'Açúcar refinado para uso geral',
  },
  {
    codigo: '18063200',
    descricao: 'Chocolate em barras preenchido',
    aliquotaICMS: 18,
    aliquotaIPI: 0,
    stObrigatorio: true,
    cstPis: '01',
    cstCofins: '01',
    grupo: 'Alimentos',
    observacoes: 'Chocolate com recheio - ST aplicável',
  },
  {
    codigo: '18069000',
    descricao: 'Outros produtos de chocolate',
    aliquotaICMS: 18,
    aliquotaIPI: 0,
    stObrigatorio: true,
    cstPis: '01',
    cstCofins: '01',
    grupo: 'Alimentos',
    observacoes: 'Bombons, trufas e confeitaria',
  },
  // ===========================================================================
  // ALIMENTOS PREPARADOS (Cap. 19 e 20)
  // ===========================================================================
  {
    codigo: '19053100',
    descricao: 'Bolachas e biscoitos com açúcar',
    aliquotaICMS: 18,
    aliquotaIPI: 0,
    stObrigatorio: true,
    cstPis: '01',
    cstCofins: '01',
    grupo: 'Alimentos',
    observacoes: 'Biscoitos doces e recheados',
  },
  {
    codigo: '19059090',
    descricao: 'Outros produtos de padaria e pastelaria',
    aliquotaICMS: 18,
    aliquotaIPI: 0,
    stObrigatorio: true,
    cstPis: '01',
    cstCofins: '01',
    grupo: 'Alimentos',
    observacoes: 'Pães, bolos e produtos de confeitaria',
  },
  {
    codigo: '20059900',
    descricao: 'Outros legumes preparados ou conservados',
    aliquotaICMS: 18,
    aliquotaIPI: 0,
    stObrigatorio: true,
    cstPis: '01',
    cstCofins: '01',
    grupo: 'Alimentos',
    observacoes: 'Legumes em conserva, pickles etc.',
  },
  {
    codigo: '20029900',
    descricao: 'Outros frutos preparados ou conservados',
    aliquotaICMS: 18,
    aliquotaIPI: 0,
    stObrigatorio: true,
    cstPis: '01',
    cstCofins: '01',
    grupo: 'Alimentos',
    observacoes: 'Frutas cristalizadas, compotas',
  },
  {
    codigo: '20049000',
    descricao: 'Outros legumes e hortaliças preparados',
    aliquotaICMS: 18,
    aliquotaIPI: 0,
    stObrigatorio: true,
    cstPis: '01',
    cstCofins: '01',
    grupo: 'Alimentos',
    observacoes: 'Milho verde, ervilha, feijão em conserva',
  },
  {
    codigo: '21069090',
    descricao: 'Outras preparações alimentícias',
    aliquotaICMS: 18,
    aliquotaIPI: 0,
    stObrigatorio: true,
    cstPis: '01',
    cstCofins: '01',
    grupo: 'Alimentos',
    observacoes: 'Molhos, temperos e preparações diversas',
  },
  {
    codigo: '21039000',
    descricao: 'Outras preparações de legumes e frutas',
    aliquotaICMS: 18,
    aliquotaIPI: 0,
    stObrigatorio: true,
    cstPis: '01',
    cstCofins: '01',
    grupo: 'Alimentos',
    observacoes: 'Catchup, mostarda e molhos',
  },
  {
    codigo: '21031000',
    descricao: 'Molho de tomate',
    aliquotaICMS: 18,
    aliquotaIPI: 0,
    stObrigatorio: true,
    cstPis: '01',
    cstCofins: '01',
    grupo: 'Alimentos',
    observacoes: 'Extrato e molho de tomate prontos',
  },
  {
    codigo: '21032000',
    descricao: 'Molhos de tomate em pó ou concentrados',
    aliquotaICMS: 18,
    aliquotaIPI: 0,
    stObrigatorio: true,
    cstPis: '01',
    cstCofins: '01',
    grupo: 'Alimentos',
    observacoes: 'Concentrado de tomate',
  },
  // ===========================================================================
  // PRODUTOS DE LIMPEZA (Cap. 34)
  // ===========================================================================
  {
    codigo: '34011900',
    descricao: 'Sabões e detergentes orgânicos',
    aliquotaICMS: 18,
    aliquotaIPI: 0,
    stObrigatorio: false,
    cstPis: '01',
    cstCofins: '01',
    grupo: 'Limpeza',
    observacoes: 'Sabão em barra, líquido e pó',
  },
  {
    codigo: '34022000',
    descricao: 'Detergentes orgânicos para lavagem',
    aliquotaICMS: 18,
    aliquotaIPI: 0,
    stObrigatorio: false,
    cstPis: '01',
    cstCofins: '01',
    grupo: 'Limpeza',
    observacoes: 'Sabão em pó e líquido para roupas',
  },
  {
    codigo: '34029010',
    descricao: 'Outros detergentes sintéticos',
    aliquotaICMS: 18,
    aliquotaIPI: 0,
    stObrigatorio: false,
    cstPis: '01',
    cstCofins: '01',
    grupo: 'Limpeza',
    observacoes: 'Detergentes para limpeza geral',
  },
  {
    codigo: '34013000',
    descricao: 'Preparações para lavagem em máquinas',
    aliquotaICMS: 18,
    aliquotaIPI: 0,
    stObrigatorio: false,
    cstPis: '01',
    cstCofins: '01',
    grupo: 'Limpeza',
    observacoes: 'Detergentes para lava-louças e máquinas',
  },
  {
    codigo: '38089119',
    descricao: 'Inseticidas líquidos para desinfestação',
    aliquotaICMS: 18,
    aliquotaIPI: 0,
    stObrigatorio: false,
    cstPis: '01',
    cstCofins: '01',
    grupo: 'Limpeza',
    observacoes: 'Inseticidas para uso em cozinhas e áreas comuns',
  },
  {
    codigo: '38089219',
    descricao: 'Fungicidas líquidos',
    aliquotaICMS: 18,
    aliquotaIPI: 0,
    stObrigatorio: false,
    cstPis: '01',
    cstCofins: '01',
    grupo: 'Limpeza',
    observacoes: 'Fungicidas para limpeza e higienização',
  },
  {
    codigo: '96035000',
    descricao: 'Escovas e brochas para limpeza',
    aliquotaICMS: 18,
    aliquotaIPI: 0,
    stObrigatorio: false,
    cstPis: '01',
    cstCofins: '01',
    grupo: 'Limpeza',
    observacoes: 'Vassouras, escovas e esponjas',
  },
  {
    codigo: '96190000',
    descricao: 'Outros artigos de higiene e cosmética',
    aliquotaICMS: 18,
    aliquotaIPI: 0,
    stObrigatorio: false,
    cstPis: '01',
    cstCofins: '01',
    grupo: 'Limpeza',
    observacoes: 'Papel higiênico, fraldas e absorventes',
  },
  // ===========================================================================
  // EMBALAGENS (Cap. 39, 48, 73)
  // ===========================================================================
  {
    codigo: '39231000',
    descricao: 'Caixas, caixotes e sacolas de plástico',
    aliquotaICMS: 18,
    aliquotaIPI: 0,
    stObrigatorio: false,
    cstPis: '01',
    cstCofins: '01',
    grupo: 'Embalagens',
    observacoes: 'Caixas e sacolas plásticas para alimentação',
  },
  {
    codigo: '39232100',
    descricao: 'Sacos e sacolas de polietileno',
    aliquotaICMS: 18,
    aliquotaIPI: 0,
    stObrigatorio: false,
    cstPis: '01',
    cstCofins: '01',
    grupo: 'Embalagens',
    observacoes: 'Sacolas plásticas para delivery',
  },
  {
    codigo: '39232900',
    descricao: 'Outros sacos e sacolas de plástico',
    aliquotaICMS: 18,
    aliquotaIPI: 0,
    stObrigatorio: false,
    cstPis: '01',
    cstCofins: '01',
    grupo: 'Embalagens',
    observacoes: 'Sacolas biodegradáveis e convencionais',
  },
  {
    codigo: '39239000',
    descricao: 'Outros artigos de plástico para embalagem',
    aliquotaICMS: 18,
    aliquotaIPI: 0,
    stObrigatorio: false,
    cstPis: '01',
    cstCofins: '01',
    grupo: 'Embalagens',
    observacoes: 'Copos, travessas e recipientes de plástico',
  },
  {
    codigo: '48191000',
    descricao: 'Caixas de cartão ondulado',
    aliquotaICMS: 18,
    aliquotaIPI: 0,
    stObrigatorio: false,
    cstPis: '01',
    cstCofins: '01',
    grupo: 'Embalagens',
    observacoes: 'Caixas de papelão para delivery',
  },
  {
    codigo: '48192000',
    descricao: 'Caixas de papelão não ondulado',
    aliquotaICMS: 18,
    aliquotaIPI: 0,
    stObrigatorio: false,
    cstPis: '01',
    cstCofins: '01',
    grupo: 'Embalagens',
    observacoes: 'Caixas de papelão fino para alimentos',
  },
  {
    codigo: '48239000',
    descricao: 'Outros artigos de papel para embalagem',
    aliquotaICMS: 18,
    aliquotaIPI: 0,
    stObrigatorio: false,
    cstPis: '01',
    cstCofins: '01',
    grupo: 'Embalagens',
    observacoes: 'Papel manteiga, papel de铝箔 e similares',
  },
  {
    codigo: '73239300',
    descricao: 'Artigos de mesa de aço inoxidável',
    aliquotaICMS: 18,
    aliquotaIPI: 5,
    stObrigatorio: false,
    cstPis: '01',
    cstCofins: '01',
    grupo: 'Embalagens',
    observacoes: 'Talheres, travessas e panelas de inox',
  },
  {
    codigo: '73211100',
    descricao: 'Fogareiros e fogões de cozinha a gás',
    aliquotaICMS: 18,
    aliquotaIPI: 10,
    stObrigatorio: false,
    cstPis: '01',
    cstCofins: '01',
    grupo: 'Equipamentos',
    observacoes: 'Fogões industriais a gás',
  },
  {
    codigo: '73211900',
    descricao: 'Outros fogões e equipamentos de cozinha',
    aliquotaICMS: 18,
    aliquotaIPI: 10,
    stObrigatorio: false,
    cstPis: '01',
    cstCofins: '01',
    grupo: 'Equipamentos',
    observacoes: 'Chapas, frigideiras e equipamentos de aço',
  },
  // ===========================================================================
  // BEBIDAS - NCMs ADICIONAIS PARA DIVERSIFICAR OPÇÕES
  // ===========================================================================
  {
    codigo: '22089090',
    descricao: 'Outras bebidas destiladas não especificadas',
    aliquotaICMS: 18,
    aliquotaIPI: 15,
    stObrigatorio: true,
    cstPis: '01',
    cstCofins: '01',
    grupo: 'Bebidas',
    observacoes: 'Cognac, calvados e bebidas destiladas diversas',
  },
  {
    codigo: '22087010',
    descricao: 'Licor de café ou chocolate',
    aliquotaICMS: 18,
    aliquotaIPI: 15,
    stObrigatorio: true,
    cstPis: '01',
    cstCofins: '01',
    grupo: 'Bebidas',
    observacoes: 'Licor de café, Baileys e similares',
  },
  {
    codigo: '22072010',
    descricao: 'Álcool etílico não desnaturado, >= 80%',
    aliquotaICMS: 18,
    aliquotaIPI: 0,
    stObrigatorio: true,
    cstPis: '01',
    cstCofins: '01',
    grupo: 'Bebidas',
    observacoes: 'Álcool para uso em bebidas e cosméticos',
  },
];

// =============================================================================
// FUNÇÕES DE BUSCA
// =============================================================================

/**
 * Busca uma entrada de NCM pelo código de 8 dígitos.
 * @param codigo - Código NCM (8 dígitos, sem pontos)
 * @returns Entrada do NCM ou undefined se não encontrado
 */
export function buscarNCMporCodigo(codigo: string): NCMEntrada | undefined {
  const codigoFormatado = codigo.replace(/\D/g, '');
  return bancoNCM.find((ncm) => ncm.codigo === codigoFormatado);
}

/**
 * Busca NCMs por grupo de produto.
 * @param grupo - Nome do grupo (ex: 'Bebidas', 'Alimentos', 'Limpeza')
 * @returns Array de entradas NCM do grupo especificado
 */
export function buscarNCMsPorGrupo(grupo: string): NCMEntrada[] {
  const grupoLower = grupo.toLowerCase();
  return bancoNCM.filter((ncm) => ncm.grupo.toLowerCase() === grupoLower);
}

/**
 * Busca NCMs relacionados à alimentação e restauração.
 * Inclui grupos: Alimentos e Bebidas.
 * @returns Array de entradas NCM de alimentação
 */
export function buscarNCMsPorAlimentacao(): NCMEntrada[] {
  return bancoNCM.filter(
    (ncm) =>
      ncm.grupo === 'Alimentos' ||
      ncm.grupo === 'Bebidas'
  );
}

/**
 * Calcula a economia anual com base na economia mensal.
 * @param economiaMensal - Valor mensal de economia estimada
 * @returns Valor anual (economia * 12)
 */
export function calcularEconomiaAnual(economiaMensal: number): number {
  return economiaMensal * 12;
}

// =============================================================================
// FUNÇÃO DE SUGESTÃO DE NCM ALTERNATIVO
// =============================================================================

/**
 * Mapeamento de subcategorias por posição NCM (4 dígitos).
 * Usado para impedir trocas entre categorias incompatíveis.
 */
const SUBCATEGORIAS: Record<string, string> = {
  // Capítulo 22 - Bebidas
  "2201": "agua_mineral",
  "2202": "agua_refrigerante",
  "2203": "cerveja",
  "2204": "vinho",
  "2205": "vermute",
  "2206": "outras_fermentadas",
  "2207": "alcool",
  "2208": "destilados",
  // Capítulo 02 - Carnes
  "0201": "carne_bovina",
  "0202": "carne_bovina_congelada",
  "0203": "carne_suina",
  "0204": "carne_cordeiro",
  "0207": "aves",
  // Capítulo 04 - Laticínios
  "0401": "leite",
  "0402": "leite_po",
  "0403": "iogurte",
  "0405": "manteiga",
  "0406": "queijo",
  // Capítulo 09 - Café/Chá
  "0901": "cafe",
  "0902": "cha",
  // Capítulo 15 - Óleos
  "1509": "azeite",
  "1511": "oleo_soja",
  "1517": "margarina",
  // Capítulo 34 - Limpeza
  "3401": "sabao",
  "3402": "detergente",
};

/**
 * Verifica se um produto é um combo/kit (múltiplos itens).
 */
function ehCombo(nomeProduto: string, grupoProduto: string): boolean {
  const nomeUpper = nomeProduto.toUpperCase();
  const grupoUpper = grupoProduto.toUpperCase();

  if (nomeUpper.includes("COMBO") || nomeUpper.includes("KIT") || nomeUpper.includes("PACOTE")) {
    return true;
  }
  if (grupoUpper.includes("COMBO") || grupoUpper.includes("KIT")) {
    return true;
  }
  if (nomeUpper.match(/\d+\s*DOSES/)) {
    return true;
  }
  return false;
}

/**
 * Obtém a subcategoria de um NCM pela posição (4 dígitos).
 */
function obterSubcategoria(ncm: string): string | null {
  const posicao = ncm.substring(0, 4);
  return SUBCATEGORIAS[posicao] || null;
}

/**
 * Verifica se dois NCMs são da mesma subcategoria exata.
 * Retorna true apenas se ambos pertencem à mesma subcategoria.
 */
function mesmaSubcategoria(ncm1: string, ncm2: string): boolean {
  const sub1 = obterSubcategoria(ncm1);
  const sub2 = obterSubcategoria(ncm2);

  // Se ambos têm subcategoria definida, devem ser iguais
  if (sub1 && sub2) {
    return sub1 === sub2;
  }

  // Se apenas um tem subcategoria, não são compatíveis
  if (sub1 || sub2) {
    return false;
  }

  // Se nenhum tem subcategoria definida, permitir (mesmo capítulo)
  return true;
}

/**
 * Lista de NCMs que NUNCA devem ser sugeridos como destino.
 * São NCMs com regímenes especiais ou que causariam distorções.
 */
const NCM_BLOQUEADOS: string[] = [
  "22011000", // Água mineral com gás
  "22019000", // Água mineral sem gás
  "22021000", // Água com gás artificial
  "22029900", // Outras águas
];

/**
 * Função principal de sugestão de NCM alternativo.
 *
 * REGRAS ESTritas:
 * 1. Só sugere NCMs da MESMA subcategoria exata
 * 2. Combos/kits NUNCA recebem sugestão
 * 3. NCMs bloqueados NUNCA são sugeridos
 * 4. Só melhoria real (redução de imposto sem trocar categoria)
 * 5. Prioriza NCMs sem ST quando possível
 *
 * @param ncmAtual - Código NCM atual do produto
 * @param descricaoProduto - Descrição do produto
 * @param grupoProduto - Grupo do produto
 * @returns NCM sugerido ou null
 */
export function sugerirNCMAlternativo(
  ncmAtual: string,
  descricaoProduto: string,
  grupoProduto?: string
): NCMEntrada | null {
  const ncmFormatado = ncmAtual.replace(/\D/g, '');
  const ncmAtualInfo = buscarNCMporCodigo(ncmFormatado);

  if (!ncmAtualInfo) {
    return null;
  }

  // BLOQUEIO 1: Combos/kits
  if (ehCombo(descricaoProduto, grupoProduto || ncmAtualInfo.grupo)) {
    return null;
  }

  const subcatAtual = obterSubcategoria(ncmFormatado);

  // BLOQUEIO 2: Se não tem subcategoria mapeada, não sugerir
  if (!subcatAtual) {
    return null;
  }

  // Buscar NCMs do mesmo grupo
  const grupo = ncmAtualInfo.grupo;
  const ncmGrupo = buscarNCMsPorGrupo(grupo);

  // Filtrar candidatos válidos
  const candidatos = ncmGrupo.filter((ncm) => {
    // Não pode ser o mesmo NCM
    if (ncm.codigo === ncmFormatado) return false;

    // BLOQUEIO 3: NCMs na lista de bloqueados
    if (NCM_BLOQUEADOS.includes(ncm.codigo)) return false;

    // BLOQUEIO 4: Mesma subcategoria EXATA
    if (!mesmaSubcategoria(ncmFormatado, ncm.codigo)) return false;

    // BLOQUEIO 5: Só considerar se há melhoria real
    const temMelhoriaICMS = ncm.aliquotaICMS < ncmAtualInfo.aliquotaICMS;
    const temMelhoriaIPI = ncm.aliquotaIPI < ncmAtualInfo.aliquotaIPI;
    const removeST = ncmAtualInfo.stObrigatorio && !ncm.stObrigatorio;

    // Deve ter pelo menos uma melhoria
    if (!temMelhoriaICMS && !temMelhoriaIPI && !removeST) {
      return false;
    }

    // Se tem ST no candidato mas não no atual, não sugerir (aumenta custo)
    if (!ncmAtualInfo.stObrigatorio && ncm.stObrigatorio) {
      return false;
    }

    return true;
  });

  if (candidatos.length === 0) {
    return null;
  }

  // Ordenar por melhor benefício
  candidatos.sort((a, b) => {
    // 1. Priorizar sem ST
    if (a.stObrigatorio !== b.stObrigatorio) {
      return a.stObrigatorio ? 1 : -1;
    }

    // 2. Menor ICMS
    if (a.aliquotaICMS !== b.aliquotaICMS) {
      return a.aliquotaICMS - b.aliquotaICMS;
    }

    // 3. Menor IPI
    return a.aliquotaIPI - b.aliquotaIPI;
  });

  return candidatos[0];
}

// =============================================================================
// FUNÇÃO DE ANÁLISE DE PRODUTOS
// =============================================================================

/**
 * Analisa uma lista de produtos e sugere reenquadramento fiscal quando aplicável.
 *
 * Para cada produto:
 * 1. Busca o NCM atual na base de dados
 * 2. Tenta sugerir um NCM alternativo com menor carga tributária
 * 3. Calcula economia mensal estimada com base no preço de venda
 * 4. Classifica o risco da mudança (baixo, médio, alto)
 *
 * @param produtos - Lista de produtos para análise
 * @returns Array com análise de cada produto
 */
export function analisarProdutos(
  produtos: Array<{
    id: number;
    nome: string;
    ncm: string;
    prc_venda: number;
    grupo?: string;
  }>
): AnaliseNCM[] {
  const resultados: AnaliseNCM[] = [];

  for (const produto of produtos) {
    const ncmFormatado = produto.ncm.replace(/\D/g, '');
    const ncmAtual = buscarNCMporCodigo(ncmFormatado);

    if (!ncmAtual) {
      resultados.push({
        produtoId: produto.id,
        nomeProduto: produto.nome,
        ncmAtual: produto.ncm,
        ncmSugerido: null,
        descricaoNCMSugerido: 'NCM não encontrado na base de dados',
        aliquotaAtual: 0,
        aliquotaSugerida: 0,
        economiaPercentual: 0,
        economiaMensal: 0,
        nivelRisco: 'alto',
        observacao:
          'NCM não encontrado. Verificar cadastro do produto ou atualizar base de dados.',
      });
      continue;
    }

    const ncmSugerido = sugerirNCMAlternativo(produto.ncm, produto.nome, produto.grupo);

    if (!ncmSugerido) {
      resultados.push({
        produtoId: produto.id,
        nomeProduto: produto.nome,
        ncmAtual: produto.ncm,
        ncmSugerido: null,
        descricaoNCMSugerido: 'Nenhum benefício tributário identificado',
        aliquotaAtual: ncmAtual.aliquotaICMS,
        aliquotaSugerida: ncmAtual.aliquotaICMS,
        economiaPercentual: 0,
        economiaMensal: 0,
        nivelRisco: 'baixo',
        observacao:
          'Produto já possui a melhor alíquota disponível para seu grupo.',
      });
      continue;
    }

    // Calcular economia mensal estimada
    // Premissa: ticket médio mensal = 500 unidades * preço de venda
    const ticketMedioMensal = 500;
    const custoTributarioAtual =
      produto.prc_venda * ticketMedioMensal * (ncmAtual.aliquotaICMS / 100);
    const custoTributarioSugerido =
      produto.prc_venda *
      ticketMedioMensal *
      (ncmSugerido.aliquotaICMS / 100);
    const economiaMensal = custoTributarioAtual - custoTributarioSugerido;

    const economiaPercentual =
      ncmAtual.aliquotaICMS > 0
        ? ((ncmAtual.aliquotaICMS - ncmSugerido.aliquotaICMS) /
            ncmAtual.aliquotaICMS) *
          100
        : 0;

    // Determinar nível de risco baseado no capítulo NCM
    const nivelRisco = classificarRisco(ncmAtual.codigo, ncmSugerido.codigo);

    // Gerar observação baseada na mudança
    const observacao = gerarObservacao(
      ncmAtual,
      ncmSugerido,
      nivelRisco
    );

    resultados.push({
      produtoId: produto.id,
      nomeProduto: produto.nome,
      ncmAtual: produto.ncm,
      ncmSugerido: ncmSugerido.codigo,
      descricaoNCMSugerido: ncmSugerido.descricao,
      aliquotaAtual: ncmAtual.aliquotaICMS,
      aliquotaSugerida: ncmSugerido.aliquotaICMS,
      economiaPercentual,
      economiaMensal,
      nivelRisco,
      observacao,
    });
  }

  return resultados;
}

// =============================================================================
// FUNÇÕES AUXILIARES PRIVADAS
// =============================================================================

/**
 * Classifica o risco de mudança de NCM baseado na similaridade dos capítulos.
 *
 * Regras de classificação:
 * - Baixo: Mesmo capítulo (2 primeiros dígitos iguais)
 * - Médio: Capítulos adjacentes (diferença de 1-2 no primeiro par)
 * - Alto: Capítulos distantes (diferença > 2)
 *
 * @param ncmAtual - Código NCM atual
 * @param ncmSugerido - Código NCM sugerido
 * @returns Nível de risco: 'baixo', 'medio' ou 'alto'
 */
function classificarRisco(ncmAtual: string, ncmSugerido: string): 'baixo' | 'medio' | 'alto' {
  const capituloAtual = parseInt(ncmAtual.substring(0, 2), 10);
  const capituloSugerido = parseInt(ncmSugerido.substring(0, 2), 10);

  const diferenca = Math.abs(capituloAtual - capituloSugerido);

  if (diferenca === 0) {
    return 'baixo';
  } else if (diferenca <= 2) {
    return 'medio';
  } else {
    return 'alto';
  }
}

/**
 * Gera uma observação descritiva sobre a mudança de NCM.
 *
 * @param ncmAtual - Entrada do NCM atual
 * @param ncmSugerido - Entrada do NCM sugerido
 * @param nivelRisco - Nível de risco classificado
 * @returns String com observação detalhada
 */
function gerarObservacao(
  ncmAtual: NCMEntrada,
  ncmSugerido: NCMEntrada,
  nivelRisco: 'baixo' | 'medio' | 'alto'
): string {
  const partes: string[] = [];

  // Informar sobre mudança de alíquota
  if (ncmSugerido.aliquotaICMS < ncmAtual.aliquotaICMS) {
    partes.push(
      `Redução de ICMS de ${ncmAtual.aliquotaICMS}% para ${ncmSugerido.aliquotaICMS}%.`
    );
  }

  if (ncmSugerido.aliquotaIPI < ncmAtual.aliquotaIPI) {
    partes.push(
      `Redução de IPI de ${ncmAtual.aliquotaIPI}% para ${ncmSugerido.aliquotaIPI}%.`
    );
  }

  // Informar sobre ST
  if (ncmSugerido.stObrigatorio && !ncmAtual.stObrigatorio) {
    partes.push(
      'Atenção: NCM sugerido possui ST obrigatório. Verificar impacto no custo de aquisição.'
    );
  } else if (!ncmSugerido.stObrigatorio && ncmAtual.stObrigatorio) {
    partes.push(
      'Vantagem: NCM sugerido não possui ST obrigatório, reduzindo custo de entrada.'
    );
  }

  // Adicionar aviso baseado no risco
  if (nivelRisco === 'alto') {
    partes.push(
      'ALERTA: Mudança entre capítulos distintos. Necessária análise fiscal detalhada antes da adoção.'
    );
  } else if (nivelRisco === 'medio') {
    partes.push(
      'Recomendável consulta ao contador antes de implementar a mudança.'
    );
  } else {
    partes.push(
      'Mudança de baixo risco, compatível com o mesmo segmento de produto.'
    );
  }

  return partes.join(' ');
}

// =============================================================================
// EXPORTAÇÕES ADICIONAIS
// =============================================================================

/**
 * Retorna estatísticas gerais da base de dados de NCMs.
 * Útil para relatórios e dashboards.
 *
 * @returns Objeto com estatísticas da base de dados
 */
export function obterEstatisticasBase(): {
  totalNCMs: number;
  grupos: Record<string, number>;
  mediaICMS: number;
  mediaIPI: number;
  ncmsComST: number;
} {
  const grupos: Record<string, number> = {};
  let somaICMS = 0;
  let somaIPI = 0;
  let countST = 0;

  for (const ncm of bancoNCM) {
    // Contagem por grupo
    grupos[ncm.grupo] = (grupos[ncm.grupo] || 0) + 1;

    // Soma para médias
    somaICMS += ncm.aliquotaICMS;
    somaIPI += ncm.aliquotaIPI;

    if (ncm.stObrigatorio) {
      countST++;
    }
  }

  return {
    totalNCMs: bancoNCM.length,
    grupos,
    mediaICMS: Math.round((somaICMS / bancoNCM.length) * 100) / 100,
    mediaIPI: Math.round((somaIPI / bancoNCM.length) * 100) / 100,
    ncmsComST: countST,
  };
}

/**
 * Lista todos os grupos disponíveis na base de dados.
 *
 * @returns Array com nomes dos grupos únicos
 */
export function listarGrupos(): string[] {
  const gruposSet = new Set(bancoNCM.map((ncm) => ncm.grupo));
  return Array.from(gruposSet).sort();
}
