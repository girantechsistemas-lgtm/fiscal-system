-- ============================================================
-- SCHEMA DO BANCO DE DADOS - FiscalZim
-- PostgreSQL
-- ============================================================

-- TABELA: Empresa
CREATE TABLE empresa (
    id SERIAL PRIMARY KEY,
    razao_social VARCHAR(200) NOT NULL,
    cnpj VARCHAR(14) UNIQUE NOT NULL,
    inscricao_estadual VARCHAR(20),
    regime_tributario VARCHAR(20) CHECK (regime_tributario IN ('simples', 'presumido', 'real')),
    atividade_principal VARCHAR(10),
    cidade VARCHAR(100),
    estado CHAR(2),
    plano VARCHAR(20) DEFAULT 'starter',
    data_cadastro TIMESTAMP DEFAULT NOW()
);

-- TABELA: Produto
CREATE TABLE produto (
    id SERIAL PRIMARY KEY,
    empresa_id INTEGER REFERENCES empresa(id) ON DELETE CASCADE,
    descricao VARCHAR(200) NOT NULL,
    ncm VARCHAR(8) NOT NULL,
    cfop VARCHAR(4),
    unidade VARCHAR(10) DEFAULT 'UN',
    custo_unitario DECIMAL(10,2),
    preco_venda DECIMAL(10,2),
    tem_st BOOLEAN DEFAULT FALSE,
    tem_ipi BOOLEAN DEFAULT FALSE,
    aliquota_ipi DECIMAL(5,2) DEFAULT 0,
    ativo BOOLEAN DEFAULT TRUE,
    data_cadastro TIMESTAMP DEFAULT NOW()
);

-- TABELA: NCM (Referência)
CREATE TABLE ncm_referencia (
    codigo VARCHAR(8) PRIMARY KEY,
    descricao TEXT NOT NULL,
    aliquota_icms DECIMAL(5,2),
    aliquota_ipi DECIMAL(5,2) DEFAULT 0,
    st_obrigatorio BOOLEAN DEFAULT FALSE,
    observacoes TEXT
);

-- TABELA: Nota Fiscal de Entrada
CREATE TABLE nota_fiscal_entrada (
    id SERIAL PRIMARY KEY,
    empresa_id INTEGER REFERENCES empresa(id) ON DELETE CASCADE,
    fornecedor_razao_social VARCHAR(200),
    fornecedor_cnpj VARCHAR(14),
    numero_nota VARCHAR(20) NOT NULL,
    serie VARCHAR(3) DEFAULT '1',
    data_emissao DATE NOT NULL,
    data_entrada DATE NOT NULL,
    valor_produtos DECIMAL(12,2),
    valor_total DECIMAL(12,2),
    valor_icms DECIMAL(12,2) DEFAULT 0,
    valor_ipi DECIMAL(12,2) DEFAULT 0,
    valor_pis DECIMAL(12,2) DEFAULT 0,
    valor_cofins DECIMAL(12,2) DEFAULT 0,
    valor_st DECIMAL(12,2) DEFAULT 0,
    cfop_geral VARCHAR(4),
    xml_path VARCHAR(500),
    data_importacao TIMESTAMP DEFAULT NOW()
);

-- TABELA: Item da Nota de Entrada
CREATE TABLE item_nota_entrada (
    id SERIAL PRIMARY KEY,
    nota_entrada_id INTEGER REFERENCES nota_fiscal_entrada(id) ON DELETE CASCADE,
    produto_id INTEGER REFERENCES produto(id),
    descricao_produto VARCHAR(200),
    ncm VARCHAR(8) NOT NULL,
    cfop VARCHAR(4),
    quantidade DECIMAL(10,3) NOT NULL,
    valor_unitario DECIMAL(10,2) NOT NULL,
    valor_total DECIMAL(12,2) NOT NULL,
    valor_icms DECIMAL(12,2) DEFAULT 0,
    valor_ipi DECIMAL(12,2) DEFAULT 0,
    valor_pis DECIMAL(12,2) DEFAULT 0,
    valor_cofins DECIMAL(12,2) DEFAULT 0,
    valor_st DECIMAL(12,2) DEFAULT 0
);

-- TABELA: Crédito Fiscal
CREATE TABLE credito_fiscal (
    id SERIAL PRIMARY KEY,
    empresa_id INTEGER REFERENCES empresa(id) ON DELETE CASCADE,
    tipo_credito VARCHAR(20) CHECK (tipo_credito IN ('ICMS', 'IPI', 'PIS', 'COFINS', 'ST', 'DIFAL')),
    nota_entrada_id INTEGER REFERENCES nota_fiscal_entrada(id),
    produto_id INTEGER REFERENCES produto(id),
    valor_total DECIMAL(12,2) NOT NULL,
    valor_utilizado DECIMAL(12,2) DEFAULT 0,
    valor_disponivel DECIMAL(12,2) GENERATED ALWAYS AS (valor_total - valor_utilizado) STORED,
    mes_competencia VARCHAR(7) NOT NULL, -- Formato: YYYY-MM
    status VARCHAR(20) DEFAULT 'disponivel' CHECK (status IN ('disponivel', 'utilizado', 'expirado')),
    data_registro TIMESTAMP DEFAULT NOW()
);

