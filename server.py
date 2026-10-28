#!/usr/bin/env python3
import http.server
import socketserver
import os
import sys

PORT = 8080
HOST = "127.0.0.1"

class Handler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Добавляем заголовки кэширования для разработки
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
        super().end_headers()

def run():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(script_dir)

    socketserver.TCPServer.allow_reuse_address = True
    try:
        with socketserver.TCPServer((HOST, PORT), Handler) as httpd:
            print(f"==================================================")
            print(f"🐸 Сервер Froggy Jump 2D успешно запущен!")
            print(f"🔗 Откройте в браузере: http://{HOST}:{PORT}")
            print(f"📱 Оптимизировано для Android (тач-управление, кнопки, наклон)")
            print(f"==================================================")
            sys.stdout.flush()
            httpd.serve_forever()
    except OSError as e:
        print(f"Ошибка запуска на порту {PORT}: {e}")

if __name__ == "__main__":
    run()
