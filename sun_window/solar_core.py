"""Sun Window Analyzer - core library.

ตำแหน่งดวงอาทิตย์คำนวณด้วยสมการของ NOAA Solar Calculator
(Julian Day -> Equation of Time -> Declination -> Hour Angle -> Zenith/Azimuth)
ทุก 5 นาทีตลอดปี แล้ววิเคราะห์ว่าแดดตกกระทบผนังทิศที่เลือกเมื่อไร
"""
import base64
import calendar
from datetime import date
from functools import lru_cache

import numpy as np

STEP, N = 5, 288  # 5 นาที x 288 ช่อง = 24 ชม.
DIRS = [("เหนือ", 0), ("ตะวันออกเฉียงเหนือ", 45), ("ตะวันออก", 90), ("ตะวันออกเฉียงใต้", 135),
        ("ใต้", 180), ("ตะวันตกเฉียงใต้", 225), ("ตะวันตก", 270), ("ตะวันตกเฉียงเหนือ", 315)]

_MID = "มี.ค. – พ.ค. และ ก.ย. – พ.ย."
SEASONS = {
    "thai": dict(n=["ฤดูร้อน", "ฤดูฝน", "ฤดูหนาว"],
                 r=["15 ก.พ. – 14 พ.ค.", "15 พ.ค. – 14 ต.ค.", "15 ต.ค. – 14 ก.พ."]),
    "north": dict(n=["ฤดูร้อน", "ฤดูใบไม้ผลิ/ร่วง", "ฤดูหนาว"], r=["มิ.ย. – ส.ค.", _MID, "ธ.ค. – ก.พ."]),
    "south": dict(n=["ฤดูร้อน", "ฤดูใบไม้ผลิ/ร่วง", "ฤดูหนาว"], r=["ธ.ค. – ก.พ.", _MID, "มิ.ย. – ส.ค."]),
}


def auto_season(lat, lon):
    if 5 <= lat <= 21 and 97 <= lon <= 106:
        return "thai"
    return "north" if lat >= 0 else "south"


def season_index(key, month, day):
    """0 = ร้อน, 1 = ฝน/ช่วงกลาง, 2 = หนาว"""
    if key == "thai":
        k = month * 100 + day
        return 0 if 215 <= k <= 514 else 1 if 515 <= k <= 1014 else 2
    hot, cool = ((6, 7, 8), (12, 1, 2)) if key == "north" else ((12, 1, 2), (6, 7, 8))
    return 0 if month in hot else 2 if month in cool else 1


@lru_cache(maxsize=16)
def sun_position(year, lat, lon, tz):
    """NOAA Solar Calculator -> (elevation, azimuth) แต่ละอาร์เรย์ขนาด (วัน, 288)"""
    nd = 366 if calendar.isleap(year) else 365
    mins = np.broadcast_to((np.arange(N) * STEP)[None, :], (nd, N))
    jd = date(year, 1, 1).toordinal() + 1721424.5 + np.arange(nd)[:, None] + mins / 1440.0 - tz / 24.0
    r, t = np.radians, (jd - 2451545.0) / 36525.0
    L0 = (280.46646 + t * (36000.76983 + t * 3.032e-4)) % 360
    M = 357.52911 + t * (35999.05029 - 1.537e-4 * t)
    e = 0.016708634 - t * (4.2037e-5 + 1.267e-7 * t)
    C = (np.sin(r(M)) * (1.914602 - t * (0.004817 + 1.4e-5 * t))
         + np.sin(r(2 * M)) * (0.019993 - 1.01e-4 * t) + np.sin(r(3 * M)) * 2.89e-4)
    om = 125.04 - 1934.136 * t
    app = L0 + C - 0.00569 - 0.00478 * np.sin(r(om))
    oc = 23 + (26 + (21.448 - t * (46.815 + t * (5.9e-4 - t * 1.813e-3))) / 60) / 60 + 0.00256 * np.cos(r(om))
    dec = np.arcsin(np.sin(r(oc)) * np.sin(r(app)))
    y = np.tan(r(oc) / 2) ** 2
    eot = 4 * np.degrees(y * np.sin(2 * r(L0)) - 2 * e * np.sin(r(M)) + 4 * e * y * np.sin(r(M)) * np.cos(2 * r(L0))
                         - 0.5 * y * y * np.sin(4 * r(L0)) - 1.25 * e * e * np.sin(2 * r(M)))
    tst = (mins + eot + 4 * lon - 60 * tz) % 1440
    ha, la = r(tst / 4 - 180), np.radians(lat)
    cz = np.sin(la) * np.sin(dec) + np.cos(la) * np.cos(dec) * np.cos(ha)
    z = np.arccos(np.clip(cz, -1, 1))
    sz = np.sin(z)
    with np.errstate(all="ignore"):
        x = np.clip((np.sin(la) * cz - np.sin(dec)) / (np.cos(la) * sz), -1, 1)
    az = np.degrees(np.arccos(x))
    az = np.where(ha > 0, (az + 180) % 360, (540 - az) % 360)
    az = np.where(sz > 1e-6, az, 180.0)
    return 90 - np.degrees(z), az


