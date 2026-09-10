@echo off
cd /d "%~dp0"

set "PYTHON_SCRIPT=A1A2A3A4A5.py"

if exist "%PYTHON_SCRIPT%" (
    python "%PYTHON_SCRIPT%"
) else (
    echo [ERRO] O arquivo %PYTHON_SCRIPT% nao foi encontrado.
    pause
)

exit /b