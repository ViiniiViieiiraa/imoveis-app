@echo off
title Sistema de Gestao de Imoveis
cd /d "%~dp0"

echo.
echo  ================================================
echo   Sistema de Gestao de Imoveis
echo  ================================================
echo.

if not exist "node_modules" (
  echo  [!] Dependencias nao instaladas.
  echo  [!] Execute setup.bat primeiro.
  echo.
  pause
  exit /b 1
)

if not exist "dist\server.js" (
  echo  Compilando o projeto...
  call npm run build
  if errorlevel 1 (
    echo  [ERRO] Falha na compilacao. Verifique os erros acima.
    pause
    exit /b 1
  )
  echo.
)

if not exist "data" mkdir data

echo  Verificando banco de dados...
call npx prisma db push --skip-generate
if errorlevel 1 (
  echo  [ERRO] Falha ao verificar banco de dados.
  pause
  exit /b 1
)

echo.
echo  Servidor iniciando em http://localhost:3000
echo  Para encerrar o sistema, feche esta janela ou pressione Ctrl+C.
echo.

start "" "http://localhost:3000"

node dist\server.js
