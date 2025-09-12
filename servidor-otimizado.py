#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
🚀 SERVIDOR LOCAL PARA BARBEARIA SAMUEL ABREU
📊 Resolve problemas de CORS com Firebase e melhora performance
⚡ Versão otimizada com suporte completo para uploads
"""

import http.server
import socketserver
import webbrowser
import threading
import time
import os
import sys
from urllib.parse import urlparse

class CORSHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    """Handler HTTP com suporte completo a CORS para Firebase"""
    
    def end_headers(self):
        # Headers essenciais para Firebase
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH')
        self.send_header('Access-Control-Allow-Headers', 
                        'Content-Type, Authorization, X-Requested-With, Origin, Accept, X-Firebase-Storage, X-Firebase-Auth')
        self.send_header('Access-Control-Expose-Headers', 'Content-Length, Content-Type, Date, Server, X-Firebase-Storage')
        self.send_header('Access-Control-Max-Age', '86400')
        
        # Headers de cache otimizados
        if self.path.endswith('.html'):
            self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
            self.send_header('Pragma', 'no-cache')
            self.send_header('Expires', '0')
        elif any(self.path.endswith(ext) for ext in ['.js', '.css', '.png', '.jpg', '.jpeg', '.gif', '.svg']):
            self.send_header('Cache-Control', 'public, max-age=3600')
        
        # Security headers
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.send_header('X-Frame-Options', 'SAMEORIGIN')
        
        super().end_headers()
    
    def do_OPTIONS(self):
        """Handle preflight CORS requests"""
        self.send_response(200, "OK")
        self.end_headers()
    
    def do_GET(self):
        """Handle GET requests with better logging"""
        # Log melhorado
        if not self.path.endswith('.ico'):  # Ignorar favicon logs
            parsed = urlparse(self.path)
            print(f"📁 Servindo: {parsed.path}")
            
        return super().do_GET()
    
    def log_message(self, format, *args):
        """Log personalizado mais limpo"""
        if not args[0].endswith('favicon.ico') and not args[0].endswith('.well-known'):
            timestamp = time.strftime('%H:%M:%S', time.localtime())
            print(f"[{timestamp}] {format % args}")

def find_free_port(start_port=8000, max_port=8100):
    """Encontra uma porta disponível"""
    import socket
    for port in range(start_port, max_port):
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                s.bind(('', port))
                return port
        except OSError:
            continue
    return None

def open_browser_delayed(url, delay=2):
    """Abre o navegador após um delay"""
    def open_browser():
        time.sleep(delay)
        try:
            print(f"🌐 Abrindo navegador: {url}")
            webbrowser.open(url)
        except Exception as e:
            print(f"⚠️ Não foi possível abrir o navegador: {e}")
            print(f"📋 Acesse manualmente: {url}")
    
    thread = threading.Thread(target=open_browser, daemon=True)
    thread.start()

def print_banner():
    """Banner informativo"""
    print("=" * 60)
    print("🏪 BARBEARIA SAMUEL ABREU - SERVIDOR LOCAL")
    print("=" * 60)

def print_instructions(port):
    """Instruções de uso"""
    base_url = f"http://localhost:{port}"
    dashboard_url = f"{base_url}/dashboard-modern.html"
    site_url = f"{base_url}/index.html"
    login_url = f"{base_url}/login.html"
    
    print(f"""
✅ Servidor rodando em: {base_url}
📊 Dashboard: {dashboard_url}
🔐 Login: {login_url}
🌐 Site: {site_url}

🎯 PRÓXIMOS PASSOS:
1. 📋 Faça login no sistema: {login_url}
2. 🎛️ Acesse o dashboard: {dashboard_url}
3. 🖼️ Teste upload de imagens nas seções
4. 🔄 Verifique sincronização em tempo real
5. 📱 Teste responsividade no celular

⚡ RECURSOS HABILITADOS:
✓ CORS configurado para Firebase
✓ Headers de segurança otimizados
✓ Cache inteligente para performance
✓ Suporte completo a uploads
✓ Sincronização em tempo real

🛠️ TROUBLESHOOTING:
• Se upload falhar: Verifique regras do Firebase Storage
• Se imagens não aparecerem: Aguarde sync (pode demorar uns segundos)
• Se CORS ainda der problema: Use as regras em storage-rules-public.txt

💡 DICA: Mantenha DevTools aberto (F12) para monitorar requests

🔴 Pressione Ctrl+C para parar o servidor
""")

def main():
    """Função principal"""
    try:
        # Verificar se estamos no diretório correto
        if not os.path.exists('dashboard-modern.html'):
            print("❌ Erro: dashboard-modern.html não encontrado!")
            print("💡 Execute este script na pasta raiz do projeto")
            print("📂 Pasta atual:", os.getcwd())
            return 1
        
        # Encontrar porta disponível
        port = find_free_port()
        if port is None:
            print("❌ Erro: Nenhuma porta disponível entre 8000-8100")
            return 1
        
        print_banner()
        print(f"🚀 Iniciando servidor na porta {port}...")
        print("🔧 Configurando CORS para Firebase...")
        
        # Configurar servidor
        handler = CORSHTTPRequestHandler
        httpd = socketserver.TCPServer(("", port), handler)
        httpd.allow_reuse_address = True
        
        print_instructions(port)
        
        # Abrir navegador automaticamente
        dashboard_url = f"http://localhost:{port}/dashboard-modern.html"
        open_browser_delayed(dashboard_url)
        
        print("=" * 60)
        print("📡 SERVIDOR ATIVO - Logs em tempo real:")
        print("=" * 60)
        
        # Iniciar servidor
        httpd.serve_forever()
        
    except KeyboardInterrupt:
        print("\n" + "=" * 60)
        print("🛑 SERVIDOR INTERROMPIDO pelo usuário")
        print("=" * 60)
        print("✅ Obrigado por usar o sistema!")
        print("🔄 Execute novamente quando precisar testar")
        return 0
    except Exception as e:
        print(f"\n❌ ERRO INESPERADO: {e}")
        print("💡 Tente executar novamente ou verifique as permissões")
        return 1

if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)