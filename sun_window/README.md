# Sun Window Analyzer (NOAA)

วิเคราะห์ว่าแดดเข้าหน้าต่างทิศไหน ช่วงไหนของวัน/ปี และแดดตกในฤดูร้อนหรือหนาว
ตำแหน่งดวงอาทิตย์คำนวณด้วยสมการ NOAA Solar Calculator ใน `solar_core.py` (Python + NumPy)

## โครงสร้าง
- `solar_core.py` คำนวณ NOAA + วิเคราะห์ผนัง/ฤดูกาล
- `app.py` เว็บเซิร์ฟเวอร์ Flask (`/` หน้าเว็บ, `/api/analyze` ข้อมูล)
- `run_local.py` เวอร์ชันรันในคอม
- `static/` หน้าจอ GUI (HTML + JS)
- `render.yaml`, `requirements.txt` สำหรับ deploy บน Render

## 1) รันในคอม
    pip install -r requirements.txt
    pip install pywebview        # ไม่บังคับ: เปิดเป็นหน้าต่างโปรแกรม ถ้าไม่ลงจะเปิดในเบราว์เซอร์แทน
    python run_local.py

## 2) ขึ้นเว็บบน Render
1. อัปโหลดโฟลเดอร์นี้ขึ้น GitHub
2. Render > New > Blueprint (ใช้ `render.yaml`) หรือ New > Web Service แล้วตั้งค่า
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `gunicorn app:app --bind 0.0.0.0:$PORT --workers 2 --timeout 60`
3. Deploy เสร็จจะได้ลิงก์ `https://<ชื่อ>.onrender.com` (แพ็กเกจฟรีจะ sleep เมื่อไม่มีคนใช้ เปิดครั้งแรกอาจช้า 30-60 วินาที)

ทดสอบ API ตรง ๆ: `/api/analyze?lat=13.4533901&lon=101.0646541&tz=7&year=2026&wall=180`
