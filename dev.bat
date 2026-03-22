@echo off
title Dev - Sistema de Gestao de Imoveis
cd /d "%~dp0"

if not exist "node_modules" (
  echo  [!] Execute setup.bat primeiro.
  pause
  exit /b 1
)

if not exist "data" mkdir data

echo  Verificando banco de dados...
call npx prisma db push --skip-generate
if errorlevel 1 ( echo  [ERRO] Falha ao verificar banco. & pause & exit /b 1 )

echo.
echo  Modo desenvolvimento  ^(hot reload ativo^)
echo  Acesse: http://localhost:3000
echo  Ctrl+C para encerrar
echo.

start "" "http://localhost:3000"

npx tsx watch src/server.ts
