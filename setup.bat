@echo off
title Setup - Sistema de Gestao de Imoveis
cd /d "%~dp0"

echo.
echo  ================================================
echo   Setup - Sistema de Gestao de Imoveis
echo  ================================================
echo.

where node >nul 2>&1
if errorlevel 1 (
  echo  [ERRO] Node.js nao encontrado.
  echo.
  echo  Instale o Node.js LTS em: https://nodejs.org
  echo  Marque a opcao "Add to PATH" durante a instalacao.
  echo.
  pause
  exit /b 1
)

for /f "tokens=*" %%v in ('node -v') do set NODE_VER=%%v
echo  Node.js encontrado: %NODE_VER%
echo.

echo  [1/4] Instalando dependencias...
call npm install
if errorlevel 1 (
  echo  [ERRO] Falha ao instalar dependencias.
  pause
  exit /b 1
)

echo.
echo  [2/4] Gerando Prisma Client...
call npx prisma generate
if errorlevel 1 (
  echo  [ERRO] Falha ao gerar Prisma Client.
  pause
  exit /b 1
)

echo.
echo  [3/4] Criando banco de dados...
if not exist "data" mkdir data
call npx prisma db push
if errorlevel 1 (
  echo  [ERRO] Falha ao criar banco de dados.
  pause
  exit /b 1
)

echo.
echo  [4/4] Compilando o projeto...
call npm run build
if errorlevel 1 (
  echo  [ERRO] Falha na compilacao TypeScript.
  pause
  exit /b 1
)

echo.
echo  ================================================
echo   Setup concluido com sucesso!
echo.
echo   Execute iniciar.bat para abrir o sistema.
echo  ================================================
echo.
pause
