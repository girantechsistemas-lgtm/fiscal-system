# -*- coding: utf-8 -*-
import fdb
import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

FBCLIENT = r"C:\Program Files\Firebird\Firebird_2_5\bin\fbclient.dll"
BANCO = r"D:\SSA\GourmetSA\Dados\banco_vps.fdb"
OUTPUT = r"D:\projetos\sistema fiscal\src\data\cliente_gourmet.json"

def safe_str(val):
    if val is None: return ''
    if isinstance(val, (int, float)): return str(val)
    return val.strip() if hasattr(val, 'strip') else str(val)

def safe_float(val):
    if val is None: return 0.0
    try: return float(val)
    except: return 0.0

def safe_date(val):
    if val is None: return ''
    try: return val.strftime('%Y-%m-%d')
    except: return ''

con = fdb.connect(dsn=BANCO, user='SYSDBA', password='masterkey', fb_library_name=FBCLIENT)
cur = con.cursor()

data = {
    'empresa': {},
    'produtos': [],
    'notas_entrada': [],
    'itens_entrada': [],
    'vendas_pdv': [],
    'resumo': {}
}

# Empresa
cur.execute("SELECT EMP_CNPJ, EMP_IE, EMP_RAZAO_SOCIAL, EMP_NOME_FANTASIA FROM SIS_CONFIGURACOES WHERE ID = 1")
emp = cur.fetchone()
data['empresa'] = {
    'cnpj': safe_str(emp[0]),
    'ie': safe_str(emp[1]),
    'razao_social': safe_str(emp[2]),
    'nome_fantasia': safe_str(emp[3])
}

# Produtos (todos ativos)
cur.execute("""
    SELECT ID, NOME, NCM, GTIN, PRC_CUSTO, PRC_VENDA, 
           TRIBUTACAO, ESTOQUE, NOME_GRUPO, FIS_ST_VLR_PAUTA,
           ULTIMO_FORNECEDOR
    FROM EST_PRODUTOS WHERE ATIVO = 'S' ORDER BY NOME
""")
for p in cur.fetchall():
    data['produtos'].append({
        'id': p[0],
        'nome': safe_str(p[1]),
        'ncm': safe_str(p[2]),
        'gtin': safe_str(p[3]),
        'prc_custo': safe_float(p[4]),
        'prc_venda': safe_float(p[5]),
        'tributacao': p[6] if p[6] else None,
        'estoque': safe_float(p[7]),
        'grupo': safe_str(p[8]),
        'st_pauta': safe_float(p[9]),
        'ultimo_fornecedor': p[10] if p[10] else None
    })

# Notas de entrada
cur.execute("""
    SELECT ID, NRO_NF, REM_RAZAO_SOCIAL, REM_CNPJ_CPF, DT_EMISSAO,
           VLR_PRODUTOS, ICMS_VALOR, ICMS_ST_VALOR, PIS_VALOR,
           COFINS_VALOR, IPI_VALOR, VLR_TOTAL, CANCELADA
    FROM FIS_NF WHERE TIPO_ES = 'E' ORDER BY DT_EMISSAO DESC
""")
for n in cur.fetchall():
    data['notas_entrada'].append({
        'id': n[0],
        'numero': safe_str(n[1]),
        'fornecedor': safe_str(n[2]),
        'cnpj': safe_str(n[3]),
        'data': safe_date(n[4]),
        'vlr_produtos': safe_float(n[5]),
        'icms_valor': safe_float(n[6]),
        'icms_st': safe_float(n[7]),
        'pis': safe_float(n[8]),
        'cofins': safe_float(n[9]),
        'ipi': safe_float(n[10]),
        'total': safe_float(n[11]),
        'cancelada': n[12] == 'S'
    })

