#!/usr/bin/env python3
"""Generate the in-game "photos" for AFTER SIGN-OFF.

Every image is drawn procedurally (no external assets, no licensing issues)
and then degraded to look like a cheap early-2000s digital camera shot:
blur, sensor noise, vignette, an orange date stamp and heavy JPEG artifacts.

Usage:  python3 tools/gen_photos.py
Output: src/assets/img/*.jpg and build/icon.png
"""
import io
import math
import os
import random

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'src', 'assets', 'img')
W, H = 640, 480


# ---------------------------------------------------------------- helpers
def canvas(color=(0, 0, 0)):
    img = Image.new('RGB', (W, H), color)
    return img, ImageDraw.Draw(img)


def vgradient(img, box, top, bottom):
    x0, y0, x1, y1 = box
    d = ImageDraw.Draw(img)
    for y in range(y0, y1):
        t = (y - y0) / max(1, (y1 - y0 - 1))
        c = tuple(int(top[i] + (bottom[i] - top[i]) * t) for i in range(3))
        d.line([(x0, y), (x1, y)], fill=c)


def blob(img, xy, r, color, blur=8, alpha=1.0):
    """Soft glowing circle composited on top."""
    layer = Image.new('RGB', img.size, (0, 0, 0))
    mask = Image.new('L', img.size, 0)
    ImageDraw.Draw(layer).ellipse([xy[0] - r, xy[1] - r, xy[0] + r, xy[1] + r], fill=color)
    ImageDraw.Draw(mask).ellipse([xy[0] - r, xy[1] - r, xy[0] + r, xy[1] + r], fill=int(255 * alpha))
    mask = mask.filter(ImageFilter.GaussianBlur(blur))
    img.paste(layer, (0, 0), mask)


def person(d, x, feet, h, shirt, pants=(40, 40, 60), skin=(225, 180, 150), hair=(70, 45, 25), sitting=False):
    head = h * 0.13
    if sitting:
        body_top = feet - h * 0.55
        d.rounded_rectangle([x - h * 0.13, body_top, x + h * 0.13, feet - h * 0.08], radius=int(h * 0.05), fill=shirt)
        d.rounded_rectangle([x - h * 0.15, feet - h * 0.12, x + h * 0.3, feet], radius=int(h * 0.04), fill=pants)
    else:
        body_top = feet - h * 0.82
        d.rounded_rectangle([x - h * 0.12, body_top, x + h * 0.12, feet - h * 0.42], radius=int(h * 0.05), fill=shirt)
        d.rectangle([x - h * 0.1, feet - h * 0.44, x - h * 0.01, feet], fill=pants)
        d.rectangle([x + h * 0.01, feet - h * 0.44, x + h * 0.1, feet], fill=pants)
        d.rectangle([x - h * 0.17, body_top + h * 0.03, x - h * 0.11, feet - h * 0.47], fill=shirt)
        d.rectangle([x + h * 0.11, body_top + h * 0.03, x + h * 0.17, feet - h * 0.47], fill=shirt)
    hy = body_top - head * 1.05
    d.ellipse([x - head * 0.85, hy - head, x + head * 0.85, hy + head], fill=skin)
    d.chord([x - head * 0.9, hy - head * 1.1, x + head * 0.9, hy + head * 0.4], 180, 360, fill=hair)
    return hy


def tall_figure(d, x, feet, h, color):
    head = h * 0.055
    sh = h * 0.12
    top = feet - h
    d.ellipse([x - head * 0.85, top, x + head * 0.85, top + head * 2.3], fill=color)
    ny = top + head * 2.1
    pts = [(x - head * 0.3, ny), (x - sh / 2, ny + h * 0.05), (x - sh / 2 - h * 0.035, feet - h * 0.3),
           (x - sh / 2 - h * 0.012, feet - h * 0.3), (x - sh * 0.36, ny + h * 0.18), (x - sh * 0.28, feet - h * 0.47),
           (x - sh * 0.3, feet), (x - sh * 0.1, feet), (x, feet - h * 0.42), (x + sh * 0.1, feet), (x + sh * 0.3, feet),
           (x + sh * 0.28, feet - h * 0.47), (x + sh * 0.36, ny + h * 0.18), (x + sh / 2 + h * 0.012, feet - h * 0.3),
           (x + sh / 2 + h * 0.035, feet - h * 0.3), (x + sh / 2, ny + h * 0.05), (x + head * 0.3, ny)]
    d.polygon(pts, fill=color)


