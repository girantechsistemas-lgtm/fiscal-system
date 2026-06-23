# -*- coding: utf-8 -*-
import fdb
import os
import sys

# Force UTF-8 output
sys.stdout.reconfigure(encoding='utf-8')

FBCLIENT = r"C:\Program Files\Firebird\Firebird_2_5\bin\fbclient.dll"
BANCO = r"D:\SSA\GourmetSA\Dados\banco_vps.fdb"

try:
    con = fdb.connect(
        dsn=BANCO,
        user='SYSDBA',
        password='masterkey',
        fb_library_name=FBCLIENT
    )
    print("CONECTADO AO BANCO DE DADOS!")
    
    cur = con.cursor()
    
    # 1. Listar todas as tabelas
    print("\n=== TABELAS EXISTENTES ===")
    cur.execute("""
        SELECT RDB$RELATION_NAME 
        FROM RDB$RELATIONS 
        WHERE RDB$SYSTEM_FLAG = 0
        ORDER BY RDB$RELATION_NAME
    """)
    tabelas = [row[0].strip() for row in cur.fetchall()]
    for t in tabelas:
        print(f"  - {t}")
    
    print(f"\nTotal de tabelas: {len(tabelas)}")
    
    # 2. Procurar tabelas relevantes
    print("\n=== TABELAS RELEVANTES ===")
    relevantes = [t for t in tabelas if any(k in t.upper() for k in ['PRODUTO', 'ITEM', 'NF', 'NOTA', 'VENDA', 'COMPRA', 'ENTRADA', 'SAIDA', 'PEDIDO', 'CLIENTE', 'FORNEC', 'ESTOQUE', 'CST', 'NCM', 'CFOP'])]
    for t in relevantes:
        print(f"\n--- {t} ---")
        cur.execute(f"SELECT FIRST 2 * FROM {t}")
        cols = [desc[0].strip() for desc in cur.description]
        print(f"  Colunas: {cols}")
        rows = cur.fetchall()
        for row in rows:
            print(f"  Dados: {row}")
    
    con.close()
    print("\nConexao encerrada.")
    
except Exception as e:
    print(f"ERRO: {e}")
    import traceback
    traceback.print_exc()
