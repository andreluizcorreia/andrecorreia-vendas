#!/usr/bin/env python3
"""
DEPLOY DETERMINÍSTICO DE PRODUÇÃO — ANDRÉ CORREIA (andrecorreia01.com.br)
Protocolo de 3 Etapas:
  1. Git Commit & Push (GitHub: andreluizcorreia/andrecorreia-vendas)
  2. Cloudflare Pages Direct Upload (Wrangler CLI com Global API Key / Master Token)
  3. Gate de Realidade: Verificação HTTP 200 ativa na URL de produção

NÃO CONFLITA com o Blog (que utiliza gatilho automático via GitHub).
"""

import os
import sys
import subprocess
import time
import urllib.request
import ssl

sys.stdout.reconfigure(encoding='utf-8')

SITE_DIR = r"C:\Users\zzzAn\Documents\Phoenix Code\andrecorreia-site"
PROJECT_NAME = "andrecorreia-vendas"
LIVE_URL = "https://andrecorreia01.com.br/"
PAGES_URL = f"https://{PROJECT_NAME}.pages.dev/"
IMPERIO_DIR = r"C:\Users\zzzAn\Desktop\Imperio_Digital"

def get_cloudflare_creds():
    sys.path.insert(0, IMPERIO_DIR)
    try:
        from vault_seguro import vault
        global_key = vault.get("GLOBAL_API_KEY")
        email = "andreluizlimacorreia@gmail.com"
        acct = vault.get("ACCOUNT_ID") or vault.get("CLOUDFLARE_ACCOUNT_ID")
        return global_key, email, acct
    except Exception as e:
        print("[!] Aviso ao ler vault:", e)
        return None, "andreluizlimacorreia@gmail.com", "bac29e491b019854e69ed78064b2e19f"

def run_step(title, cmd, cwd=SITE_DIR, env=None):
    print("\n" + "=" * 65)
    print(f"  {title}")
    print("=" * 65)
    res = subprocess.run(cmd, cwd=cwd, env=env, capture_output=True, text=True, errors="replace")
    if res.stdout:
        print(res.stdout)
    if res.stderr and res.returncode != 0:
        print("[ERRO]:", res.stderr)
    return res.returncode == 0

def verificar_producao_http():
    print("\n" + "=" * 65)
    print("  ETAPA 3: GATE DE REALIDADE (VERIFICAÇÃO HTTP AO VIVO)")
    print("=" * 65)
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    
    # Ler index.html local para checar tamanho de referência
    local_index = os.path.join(SITE_DIR, "index.html")
    local_size = os.path.getsize(local_index)
    print(f"[+] Tamanho local do index.html: {local_size} bytes")

    urls_to_test = [PAGES_URL, LIVE_URL]
    todas_ok = True

    for u in urls_to_test:
        for attempt in range(1, 4):
            try:
                print(f"[*] Testando {u} (Tentativa {attempt}/3)...")
                req = urllib.request.Request(u, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"})
                with urllib.request.urlopen(req, context=ctx, timeout=15) as r:
                    body = r.read().decode("utf-8", errors="ignore")
                    remote_size = len(body)
                    has_6 = "6 Pilares" in body
                    has_pilar5 = "pilar-rastreamento-dados" in body
                    
                    print(f"    Status: {r.getcode()} | Tamanho remoto: {remote_size} bytes")
                    print(f"    Contém '6 Pilares': {has_6} | Contém Pilar 5: {has_pilar5}")
                    
                    if has_6 and has_pilar5:
                        print(f"    [SUCESSO] Produção em {u} está 100% atualizada e validada!")
                        break
                    else:
                        print(f"    [AVISO] CDN ainda propagando... aguardando 3s.")
                        time.sleep(3)
            except Exception as e:
                print(f"    [FALHA] Erro na requisição para {u}: {e}")
                time.sleep(3)
        else:
            todas_ok = False
            print(f"[!] ALERTA CRÍTICO: {u} não refletiu as alterações após 3 tentativas.")

    return todas_ok

def main(commit_msg="chore: atualizacao e sincronizacao de producao"):
    print("🚀 INICIANDO ESTEIRA DE DEPLOY COMPLETO (GIT + CLOUDFLARE + VERIFICAÇÃO)")
    
    # 1. GIT COMMIT & PUSH
    if not run_step("ETAPA 1.1: Git Add", ["git", "add", "-A"]):
        print("[!] Erro no git add.")
        return False

    # Git commit (permite continuar se não houver novas alterações)
    res_commit = subprocess.run(["git", "commit", "-m", commit_msg], cwd=SITE_DIR, capture_output=True, text=True, errors="replace")
    print(res_commit.stdout or res_commit.stderr or "Nenhuma nova alteração para comitar.")

    if not run_step("ETAPA 1.2: Git Push (GitHub)", ["git", "push", "origin", "main"]):
        print("[!] Aviso: Git push falhou ou nada a enviar.")

    # 2. CLOUDFLARE DIRECT UPLOAD
    global_key, email, acct = get_cloudflare_creds()
    env = os.environ.copy()
    if "CLOUDFLARE_API_TOKEN" in env:
        del env["CLOUDFLARE_API_TOKEN"]
    env["CLOUDFLARE_API_KEY"] = global_key
    env["CLOUDFLARE_EMAIL"] = email
    env["CLOUDFLARE_ACCOUNT_ID"] = acct

    cmd_deploy = [
        "npx.cmd",
        "wrangler",
        "pages",
        "deploy",
        SITE_DIR,
        f"--project-name={PROJECT_NAME}",
        "--branch=main",
        "--commit-dirty=true"
    ]
    if not run_step("ETAPA 2: Cloudflare Pages Direct Deploy", cmd_deploy, env=env):
        print("[!] Erro fatal no Cloudflare Pages Deploy.")
        return False

    # 3. VERIFICAÇÃO REAL AO VIVO
    return verificar_producao_http()

if __name__ == "__main__":
    msg = sys.argv[1] if len(sys.argv) > 1 else "feat: deploy e sincronizacao oficial"
    success = main(msg)
    if success:
        print("\n✅ PROCESSO DE PRODUÇÃO HOMOLOGADO E PUBLICADO COM SUCESSO!")
        sys.exit(0)
    else:
        print("\n❌ FALHA NA HOMOLOGAÇÃO DO DEPLOY.")
        sys.exit(1)
