#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Servidor HTTP local para resolver problemas de CORS com Firebase
Execute este arquivo para testar uploads no dashboard
"""

import http.server
import socketserver
import webbrowser
import os
import sys

PORT = 8000

class CORSHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

def main():
    print("🚀 Iniciando servidor HTTP local...")
    print("🔧 Resolvendo problemas de CORS com Firebase...")
    
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    try:
        with socketserver.TCPServer(("", PORT), CORSHTTPRequestHandler) as httpd:
            print(f"✅ Servidor rodando em: http://localhost:{PORT}")
            print(f"📊 Dashboard: http://localhost:{PORT}/dashboard-modern.html")
            print(f"🌐 Site: http://localhost:{PORT}/index.html")
            print("\n🎯 INSTRUÇÕES:")
            print("1. Abra o dashboard no link acima")
            print("2. Teste o upload de imagens") 
            print("3. Pressione Ctrl+C para parar o servidor")
            print("\n" + "="*60)
            
            # Abrir automaticamente o dashboard
            webbrowser.open(f'http://localhost:{PORT}/dashboard-modern.html')
            
            httpd.serve_forever()
            
    except KeyboardInterrupt:
        print("\n🛑 Servidor parado pelo usuário")
    except OSError as e:
        if e.errno == 10048:  # Porta já em uso no Windows
            print(f"❌ Porta {PORT} já está em uso!")
            print("💡 Tente fechar outros servidores ou usar outra porta")
        else:
            print(f"❌ Erro ao iniciar servidor: {e}")

if __name__ == "__main__":
    main()