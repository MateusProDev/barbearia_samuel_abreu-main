#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import http.server
import socketserver
import webbrowser
import os

class SimpleHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Headers simples para permitir tudo
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', '*')
        self.send_header('Access-Control-Allow-Headers', '*')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

if __name__ == "__main__":
    PORT = 8000
    
    print("🚀 Servidor HTTP Simples")
    print(f"📊 Dashboard: http://localhost:{PORT}/dashboard-modern.html")
    print(f"🌐 Site: http://localhost:{PORT}/index.html")
    print("✅ Agora pode fazer upload de imagens!")
    print("🔴 Pressione Ctrl+C para parar\n")
    
    with socketserver.TCPServer(("", PORT), SimpleHTTPRequestHandler) as httpd:
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n🛑 Servidor parado!")