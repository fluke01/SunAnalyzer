"""Sun Window Analyzer - เว็บเซิร์ฟเวอร์ (Flask). ใช้ได้ทั้งรันในเครื่องและ deploy บน Render"""
import os

from flask import Flask, jsonify, request, send_from_directory

from solar_core import analyze

app = Flask(__name__, static_folder="static", static_url_path="/static")


@app.get("/")
def index():
    return send_from_directory(app.static_folder, "index.html")


@app.get("/healthz")
def healthz():
    return "ok"


@app.get("/api/analyze")
def api_analyze():
    a = request.args
    try:
        lat, lon, tz = float(a["lat"]), float(a["lon"]), float(a.get("tz", 0))
        year, wall, day = int(a.get("year", 2026)), float(a.get("wall", 180)) % 360, int(a.get("day", 0))
    except (KeyError, ValueError):
        return jsonify(error="พารามิเตอร์ไม่ถูกต้อง"), 400
    if not (-89.9 <= lat <= 89.9 and -180 <= lon <= 180 and -14 <= tz <= 14 and 1900 <= year <= 2100):
        return jsonify(error="ค่าพิกัด เขตเวลา หรือปี อยู่นอกช่วงที่รองรับ"), 400
    return jsonify(analyze(lat, lon, tz, year, wall, a.get("season", "auto"), day))


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)))
