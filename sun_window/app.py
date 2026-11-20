"""Sun Window Analyzer - เว็บเซิร์ฟเวอร์ (Flask). ใช้ได้ทั้งรันในเครื่องและ deploy บน Render"""
import json
import os
import threading
import time
import urllib.parse
import urllib.request
from functools import lru_cache

from flask import Flask, jsonify, request, send_from_directory
from flask_compress import Compress

from solar_core import analyze

app = Flask(__name__, static_folder="static", static_url_path="/static")
app.config["COMPRESS_MIMETYPES"] = ["application/json", "text/html", "application/javascript", "text/css"]
Compress(app)


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


UA = os.environ.get("GEOCODE_UA", "SunWindowAnalyzer/1.0 (personal tool; set GEOCODE_UA env var with your contact email)")
_gate, _last = threading.Lock(), [0.0]


def _get_json(url, timeout):
    with urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": UA}), timeout=timeout) as r:
        return json.load(r)


@lru_cache(maxsize=256)
def _geocode(q):
    """ค้นหาสถานที่ด้วย OpenStreetMap Nominatim (ฟรี ไม่ต้องมี API key) จำกัด 1 ครั้ง/วินาทีตามเงื่อนไขของบริการ"""
    with _gate:
        time.sleep(max(0.0, 1.05 - (time.time() - _last[0])))
        _last[0] = time.time()
    url = "https://nominatim.openstreetmap.org/search?" + urllib.parse.urlencode(
        {"q": q, "format": "jsonv2", "limit": 6, "accept-language": "th,en"})
    return tuple(dict(name=d["display_name"], lat=float(d["lat"]), lon=float(d["lon"])) for d in _get_json(url, 8))


@lru_cache(maxsize=512)
def _tz(lat, lon):
    url = "https://api.open-meteo.com/v1/forecast?" + urllib.parse.urlencode(
        {"latitude": lat, "longitude": lon, "current": "temperature_2m", "timezone": "auto", "forecast_days": 1})
    return _get_json(url, 6)["utc_offset_seconds"] / 3600


@app.get("/api/geocode")
def api_geocode():
    q = request.args.get("q", "").strip()
    if not 2 <= len(q) <= 120:
        return jsonify(error="พิมพ์ชื่อสถานที่อย่างน้อย 2 ตัวอักษร"), 400
    try:
        return jsonify(results=list(_geocode(q)))
    except Exception:
        return jsonify(error="บริการแผนที่ไม่ตอบสนอง ลองใหม่อีกครั้ง หรือกรอกพิกัดเอง"), 502


@app.get("/api/tz")
def api_tz():
    try:
        lat, lon = round(float(request.args["lat"]), 2), round(float(request.args["lon"]), 2)
        assert -90 <= lat <= 90 and -180 <= lon <= 180
        return jsonify(tz=_tz(lat, lon))
    except Exception:
        return jsonify(error="หาเขตเวลาไม่ได้"), 502


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)))