@lru_cache(maxsize=8)
def calendar_arrays(year):
    nd = 366 if calendar.isleap(year) else 365
    ds = [date.fromordinal(date(year, 1, 1).toordinal() + i) for i in range(nd)]
    return np.array([d.month for d in ds]), np.array([d.day for d in ds])


def facade(el, az, wall):
    """ความแรงแดดที่ตกฉากกับผนังแนวตั้ง = cos(มุมสูง) x cos(ต่างมุมกับทิศผนัง); 0 ถ้าแดดไม่เข้า"""
    c = np.cos(np.radians(el)) * np.cos(np.radians(az - wall))
    return np.where((el > 0) & (c > 0.02), c, 0.0)


def stats(I, months, se):
    nd = I.shape[0]
    hrs, sc = (I > 0).sum(1) * STEP / 60, I.sum(1) * STEP / 60
    cnt = np.bincount(months - 1, minlength=12)
    ss = [float(sc[se == k].sum()) for k in range(3)]
    return dict(
        hrs=np.round(hrs, 3).tolist(), sc=np.round(sc, 4).tolist(),
        mh=np.round(np.bincount(months - 1, hrs, 12) / cnt, 3).tolist(),
        ms=np.round(np.bincount(months - 1, sc, 12) / cnt, 4).tolist(),
        ss=ss, sh=[float(hrs[se == k].sum()) for k in range(3)], sd=[int((se == k).sum()) for k in range(3)],
        heat=(ss[0] + 0.5 * ss[1]) / nd,           # ภาระความร้อน = แดดหน้าร้อน + 0.5 x แดดหน้าฝน
        avgH=float(hrs.mean()), avgS=float(sc.mean()), tod=np.round(I.mean(0), 4).tolist())


def _b64(a):
    return base64.b64encode(np.ascontiguousarray(a).tobytes()).decode()


@lru_cache(maxsize=32)
def _base(year, lat, lon, tz, season):
    """งานหนักที่ไม่ขึ้นกับทิศผนัง/วันที่ -> เก็บแคชไว้ ครั้งแรกของแต่ละพิกัดเท่านั้นที่ช้า"""
    el, az = sun_position(year, lat, lon, tz)
    months, days = calendar_arrays(year)
    key = auto_season(lat, lon) if season not in SEASONS else season
    se = np.array([season_index(key, m, d) for m, d in zip(months, days)])
    cmp = []
    for name, a in DIRS:
        s = stats(facade(el, az, a), months, se)
        s.update(n=name, a=a)
        cmp.append(s)
    up = np.where(el > 0)[1]
    lo, hi = max(0, int(up.min()) - 6), min(N - 1, int(up.max()) + 6)
    return el, az, months, key, se, cmp, lo, hi


def analyze(lat, lon, tz, year, wall, season="auto", day=0):
    el, az, months, key, se, cmp, lo, hi = _base(year, round(lat, 6), round(lon, 6), float(tz), season)
    nd = el.shape[0]
    I = facade(el, az, wall)
    sel = stats(I, months, se)
    # 0 = กลางคืน, 1 = กลางวันแต่ไม่มีแดดเข้า, 2..255 = ความแรงแดด
    code = np.where(el <= 0, 0, np.where(I > 0, 2 + np.round(np.minimum(I, 1) * 253), 1)).astype(np.uint8)
    day = int(min(max(day, 0), nd - 1))
    return dict(
        year=year, nd=nd, lo=lo, hi=hi, rows=hi - lo + 1,
        codes=_b64(code[:, lo:hi + 1]),
        sel=sel, cmp=cmp,
        day=dict(el=np.round(el[day], 2).tolist(), az=np.round(az[day], 2).tolist(), I=np.round(I[day], 3).tolist()),
        season=dict(key=key, n=SEASONS[key]["n"], r=SEASONS[key]["r"], se=se.tolist()),
    )
