"""Sun Window Analyzer - เวอร์ชันรันในคอมพิวเตอร์

python run_local.py
- ถ้าติดตั้ง pywebview (pip install pywebview) จะเปิดเป็นหน้าต่างโปรแกรมของตัวเอง
- ถ้าไม่มี จะเปิดในเบราว์เซอร์ให้อัตโนมัติ (ทำงานออฟไลน์ได้ ยกเว้นฟอนต์จาก Google)
"""
import socket
import threading
import time
import webbrowser

from app import app


def free_port():
    with socket.socket() as s:
        s.bind(("127.0.0.1", 0))
        return s.getsockname()[1]


def main():
    port = free_port()
    url = f"http://127.0.0.1:{port}"
    threading.Thread(target=lambda: app.run(host="127.0.0.1", port=port, debug=False, use_reloader=False),
                     daemon=True).start()
    time.sleep(0.8)
    try:
        import webview
        webview.create_window("Sun Window Analyzer (NOAA)", url, width=1200, height=900)
        webview.start()
    except ImportError:
        print(f"เปิดที่ {url}  (กด Ctrl+C เพื่อปิดโปรแกรม)")
        webbrowser.open(url)
        try:
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            pass


if __name__ == "__main__":
    main()