-- TABELA: Apuração Mensal
CREATE TABLE apuracao_mensal (
    id SERIAL PRIMARY KEY,
    empresa_id INTEGER REFERENCES empresa(id) ON DELETE CASCADE,
    mes_competencia VARCHAR(7) NOT NULL, -- Formato: YYYY-MM
    -- SAÍDAS
    total_vendas DECIMAL(12,2) DEFAULT 0,
    total_notas_saida INTEGER DEFAULT 0,
    -- IMPOSTOS DEVIDOS
    icms_devido DECIMAL(12,2) DEFAULT 0,
    ipi_devido DECIMAL(12,2) DEFAULT 0,
    pis_devido DECIMAL(12,2) DEFAULT 0,
    cofins_devido DECIMAL(12,2) DEFAULT 0,
    st_devido DECIMAL(12,2) DEFAULT 0,
    -- CRÉDITOS
    icms_credito DECIMAL(12,2) DEFAULT 0,
    ipi_credito DECIMAL(12,2) DEFAULT 0,
    pis_credito DECIMAL(12,2) DEFAULT 0,
    cofins_credito DECIMAL(12,2) DEFAULT 0,
    st_credito DECIMAL(12,2) DEFAULT 0,
    -- RESULTADO
    total_devido DECIMAL(12,2) GENERATED ALWAYS AS (
        icms_devido + ipi_devido + pis_devido + cofins_devido + st_devido
    ) STORED,
    total_creditos DECIMAL(12,2) GENERATED ALWAYS AS (
        icms_credito + ipi_credito + pis_credito + cofins_credito + st_credito
    ) STORED,
    valor_a_pagar DECIMAL(12,2) GENERATED ALWAYS AS (
        GREATEST(0, (icms_devido + ipi_devido + pis_devido + cofins_devido + st_devido) -
        (icms_credito + ipi_credito + pis_credito + cofins_credito + st_credito))
    ) STORED,
    economia_obtida DECIMAL(12,2) DEFAULT 0,
    data_apuracao TIMESTAMP DEFAULT NOW(),
    UNIQUE(empresa_id, mes_competencia)
);

-- TABELA: Simulação de Regime
CREATE TABLE simulacao_regime (
    id SERIAL PRIMARY KEY,
    empresa_id INTEGER REFERENCES empresa(id) ON DELETE CASCADE,
    regime_anterior VARCHAR(20),
    regime_novo VARCHAR(20),
    faturamento_base DECIMAL(12,2),
    carga_tributaria_anterior DECIMAL(12,2),
    carga_tributaria_nova DECIMAL(12,2),
    economia_mensal DECIMAL(12,2) GENERATED ALWAYS AS (
        carga_tributaria_anterior - carga_tributaria_nova
    ) STORED,
    economia_anual DECIMAL(12,2) GENERATED ALWAYS AS (
        (carga_tributaria_anterior - carga_tributaria_nova) * 12
    ) STORED,
    data_simulacao TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- ÍNDICES
-- ============================================================

CREATE INDEX idx_produto_empresa ON produto(empresa_id);
CREATE INDEX idx_produto_ncm ON produto(ncm);
CREATE INDEX idx_nota_empresa ON nota_fiscal_entrada(empresa_id);
CREATE INDEX idx_nota_data ON nota_fiscal_entrada(data_emissao);
CREATE INDEX idx_item_nota ON item_nota_entrada(nota_entrada_id);
CREATE INDEX idx_credito_empresa ON credito_fiscal(empresa_id);
CREATE INDEX idx_credito_mes ON credito_fiscal(mes_competencia);
CREATE INDEX idx_credito_tipo ON credito_fiscal(tipo_credito);
CREATE INDEX idx_apuracao_empresa ON apuracao_mensal(empresa_id);
CREATE INDEX idx_apuracao_mes ON apuracao_mensal(mes_competencia);

-- ============================================================
-- DADOS INICIAIS - NCMs de Referência
-- ============================================================

INSERT INTO ncm_referencia (codigo, descricao, aliquota_icms, aliquota_ipi, st_obrigatorio, observacoes) VALUES
('10063020', 'Arroz', 18.00, 0.00, TRUE, 'Substituição tributária'),
('07133319', 'Feijão Carioca', 18.00, 0.00, FALSE, NULL),
('11010010', 'Farinha de Trigo', 18.00, 0.00, TRUE, NULL),
('17019900', 'Açúcar', 18.00, 0.00, TRUE, NULL),
('15079011', 'Óleo de Soja', 18.00, 0.00, TRUE, 'Substituição tributária'),
('15162000', 'Margarina', 18.00, 0.00, TRUE, NULL),
('02013000', 'Carne Bovina', 18.00, 0.00, TRUE, 'ST obrigatória para carnes'),
('02071100', 'Carne de Frango', 18.00, 0.00, TRUE, NULL),
('04012020', 'Leite Integral', 18.00, 0.00, TRUE, 'Substituição tributária'),
('04022100', 'Leite em Pó', 18.00, 0.00, TRUE, NULL),
('04051000', 'Manteiga', 18.00, 0.00, TRUE, NULL),
('04061000', 'Queijo Mussarela', 18.00, 0.00, TRUE, NULL),
('09011100', 'Café Torrado', 18.00, 0.00, FALSE, NULL),
('22011000', 'Água Mineral', 12.00, 0.00, FALSE, NULL),
('22021000', 'Refrigerantes', 18.00, 15.00, TRUE, 'IPI + ST'),
('22030000', 'Cerveja', 18.00, 10.00, TRUE, NULL),
('22042100', 'Vinho de Mesa', 18.00, 0.00, FALSE, NULL),
('34011100', 'Sabão em Pó', 18.00, 0.00, TRUE, NULL),
('34022000', 'Detergente', 18.00, 0.00, TRUE, NULL),
('96190000', 'Fralda Descartável', 18.00, 0.00, FALSE, NULL);