def tower(d, x, base, top, red=(200, 50, 42), white=(240, 240, 240), lw=3, wbase=56):
    segs = 14
    for i in range(segs):
        y0 = base - (base - top) * i / segs
        y1 = base - (base - top) * (i + 1) / segs
        w0 = wbase + (8 - wbase) * i / segs
        w1 = wbase + (8 - wbase) * (i + 1) / segs
        c = red if i % 2 == 0 else white
        d.line([(x - w0 / 2, y0), (x - w1 / 2, y1)], fill=c, width=lw)
        d.line([(x + w0 / 2, y0), (x + w1 / 2, y1)], fill=c, width=lw)
        d.line([(x - w0 / 2, y0), (x + w1 / 2, y1)], fill=c, width=max(1, lw - 1))
        d.line([(x + w0 / 2, y0), (x - w1 / 2, y1)], fill=c, width=max(1, lw - 1))
    d.line([(x, top), (x, top - 50)], fill=white, width=lw)


SEG = {  # seven segment: a b c d e f g
    '0': 'abcdef', '1': 'bc', '2': 'abdeg', '3': 'abcdg', '4': 'bcfg', '5': 'acdfg',
    '6': 'acdefg', '7': 'abc', '8': 'abcdefg', '9': 'abcdfg', "'": '', ' ': ''
}


def date_stamp(img, text, color=(255, 150, 50)):
    """Orange LCD date stamp in the bottom-right corner, like cheap cameras."""
    layer = Image.new('RGB', img.size, (0, 0, 0))
    mask = Image.new('L', img.size, 0)
    dl = ImageDraw.Draw(layer)
    dm = ImageDraw.Draw(mask)
    s = 16  # digit height/2
    cw = 22
    x = W - 30 - len(text) * cw
    y = H - 60
    for ch in text:
        if ch == "'":
            dl.rectangle([x + 4, y, x + 7, y + 8], fill=color)
            dm.rectangle([x + 4, y, x + 7, y + 8], fill=255)
            x += 12
            continue
        segs = SEG.get(ch, '')
        coords = {
            'a': [x + 3, y, x + 15, y + 3], 'b': [x + 15, y + 2, x + 18, y + s], 'c': [x + 15, y + s + 2, x + 18, y + 2 * s],
            'd': [x + 3, y + 2 * s, x + 15, y + 2 * s + 3], 'e': [x, y + s + 2, x + 3, y + 2 * s], 'f': [x, y + 2, x + 3, y + s],
            'g': [x + 3, y + s, x + 15, y + s + 3]}
        for sg in segs:
            dl.rectangle(coords[sg], fill=color)
            dm.rectangle(coords[sg], fill=255)
        x += cw
    glow = mask.filter(ImageFilter.GaussianBlur(3))
    img.paste(layer, (0, 0), Image.eval(glow, lambda v: int(v * 0.6)))
    img.paste(layer, (0, 0), mask)


