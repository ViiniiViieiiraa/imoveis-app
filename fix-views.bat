@echo off
cd /d "%~dp0"
echo Removendo referencias ao partial flash das views...

powershell -Command "(Get-Content 'views\imoveis\index.hbs') | Where-Object {$_ -notmatch '\{\{> partials/flash\}\}'} | Set-Content 'views\imoveis\index.hbs'"
powershell -Command "(Get-Content 'views\imoveis\show.hbs') | Where-Object {$_ -notmatch '\{\{> partials/flash\}\}'} | Set-Content 'views\imoveis\show.hbs'"
powershell -Command "(Get-Content 'views\unidades\index.hbs') | Where-Object {$_ -notmatch '\{\{> partials/flash\}\}'} | Set-Content 'views\unidades\index.hbs'"
powershell -Command "(Get-Content 'views\unidades\show.hbs') | Where-Object {$_ -notmatch '\{\{> partials/flash\}\}'} | Set-Content 'views\unidades\show.hbs'"
powershell -Command "(Get-Content 'views\inquilinos\index.hbs') | Where-Object {$_ -notmatch '\{\{> partials/flash\}\}'} | Set-Content 'views\inquilinos\index.hbs'"
powershell -Command "(Get-Content 'views\inquilinos\show.hbs') | Where-Object {$_ -notmatch '\{\{> partials/flash\}\}'} | Set-Content 'views\inquilinos\show.hbs'"
powershell -Command "(Get-Content 'views\contratos\index.hbs') | Where-Object {$_ -notmatch '\{\{> partials/flash\}\}'} | Set-Content 'views\contratos\index.hbs'"
powershell -Command "(Get-Content 'views\contratos\show.hbs') | Where-Object {$_ -notmatch '\{\{> partials/flash\}\}'} | Set-Content 'views\contratos\show.hbs'"
powershell -Command "(Get-Content 'views\pagamentos\index.hbs') | Where-Object {$_ -notmatch '\{\{> partials/flash\}\}'} | Set-Content 'views\pagamentos\index.hbs'"
powershell -Command "(Get-Content 'views\pagamentos\show.hbs') | Where-Object {$_ -notmatch '\{\{> partials/flash\}\}'} | Set-Content 'views\pagamentos\show.hbs'"
powershell -Command "(Get-Content 'views\despesas\index.hbs') | Where-Object {$_ -notmatch '\{\{> partials/flash\}\}'} | Set-Content 'views\despesas\index.hbs'"

echo.
echo Concluido. Reinicie o sistema.
pause