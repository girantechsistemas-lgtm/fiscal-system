# -*- coding: utf-8 -*-
import fdb
import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

FBCLIENT = r"C:\Program Files\Firebird\Firebird_2_5\bin\fbclient.dll"
BANCO = r"D:\SSA\GourmetSA\Dados\banco_vps.fdb"

def safe_str(val):
    if val is None:
        return ''
    if isinstance(val, (int, float)):
        return str(val)
    return val.strip() if hasattr(val, 'strip') else str(val)

def safe_float(val):
    if val is None:
        return 0.0
    try:
        return float(val)
    except:
        return 0.0

try:
    con = fdb.connect(
        dsn=BANCO,
        user='SYSDBA',
        password='masterkey',
        fb_library_name=FBCLIENT
    )
    print("=== EXTRACAO DE DADOS - CLIENTE GOURMET SA ===\n")
    cur = con.cursor()

    # 1. DADOS DA EMPRESA
    print("=" * 60)
    print("DADOS DA EMPRESA")
    print("=" * 60)
    cur.execute("SELECT EMP_CNPJ, EMP_IE, EMP_RAZAO_SOCIAL, EMP_NOME_FANTASIA FROM SIS_CONFIGURACOES WHERE ID = 1")
    empresa = cur.fetchone()
    if empresa:
        print(f"  CNPJ: {safe_str(empresa[0])}")
        print(f"  IE: {safe_str(empresa[1])}")
        print(f"  Razao Social: {safe_str(empresa[2])}")
        print(f"  Nome Fantasia: {safe_str(empresa[3])}")

    # 2. PRODUTOS COM NCM
    print("\n" + "=" * 60)
    print("PRODUTOS CADASTRADOS (804 total)")
    print("=" * 60)
    cur.execute("""
        SELECT ID, NOME, NCM, GTIN, PRC_CUSTO, PRC_VENDA, 
               TRIBUTACAO, ESTOQUE, NOME_GRUPO, FIS_ST_VLR_PAUTA
        FROM EST_PRODUTOS 
        WHERE ATIVO = 'S'
        ORDER BY NOME
        ROWS 30
    """)
    produtos = cur.fetchall()
    
    for p in produtos:
        st_info = f" | ST Pauta: R${safe_float(p[9]):.2f}" if p[9] and safe_float(p[9]) > 0 else ""
        trib = safe_str(p[6]) if p[6] else '?'
        print(f"  [{p[0]}] {safe_str(p[1])[:40]} | NCM: {safe_str(p[2])} | Trib: {trib} | Cust: R${safe_float(p[4]):.2f} | Vend: R${safe_float(p[5]):.2f}{st_info}")

    # 3. NOTAS FISCAIS DE ENTRADA
    print("\n" + "=" * 60)
    print("NOTAS FISCAIS DE ENTRADA (NF-e)")
    print("=" * 60)
    cur.execute("""
        SELECT ID, NRO_NF, REM_RAZAO_SOCIAL, REM_CNPJ_CPF, DT_EMISSAO, 
               VLR_PRODUTOS, ICMS_VALOR, ICMS_ST_VALOR, PIS_VALOR, 
               COFINS_VALOR, IPI_VALOR, VLR_TOTAL, CANCELADA
        FROM FIS_NF 
        WHERE TIPO_ES = 'E'
        ORDER BY DT_EMISSAO DESC
        ROWS 15
    """)
    notas_entrada = cur.fetchall()
    
    total_entradas = 0
    total_icms_ent = 0
    total_st_ent = 0
    total_pis_ent = 0
    total_cofins_ent = 0
    total_ipi_ent = 0
    
    for n in notas_entrada:
        total = safe_float(n[11])
        total_entradas += total
        total_icms_ent += safe_float(n[6])
        total_st_ent += safe_float(n[7])
        total_pis_ent += safe_float(n[8])
        total_cofins_ent += safe_float(n[9])
        total_ipi_ent += safe_float(n[10])
        cancelada = ' [CANCELADA]' if n[12] == 'S' else ''
        data = n[4].strftime('%d/%m/%Y') if n[4] else ''
        print(f"  NF {safe_str(n[1])} | {safe_str(n[2])[:35]} | {data} | R${total:.2f} | ICMS: R${safe_float(n[6]):.2f} | ST: R${safe_float(n[7]):.2f}{cancelada}")

    # 4. ITENS DAS NOTAS DE ENTRADA
    print("\n" + "=" * 60)
    print("ITENS DAS NOTAS DE ENTRADA (últimas notas)")
    print("=" * 60)
    cur.execute("""
        SELECT nf.NRO_NF, nfi.NOME_PRODUTO, nfi.CODIGO_NCM, nfi.QTDADE, 
               nfi.PRC_UNIT, nfi.PRC_TOTAL, nfi.ICMS_ALIQUOTA, nfi.ICMS_VALOR,
               nfi.ICMS_ST_VALOR, nfi.PIS_VALOR, nfi.COFINS_VALOR, nfi.IPI_VALOR
        FROM FIS_NF_ITENS nfi
        JOIN FIS_NF nf ON nf.ID = nfi.ITEM
        WHERE nf.TIPO_ES = 'E' AND nf.CANCELADA = 'N'
        ORDER BY nf.DT_EMISSAO DESC
        ROWS 25
    """)
    itens_nf = cur.fetchall()
    
    for i in itens_nf:
        print(f"  NF {safe_str(i[0])} | {safe_str(i[1])[:35]} | NCM: {safe_str(i[2])} | Qtd: {safe_float(i[3]):.2f} | Total: R${safe_float(i[5]):.2f} | ICMS: {safe_float(i[6]):.1f}% | ST: R${safe_float(i[8]):.2f}")

    # 5. NOTAS FISCAIS DE SAIDA
    print("\n" + "=" * 60)
    print("NOTAS FISCAIS DE SAIDA (NF-e emitidas)")
    print("=" * 60)
    cur.execute("""
        SELECT ID, NRO_NF, DEST_RAZAO_SOCIAL, DT_EMISSAO,
               VLR_PRODUTOS, ICMS_VALOR, ICMS_ST_VALOR, PIS_VALOR,
               COFINS_VALOR, VLR_TOTAL, CANCELADA
        FROM FIS_NFE 
        WHERE TIPO_ES = 'S'
        ORDER BY DT_EMISSAO DESC
        ROWS 15
    """)
    notas_saida = cur.fetchall()
    
    for n in notas_saida:
        data = n[3].strftime('%d/%m/%Y') if n[3] else ''
        cancelada = ' [CANCELADA]' if n[10] == 'S' else ''
        print(f"  NF {safe_str(n[1])} | {safe_str(n[2])[:30]} | {data} | R${safe_float(n[9]):.2f} | ICMS: R${safe_float(n[5]):.2f}{cancelada}")

    # 6. VENDAS PDV (últimas 15)
    print("\n" + "=" * 60)
    print("VENDAS DO PDV (últimas 15)")
    print("=" * 60)
    cur.execute("""
        SELECT ID, DT_EMISSAO, NOME_CLIENTE, VLR_ITENS, VLR_DESCONTO, 
               VLR_TOTAL, VLR_PAGO, SITUACAO
        FROM EST_VENDAS
        WHERE SITUACAO = 'F'
        ORDER BY DT_EMISSAO DESC
        ROWS 15
    """)
    vendas = cur.fetchall()
    
    total_vendas_pdv = 0
    for v in vendas:
        total = safe_float(v[5])
        total_vendas_pdv += total
        data = v[1].strftime('%d/%m/%Y %H:%M') if v[1] else ''
        print(f"  Venda {v[0]} | {data} | R${total:.2f} | {safe_str(v[7])}")
    print(f"\n  Total vendas PDV (últimas 15): R$ {total_vendas_pdv:.2f}")

    # 7. RESUMO GERAL
    print("\n" + "=" * 60)
    print("RESUMO FINANCEIRO GERAL")
    print("=" * 60)
    
    cur.execute("SELECT SUM(VLR_TOTAL) FROM FIS_NF WHERE TIPO_ES = 'E' AND CANCELADA = 'N'")
    r1 = cur.fetchone()
    cur.execute("SELECT SUM(ICMS_VALOR) FROM FIS_NF WHERE TIPO_ES = 'E' AND CANCELADA = 'N'")
    r2 = cur.fetchone()
    cur.execute("SELECT SUM(ICMS_ST_VALOR) FROM FIS_NF WHERE TIPO_ES = 'E' AND CANCELADA = 'N'")
    r3 = cur.fetchone()
    cur.execute("SELECT SUM(PIS_VALOR) FROM FIS_NF WHERE TIPO_ES = 'E' AND CANCELADA = 'N'")
    r4 = cur.fetchone()
    cur.execute("SELECT SUM(COFINS_VALOR) FROM FIS_NF WHERE TIPO_ES = 'E' AND CANCELADA = 'N'")
    r5 = cur.fetchone()
    cur.execute("SELECT SUM(IPI_VALOR) FROM FIS_NF WHERE TIPO_ES = 'E' AND CANCELADA = 'N'")
    r6 = cur.fetchone()
    
    print(f"  ENTRADAS (NF-e):")
    print(f"    Total compras:      R$ {safe_float(r1[0]):>12.2f}")
    print(f"    ICMS credito:       R$ {safe_float(r2[0]):>12.2f}")
    print(f"    ST credito:         R$ {safe_float(r3[0]):>12.2f}")
    print(f"    PIS credito:        R$ {safe_float(r4[0]):>12.2f}")
    print(f"    COFINS credito:     R$ {safe_float(r5[0]):>12.2f}")
    print(f"    IPI credito:        R$ {safe_float(r6[0]):>12.2f}")
    
    total_creditos = safe_float(r2[0]) + safe_float(r3[0]) + safe_float(r4[0]) + safe_float(r5[0]) + safe_float(r6[0])
    print(f"    TOTAL CREDITOS:     R$ {total_creditos:>12.2f}")

    cur.execute("SELECT SUM(VLR_PRODUTOS), SUM(ICMS_VALOR), SUM(PIS_VALOR), SUM(COFINS_VALOR) FROM FIS_NFE WHERE TIPO_ES = 'S' AND CANCELADA = 'N'")
    rs = cur.fetchone()
    
    print(f"\n  SAIDAS (NF-e emitidas):")
    print(f"    Total vendas NF-e:  R$ {safe_float(rs[0]):>12.2f}")
    print(f"    ICMS debito:        R$ {safe_float(rs[1]):>12.2f}")
    print(f"    PIS debito:         R$ {safe_float(rs[2]):>12.2f}")
    print(f"    COFINS debito:      R$ {safe_float(rs[3]):>12.2f}")

    # 8. PRODUTOS COM ST
    print("\n" + "=" * 60)
    print("PRODUTOS COM SUBSTITUICAO TRIBUTARIA")
    print("=" * 60)
    cur.execute("""
        SELECT COUNT(*) FROM EST_PRODUTOS 
        WHERE ATIVO = 'S' AND FIS_ST_VLR_PAUTA > 0
    """)
    qtd_st = cur.fetchone()
    print(f"  Total de produtos com ST: {qtd_st[0]}")

    cur.execute("""
        SELECT ID, NOME, NCM, PRC_CUSTO, PRC_VENDA, FIS_ST_VLR_PAUTA
        FROM EST_PRODUTOS 
        WHERE ATIVO = 'S' AND FIS_ST_VLR_PAUTA > 0
        ORDER BY NOME
        ROWS 15
    """)
    produtos_st = cur.fetchall()
    for p in produtos_st:
        print(f"  [{p[0]}] {safe_str(p[1])[:35]} | NCM: {safe_str(p[2])} | Pauta ST: R${safe_float(p[5]):.2f}")

    con.close()
    print("\n=== EXTRACAO CONCLUIDA COM SUCESSO ===")

except Exception as e:
    print(f"ERRO: {e}")
    import traceback
    traceback.print_exc()