def degrade(img, blur=1.4, noise=14, vignette=0.45, warm=0.0, flash=None, stamp=None, quality=32, scan=False):
    img = img.filter(ImageFilter.GaussianBlur(blur))
    a = np.asarray(img).astype(np.float32)
    yy, xx = np.mgrid[0:H, 0:W]
    if flash:
        fx, fy, fr, fs = flash
        dist = np.sqrt((xx - fx) ** 2 + (yy - fy) ** 2) / fr
        a *= (fs * np.clip(1.25 - dist, 0.0, 1.25))[..., None] + 0.12
    cx, cy = W / 2, H / 2
    r = np.sqrt(((xx - cx) / cx) ** 2 + ((yy - cy) / cy) ** 2)
    a *= (1 - vignette * np.clip(r - 0.35, 0, 1) ** 1.6)[..., None]
    if warm:
        a[..., 0] *= 1 + warm
        a[..., 2] *= 1 - warm
    a += np.random.normal(0, noise, a.shape)
    a += np.random.normal(0, noise * 0.6, (H, W, 1))
    if scan:
        a[::2] *= 0.82
    img = Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))
    # soft "low megapixel" look
    img = img.resize((W // 2, H // 2), Image.BILINEAR).resize((W, H), Image.BILINEAR)
    if stamp:
        date_stamp(img, stamp)
    buf = io.BytesIO()
    img.save(buf, 'JPEG', quality=quality)
    buf.seek(0)
    return Image.open(buf).convert('RGB')


def save(img, name, quality=40):
    img.save(os.path.join(OUT, name), 'JPEG', quality=quality)
    print('  wrote', name)


# ---------------------------------------------------------------- scenes
def family_picnic():
    img, d = canvas()
    vgradient(img, (0, 0, W, 260), (70, 130, 220), (190, 220, 245))
    vgradient(img, (0, 240, W, H), (95, 160, 60), (45, 100, 30))
    d.ellipse([-120, 200, 260, 330], fill=(80, 140, 50))
    d.rectangle([70, 120, 92, 280], fill=(80, 55, 35))
    for (x, y, r) in [(80, 110, 80), (30, 140, 60), (130, 140, 60), (80, 60, 55)]:
        d.ellipse([x - r, y - r, x + r, y + r], fill=(40, 95, 35))
    pts = [(200, 340), (520, 340), (600, 450), (130, 450)]
    d.polygon(pts, fill=(205, 40, 45))
    for i in range(1, 8):
        t = i / 8
        d.line([(200 + 320 * t - 70 * t * 0, 340), (130 + 470 * t, 450)], fill=(240, 230, 230), width=5)
    for j in range(1, 4):
        y = 340 + j * 27
        d.line([(200 - 70 * j / 4, y), (520 + 80 * j / 4, y)], fill=(240, 230, 230), width=5)
    d.rectangle([450, 330, 520, 380], fill=(150, 100, 50))
    person(d, 300, 420, 190, (120, 150, 200), pants=(60, 60, 90), hair=(110, 70, 40), sitting=True)
    person(d, 400, 430, 150, (250, 210, 40), pants=(70, 110, 190), hair=(150, 100, 50))
    blob(img, (560, 50), 60, (255, 250, 220), blur=30, alpha=0.8)
    return degrade(img, blur=2.0, noise=12, warm=0.04, stamp="'01 6 17")


def birthday():
    img, d = canvas((45, 25, 18))
    vgradient(img, (0, 0, W, H), (60, 35, 25), (25, 15, 10))
    person(d, 320, 470, 260, (230, 110, 160), hair=(150, 100, 50))
    d.rectangle([0, 330, W, H], fill=(235, 230, 225))
    d.polygon([(300, 205), (345, 205), (322, 135)], fill=(80, 170, 240))
    d.ellipse([200, 330, 440, 380], fill=(250, 240, 245))
    d.rectangle([200, 300, 440, 355], fill=(250, 235, 240))
    d.ellipse([200, 280, 440, 325], fill=(250, 180, 200))
    for i in range(8):
        x = 225 + i * 27
        d.rectangle([x, 262, x + 5, 300], fill=(120, 200, 255) if i % 2 else (255, 230, 120))
        blob(img, (x + 2, 254), 9, (255, 200, 90), blur=6)
        blob(img, (x + 2, 254), 30, (255, 160, 60), blur=20, alpha=0.35)
    return degrade(img, blur=1.6, noise=16, flash=(320, 300, 420, 1.2), warm=0.08, stamp="'02 3 9")


def christmas():
    img, d = canvas((20, 15, 20))
    vgradient(img, (0, 0, W, H), (35, 25, 30), (15, 10, 12))
    d.rectangle([0, 390, W, H], fill=(70, 40, 30))
    for k, (w, y) in enumerate([(260, 380), (210, 300), (160, 230), (100, 160)]):
        d.polygon([(380 - w / 2, y), (380 + w / 2, y), (380, y - 120)], fill=(20, 70 + k * 6, 35))
    d.rectangle([370, 380, 392, 410], fill=(60, 35, 20))
    random.seed(3)
    for _ in range(45):
        x = random.randint(270, 490)
        y = random.randint(120, 375)
        c = random.choice([(255, 60, 60), (60, 200, 255), (255, 220, 80), (120, 255, 120), (255, 120, 220)])
        blob(img, (x, y), random.randint(5, 9), c, blur=5)
    for (x, w, c) in [(300, 70, (200, 40, 40)), (390, 60, (40, 120, 200)), (460, 80, (220, 190, 60))]:
        d.rectangle([x, 400, x + w, 450], fill=c)
        d.rectangle([x + w / 2 - 4, 400, x + w / 2 + 4, 450], fill=(240, 240, 240))
    person(d, 160, 440, 170, (200, 50, 60), pants=(40, 40, 70), hair=(150, 100, 50), sitting=True)
    return degrade(img, blur=1.8, noise=18, warm=0.06, stamp="'02 12 25")


def lake():
    img, d = canvas()
    vgradient(img, (0, 0, W, 230), (150, 175, 210), (245, 205, 160))
    vgradient(img, (0, 230, W, H), (200, 180, 160), (60, 80, 100))
    for x in range(0, W, 30):
        r = random.randint(40, 70)
        d.ellipse([x - r, 200 - r // 2, x + r, 240], fill=(40, 60, 45))
    d.rectangle([0, 228, W, 236], fill=(70, 85, 80))
    d.polygon([(120, H), (330, 330), (410, 330), (300, H)], fill=(110, 80, 55))
    for i in range(10):
        y = 335 + i * 15
        d.line([(330 - i * 21, y), (410 - i * 11, y)], fill=(70, 50, 35), width=2)
    person(d, 360, 335, 120, (60, 90, 60), pants=(50, 50, 60), hair=(60, 40, 25), sitting=True)
    d.line([(375, 270), (520, 170)], fill=(30, 30, 30), width=2)
    d.line([(520, 170), (540, 290)], fill=(200, 200, 200), width=1)
    blob(img, (320, 210), 260, (255, 240, 220), blur=120, alpha=0.18)
    return degrade(img, blur=1.5, noise=12, warm=0.05, stamp="'03 7 4")


def tower_photo():
    img, d = canvas()
    vgradient(img, (0, 0, W, 330), (70, 110, 190), (230, 190, 150))
    pts = [(0, H)] + [(x, 330 - 90 * math.exp(-((x - 420) / 200) ** 2)) for x in range(0, W + 1, 10)] + [(W, H)]
    d.polygon(pts, fill=(70, 110, 45))
    tower(d, 420, 245, 40)
    d.rectangle([450, 228, 500, 248], fill=(220, 210, 195))
    d.line([(420, 90), (250, 300)], fill=(220, 220, 220), width=1)
    d.line([(420, 90), (600, 300)], fill=(220, 220, 220), width=1)
    vgradient(img, (0, 400, W, H), (60, 95, 40), (35, 60, 25))
    return degrade(img, blur=1.1, noise=10, warm=0.08, stamp="'03 8 11")


def control_room():
    img, d = canvas((8, 10, 14))
    d.rectangle([0, 360, W, H], fill=(25, 25, 30))
    d.rectangle([0, 340, W, 365], fill=(45, 45, 52))
    random.seed(7)
    for row in range(3):
        for col in range(6):
            x = 40 + col * 95
            y = 60 + row * 85
            d.rectangle([x - 6, y - 6, x + 82, y + 66], fill=(30, 30, 34))
            kind = random.choice(['bars', 'blue', 'news', 'snow', 'dark'])
            if kind == 'bars':
                cols = [(192, 192, 192), (192, 192, 0), (0, 192, 192), (0, 192, 0), (192, 0, 192), (192, 0, 0), (0, 0, 192)]
                for i, c in enumerate(cols):
                    d.rectangle([x + i * 11, y, x + i * 11 + 11, y + 60], fill=c)
            elif kind == 'blue':
                d.rectangle([x, y, x + 76, y + 60], fill=(30, 60, 170))
            elif kind == 'news':
                d.rectangle([x, y, x + 76, y + 60], fill=(40, 60, 120))
                d.ellipse([x + 30, y + 15, x + 46, y + 33], fill=(200, 160, 130))
                d.rectangle([x + 24, y + 33, x + 52, y + 60], fill=(30, 30, 40))
            elif kind == 'snow':
                for _ in range(200):
                    px, py = x + random.randint(0, 75), y + random.randint(0, 59)
                    v = random.randint(60, 230)
                    d.point((px, py), fill=(v, v, v))
            else:
                d.rectangle([x, y, x + 76, y + 60], fill=(10, 12, 16))
    for i in range(60):
        x = 30 + (i % 30) * 19
        y = 380 + (i // 30) * 22
        blob(img, (x, y), 3, random.choice([(255, 60, 40), (60, 255, 90), (255, 200, 60)]), blur=2)
    return degrade(img, blur=1.4, noise=16, vignette=0.6, stamp="'03 8 30")


def staff(extra=False):
    img, d = canvas()
    vgradient(img, (0, 0, W, H), (30, 50, 110), (12, 20, 50))
    for i in range(6):
        d.rectangle([30 + i * 100, 30, 100 + i * 100, 300], fill=(40, 62, 125))
    d.ellipse([480, 50, 580, 150], outline=(230, 190, 60), width=8)
    d.text((512, 85), '12', fill=(255, 255, 255))
    if extra:
        tall_figure(d, 250, 520, 560, (6, 6, 8))
    people = [(110, (180, 40, 40)), (210, (40, 40, 50)), (310, (220, 220, 230)), (410, (60, 120, 70)), (510, (150, 110, 60))]
    for x, shirt in people:
        person(d, x, 470, 300, shirt, pants=(35, 35, 45), hair=random.choice([(60, 40, 25), (140, 100, 60), (30, 25, 20), (180, 170, 160)]))
    if extra:
        blob(img, (210, 165), 22, (120, 120, 130), blur=6, alpha=0.9)
    return degrade(img, blur=1.9, noise=14, flash=(320, 260, 520, 1.1), stamp="'03 9 5")


def moon_costume():
    img, d = canvas((50, 40, 35))
    vgradient(img, (0, 0, W, H), (80, 65, 50), (35, 28, 22))
    d.rectangle([0, 380, W, H], fill=(90, 70, 50))
    d.rectangle([60, 60, 200, 260], fill=(110, 95, 75))
    person(d, 330, 450, 270, (60, 60, 110), pants=(40, 40, 80), hair=(150, 100, 50))
    moon = Image.new('L', img.size, 0)
    dm = ImageDraw.Draw(moon)
    dm.ellipse([200, 140, 460, 400], fill=255)
    dm.ellipse([250, 110, 500, 370], fill=0)
    layer = Image.new('RGB', img.size, (250, 215, 70))
    img.paste(layer, (0, 0), moon)
    d = ImageDraw.Draw(img)
    for (x, y) in [(232, 230), (240, 300), (268, 352), (225, 270)]:
        blob(img, (x, y), 5, (255, 255, 200), blur=3)
    return degrade(img, blur=1.5, noise=15, flash=(330, 260, 420, 1.2), warm=0.05, stamp="'03 10 12")


def img_0047():
    img, d = canvas((0, 0, 0))
    vgradient(img, (0, 0, W, 300), (2, 3, 8), (10, 12, 18))
    random.seed(47)
    for _ in range(4000):
        x = random.randint(0, W - 1)
        y = random.randint(300, H - 1)
        g = 60 + (y - 300) * 0.9
        d.line([(x, y), (x + random.randint(-3, 3), y - random.randint(4, 14))], fill=(int(g * 0.7), int(g), int(g * 0.6)), width=1)
    tower(d, 470, 300, 60, red=(40, 18, 16), white=(30, 30, 34), lw=2, wbase=40)
    blob(img, (470, 12), 6, (255, 40, 20), blur=3)
    tall_figure(d, 330, 360, 250, (175, 172, 168))
    return degrade(img, blur=1.9, noise=24, flash=(320, 420, 330, 1.15), vignette=0.7, stamp="'03 10 14")


def dsc_0013():
    img, d = canvas((4, 5, 10))
    d.rectangle([0, 360, W, H], fill=(10, 11, 12))
    d.rectangle([170, 200, 500, 360], fill=(16, 17, 24))
    d.polygon([(150, 202), (335, 95), (520, 202)], fill=(12, 13, 18))
    d.rectangle([210, 240, 270, 295], fill=(20, 22, 30))
    d.rectangle([360, 240, 430, 300], fill=(240, 190, 100))
    blob(img, (395, 270), 70, (255, 200, 110), blur=30, alpha=0.4)
    d = ImageDraw.Draw(img)
    d.rectangle([392, 270, 415, 286], fill=(140, 170, 255))
    d.ellipse([370, 262, 386, 282], fill=(40, 28, 14))
    d.rectangle([364, 280, 392, 300], fill=(40, 28, 14))
    d.line([(395, 240), (395, 300)], fill=(50, 35, 15), width=3)
    d.line([(360, 270), (430, 270)], fill=(50, 35, 15), width=3)
    d.rectangle([450, 290, 482, 360], fill=(20, 20, 26))
    for i in range(14):
        r = random.randint(40, 80)
        x = random.randint(-40, 160)
        d.ellipse([x - r, 330 - r, x + r, 480], fill=(3, 5, 3))
    return degrade(img, blur=2.0, noise=22, vignette=0.7, stamp="'03 10 9")


def vhs_frame(kind):
    img, d = canvas((5, 8, 20))
    vgradient(img, (0, 0, W, H), (12, 16, 36), (2, 3, 10))
    if kind == 'blank':
        d.ellipse([200, 60, 440, 420], fill=(110, 110, 118))
    elif kind == 'dan':
        d.ellipse([200, 60, 440, 420], fill=(190, 150, 125))
        d.ellipse([255, 190, 300, 220], fill=(40, 30, 25))
        d.ellipse([340, 190, 385, 220], fill=(40, 30, 25))
        d.rectangle([300, 230, 340, 300], fill=(160, 120, 100))
        d.chord([270, 300, 370, 350], 0, 180, fill=(80, 40, 40))
        d.chord([190, 40, 450, 250], 180, 360, fill=(70, 50, 35))
    elif kind == 'you':
        vgradient(img, (0, 0, W, H), (2, 3, 8), (10, 20, 60))
        d.ellipse([220, 90, 420, 400], fill=(60, 90, 170))
        d.ellipse([265, 210, 300, 232], fill=(220, 235, 255))
        d.ellipse([340, 210, 375, 232], fill=(220, 235, 255))
        d.ellipse([276, 214, 292, 230], fill=(10, 10, 20))
        d.ellipse([351, 214, 367, 230], fill=(10, 10, 20))
        d.rectangle([150, 400, 490, H], fill=(20, 30, 70))
        blob(img, (320, 470), 160, (120, 170, 255), blur=50, alpha=0.5)
    img = img.filter(ImageFilter.GaussianBlur(6 if kind != 'you' else 4))
    d = ImageDraw.Draw(img)
    d.text((24, 22), 'PLAY >', fill=(255, 255, 255))
    d.text((W - 210, H - 36), 'SEP 22 2003  03:41:%02d AM' % {'blank': 7, 'dan': 8, 'you': 11}[kind], fill=(255, 255, 255))
    a = np.asarray(img).astype(np.float32)
    for y in range(0, H, 3):
        if random.random() < 0.05:
            a[y:y + 2] = np.roll(a[y:y + 2], random.randint(-20, 20), axis=1)
    img = Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))
    return degrade(img, blur=0.8, noise=26, vignette=0.5, scan=True, quality=24)


def school_play():
    img, d = canvas((10, 8, 20))
    vgradient(img, (0, 0, W, 300), (30, 25, 70), (15, 12, 40))
    for x in range(0, W, 40):
        d.rectangle([x, 0, x + 18, 300], fill=(25, 20, 60))
    d.rectangle([0, 280, W, 320], fill=(70, 50, 35))
    d.rectangle([80, 120, 130, 285], fill=(235, 235, 235))
    for i in range(4):
        d.rectangle([80, 140 + i * 40, 130, 158 + i * 40], fill=(200, 40, 40))
    d.polygon([(72, 120), (138, 120), (105, 85)], fill=(40, 40, 40))
    blob(img, (105, 105), 18, (255, 240, 170), blur=8)
    blob(img, (330, 200), 140, (255, 245, 210), blur=50, alpha=0.45)
    d = ImageDraw.Draw(img)
    person(d, 330, 290, 150, (60, 60, 110), pants=(40, 40, 80), hair=(150, 100, 50))
    moon = Image.new('L', img.size, 0)
    dm = ImageDraw.Draw(moon)
    dm.ellipse([255, 140, 405, 290], fill=255)
    dm.ellipse([285, 122, 430, 272], fill=0)
    img.paste(Image.new('RGB', img.size, (250, 215, 70)), (0, 0), moon)
    d = ImageDraw.Draw(img)
    random.seed(17)
    for row in range(3):
        for i in range(12):
            x = 20 + i * 54 + random.randint(-8, 8) + row * 15
            y = 360 + row * 38
            d.ellipse([x, y, x + 34, y + 40], fill=(8 + row * 3, 7, 10))
            if y + 32 < H:
                d.rectangle([x - 6, y + 32, x + 40, H], fill=(6 + row * 3, 5, 8))
    d.rectangle([560, 230, 620, 360], fill=(18, 16, 24))
    blob(img, (590, 222), 10, (60, 255, 120), blur=4)
    ghost = Image.new('RGB', img.size, (0, 0, 0))
    gd = ImageDraw.Draw(ghost)
    person(gd, 535, 370, 170, (90, 100, 110), pants=(60, 60, 70), skin=(150, 140, 130), hair=(80, 70, 60))
    img = Image.blend(img, Image.composite(ghost, img, Image.eval(ghost.convert('L'), lambda v: 255 if v > 0 else 0)), 0.45)
    return degrade(img, blur=1.8, noise=18, vignette=0.6, warm=0.06, stamp="'03 10 17")


def icon():
    size = 256
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.rounded_rectangle([8, 8, 248, 248], radius=48, fill=(14, 22, 52, 255))
    d.rounded_rectangle([8, 8, 248, 248], radius=48, outline=(60, 90, 180, 255), width=6)
    for i, (dx, dy) in enumerate([(0, -70), (-60, -45), (60, -45), (-85, 5), (85, 5)]):
        d.line([(128 + dx * 0.75, 150 + dy * 0.75), (128 + dx, 150 + dy)], fill=(255, 176, 0, 255), width=10)
    d.pieslice([58, 80, 198, 220], 180, 360, fill=(255, 190, 30, 255))
    d.rectangle([30, 150, 226, 162], fill=(40, 120, 240, 255))
    d.rectangle([60, 180, 196, 190], fill=(70, 160, 255, 255))
    d.rectangle([90, 204, 166, 212], fill=(130, 200, 255, 255))
    d.ellipse([196, 36, 222, 62], fill=(255, 40, 20, 255))
    img.save(os.path.join(ROOT, 'build', 'icon.png'))
    print('  wrote build/icon.png')


def main():
    os.makedirs(OUT, exist_ok=True)
    os.makedirs(os.path.join(ROOT, 'build'), exist_ok=True)
    random.seed(1987)
    np.random.seed(1987)
    save(family_picnic(), 'family_picnic_2001.jpg')
    save(birthday(), 'lily_birthday_8.jpg')
    save(christmas(), 'christmas_2002.jpg')
    save(lake(), 'lake_fishing.jpg')
    save(tower_photo(), 'pell_hill_tower.jpg')
    save(control_room(), 'station_control_room.jpg')
    random.seed(5)
    save(staff(False), 'ch12_staff_2003.jpg')
    random.seed(5)
    save(staff(True), 'ch12_staff_2003_b.jpg')
    save(moon_costume(), 'lily_moon_costume.jpg')
    save(img_0047(), 'IMG_0047.jpg')
    save(dsc_0013(), 'DSC_0013.jpg')
    save(vhs_frame('blank'), 'frame_0233.jpg', 30)
    save(vhs_frame('dan'), 'frame_0234.jpg', 30)
    save(vhs_frame('you'), 'frame_0237.jpg', 30)
    save(school_play(), 'school_play_2003.jpg')
    icon()


if __name__ == '__main__':
    main()