# Itens notas de entrada
cur.execute("""
    SELECT nf.NRO_NF, nfi.NOME_PRODUTO, nfi.CODIGO_NCM, nfi.QTDADE,
           nfi.PRC_UNIT, nfi.PRC_TOTAL, nfi.ICMS_ALIQUOTA, nfi.ICMS_VALOR,
           nfi.ICMS_ST_VALOR, nfi.PIS_VALOR, nfi.COFINS_VALOR, nfi.IPI_VALOR
    FROM FIS_NF_ITENS nfi
    JOIN FIS_NF nf ON nf.ID = nfi.ITEM
    WHERE nf.TIPO_ES = 'E' AND nf.CANCELADA = 'N'
""")
for i in cur.fetchall():
    data['itens_entrada'].append({
        'nota_numero': safe_str(i[0]),
        'produto': safe_str(i[1]),
        'ncm': safe_str(i[2]),
        'quantidade': safe_float(i[3]),
        'preco_unit': safe_float(i[4]),
        'total': safe_float(i[5]),
        'icms_aliquota': safe_float(i[6]),
        'icms_valor': safe_float(i[7]),
        'icms_st': safe_float(i[8]),
        'pis': safe_float(i[9]),
        'cofins': safe_float(i[10]),
        'ipi': safe_float(i[11])
    })

# Vendas PDV
cur.execute("""
    SELECT ID, DT_EMISSAO, NOME_CLIENTE, VLR_ITENS, VLR_DESCONTO,
           VLR_TOTAL, VLR_PAGO, SITUACAO
    FROM EST_VENDAS WHERE SITUACAO = 'F' ORDER BY DT_EMISSAO DESC
    ROWS 50
""")
for v in cur.fetchall():
    data['vendas_pdv'].append({
        'id': v[0],
        'data': safe_date(v[1]),
        'cliente': safe_str(v[2]),
        'vlr_itens': safe_float(v[3]),
        'desconto': safe_float(v[4]),
        'total': safe_float(v[5]),
        'pago': safe_float(v[6]),
        'situacao': safe_str(v[7])
    })

# Resumo
cur.execute("SELECT SUM(VLR_TOTAL) FROM FIS_NF WHERE TIPO_ES = 'E' AND CANCELADA = 'N'")
r = cur.fetchone()
data['resumo']['total_entradas'] = safe_float(r[0])

cur.execute("SELECT SUM(ICMS_VALOR) FROM FIS_NF WHERE TIPO_ES = 'E' AND CANCELADA = 'N'")
r = cur.fetchone()
data['resumo']['icms_credito'] = safe_float(r[0])

cur.execute("SELECT SUM(ICMS_ST_VALOR) FROM FIS_NF WHERE TIPO_ES = 'E' AND CANCELADA = 'N'")
r = cur.fetchone()
data['resumo']['st_credito'] = safe_float(r[0])

cur.execute("SELECT SUM(PIS_VALOR) FROM FIS_NF WHERE TIPO_ES = 'E' AND CANCELADA = 'N'")
r = cur.fetchone()
data['resumo']['pis_credito'] = safe_float(r[0])

cur.execute("SELECT SUM(COFINS_VALOR) FROM FIS_NF WHERE TIPO_ES = 'E' AND CANCELADA = 'N'")
r = cur.fetchone()
data['resumo']['cofins_credito'] = safe_float(r[0])

cur.execute("SELECT SUM(IPI_VALOR) FROM FIS_NF WHERE TIPO_ES = 'E' AND CANCELADA = 'N'")
r = cur.fetchone()
data['resumo']['ipi_credito'] = safe_float(r[0])

cur.execute("SELECT COUNT(*) FROM EST_VENDAS WHERE SITUACAO = 'F'")
r = cur.fetchone()
data['resumo']['total_vendas'] = r[0]

cur.execute("SELECT SUM(VLR_TOTAL) FROM EST_VENDAS WHERE SITUACAO = 'F'")
r = cur.fetchone()
data['resumo']['faturamento_total'] = safe_float(r[0])

con.close()

with open(OUTPUT, 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print(f"Dados exportados para: {OUTPUT}")
print(f"  Produtos: {len(data['produtos'])}")
print(f"  Notas entrada: {len(data['notas_entrada'])}")
print(f"  Itens entrada: {len(data['itens_entrada'])}")
print(f"  Vendas PDV: {len(data['vendas_pdv'])}")
print(f"  Resumo: {json.dumps(data['resumo'], indent=2)}")
