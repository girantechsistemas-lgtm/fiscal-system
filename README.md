# FiscalZim - Sistema de Planejamento Tributário

Sistema inteligente para redução **legal** de impostos para empresas do varejo, restaurantes e comércio.

## Funcionalidades

- 📦 Cadastro de produtos com NCM
- 📥 Importação de notas fiscais de entrada (XML)
- 🧮 Cálculo automático de créditos fiscais (ICMS, IPI, PIS, COFINS, ST)
- 📊 Simulador de regime tributário
- 💰 Controle de Substituição Tributária (ST)
- 📈 Dashboard com relatórios e gráficos
- ⚠️ Alertas de prazos e mudanças legislativas

## Tecnologias

- **Frontend:** Next.js 15 + React 19 + Tailwind CSS 4
- **Backend:** Node.js
- **Banco:** PostgreSQL
- **Hospedagem:** Vercel (frontend) + Railway (backend)

## Como Rodar

```bash
# Instalar dependências
npm install

# Rodar em modo desenvolvimento
npm run dev

# Acessar
# http://localhost:3000
```

## Estrutura do Projeto

```
fiscal-system/
├── src/
│   ├── app/              # Páginas Next.js
│   │   ├── layout.tsx    # Layout principal
│   │   ├── page.tsx      # Dashboard
│   │   ├── globals.css   # Estilos
│   │   ├── produtos/     # Cadastro de produtos
│   │   ├── entradas/     # Notas de entrada
│   │   ├── simulador/    # Simulador de regime
│   │   ├── relatorios/   # Relatórios
│   │   └── configuracoes/# Configurações
│   ├── lib/              # Bibliotecas
│   │   └── calculos.ts   # Cálculos tributários
│   ├── data/             # Dados de referência
│   │   └── ncm.ts        # Tabela de NCMs
│   └── components/       # Componentes React
├── database/
│   └── schema.sql        # Schema do banco PostgreSQL
├── package.json
├── tsconfig.json
├── next.config.js
├── postcss.config.mjs
└── .gitignore
```

## Licença

MIT
