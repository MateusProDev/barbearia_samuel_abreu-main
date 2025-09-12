@echo off
echo 🚀 Iniciando servidor HTTP local para resolver CORS...
echo.
echo 🔧 Este servidor resolve problemas de CORS com Firebase
echo 📊 Permite uploads no dashboard funcionar corretamente
echo.

REM Tentar Python 3 primeiro
python --version > nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Python encontrado - Iniciando servidor...
    python servidor-local.py
    goto :end
)

REM Tentar python3 se python não funcionou
python3 --version > nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Python3 encontrado - Iniciando servidor...
    python3 servidor-local.py
    goto :end
)

REM Tentar py se nenhum dos anteriores funcionou
py --version > nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Py encontrado - Iniciando servidor...
    py servidor-local.py
    goto :end
)

echo ❌ Python não encontrado no sistema!
echo.
echo 💡 SOLUÇÕES:
echo 1. Instale Python de https://www.python.org/downloads/
echo 2. Ou use um servidor HTTP alternativo
echo 3. Ou configure CORS no Firebase Console
echo.
pause

:end