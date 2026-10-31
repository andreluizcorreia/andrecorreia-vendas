@echo off
chcp 65001 >nul
title Deploy Oficial andrecorreia01.com.br (Git + Cloudflare + Verificacao)
color 0A

echo =========================================================================
echo   ANDRÉ CORREIA — DEPLOY OFICIAL DE PRODUÇÃO (GIT + CLOUDFLARE PAGES)
echo =========================================================================
echo.

set /p MSG="Mensagem do Commit (ou pressione ENTER para mensagem padrao): "
if "%MSG%"=="" set MSG=feat: atualizacao oficial de producao

python "C:\Users\zzzAn\Documents\Phoenix Code\andrecorreia-site\deploy_producao.py" "%MSG%"

echo.
pause
