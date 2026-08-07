#!/usr/bin/env python3
"""원작 PDF(960x540 벡터 슬라이드)에서 도형 좌표를 뽑아 src/data/maps.js 를 생성한다.

사용법:
    python3 tools/extract_maps.py <Dodgegame.pdf> [출력경로]

각 페이지의 채워진 벡터 드로잉을 원(circle) / 폴리곤(poly) 으로 분류한다.
베지어 곡선('c')만으로 이루어지고 가로세로 비가 1에 가까우면 원으로,
그 외에는 직선 경로의 꼭짓점을 딴 폴리곤으로 본다.
"""
import json
import sys

import pymupdf

W, H = 960, 540
# 추출 대상 페이지 (1-indexed) → 맵 ID
PAGES = {
    4: "maze1",
    5: "maze2",
    6: "maze3",
    8: "eyefield",
    18: "corridor",
    19: "laser",
    20: "icechase",
    21: "brokenworld",
}
# 배경으로 깔린 흰 전체 사각형은 버린다
MIN_AREA = 40


def rgb(c):
    if c is None:
        return None
    return "#%02x%02x%02x" % tuple(max(0, min(255, round(v * 255))) for v in c)


def is_background(shape, page_rect):
    r = shape["rect"]
    return r.width > page_rect.width * 0.95 and r.height > page_rect.height * 0.95


def points_of(items):
    """드로잉 아이템에서 꼭짓점 목록을 뽑는다 (곡선은 끝점만)."""
    pts = []

    def push(p):
        p = (round(p.x, 1), round(p.y, 1))
        if not pts or pts[-1] != p:
            pts.append(p)

    for it in items:
        kind = it[0]
        if kind == "l":
            push(it[1])
            push(it[2])
        elif kind == "c":
            push(it[1])
            push(it[4])
        elif kind == "re":
            r = it[1]
            for p in (r.tl, r.tr, r.br, r.bl):
                push(p)
        elif kind == "qu":
            for p in it[1]:
                push(p)
    if len(pts) > 1 and pts[0] == pts[-1]:
        pts.pop()
    return pts


def classify(shape):
    r = shape["rect"]
    kinds = {it[0] for it in shape["items"]}
    fill = rgb(shape.get("fill")) or rgb(shape.get("color")) or "#000000"
    # 화면 밖으로 크게 벗어난 도형도 원작 그대로 유지 (SVG가 클리핑)
    if kinds <= {"c"} and r.height > 0:
        ratio = r.width / r.height
        if 0.75 < ratio < 1.33:
            return {
                "t": "circle",
                "cx": round(r.x0 + r.width / 2, 1),
                "cy": round(r.y0 + r.height / 2, 1),
                "r": round((r.width + r.height) / 4, 1),
                "fill": fill,
            }
        return {
            "t": "ellipse",
            "cx": round(r.x0 + r.width / 2, 1),
            "cy": round(r.y0 + r.height / 2, 1),
            "rx": round(r.width / 2, 1),
            "ry": round(r.height / 2, 1),
            "fill": fill,
        }
    pts = points_of(shape["items"])
    if len(pts) < 3:
        return None
    return {"t": "poly", "pts": pts, "fill": fill}


def extract(pdf_path):
    doc = pymupdf.open(pdf_path)
    out = {}
    for pno, name in PAGES.items():
        page = doc[pno - 1]
        shapes = []
        for d in page.get_drawings():
            if d["type"] not in ("f", "fs"):
                continue
            if is_background(d, page.rect):
                continue
            r = d["rect"]
            if r.width * r.height < MIN_AREA:
                continue
            s = classify(d)
            if s:
                shapes.append(s)
        out[name] = {"page": pno, "shapes": shapes}
    return out


def to_js(data):
    lines = [
        "// 자동 생성 파일 — tools/extract_maps.py 가 원작 PDF에서 추출함. 직접 수정하지 말 것.",
        "// 좌표계: 960x540 (원작 슬라이드 크기)",
        "",
        "export const STAGE_W = 960;",
        "export const STAGE_H = 540;",
        "",
    ]
    for name, v in data.items():
        lines.append(f"// PDF p{v['page']} — 도형 {len(v['shapes'])}개")
        lines.append(f"export const {name.upper()} = {json.dumps(v['shapes'], ensure_ascii=False)};")
        lines.append("")
    lines.append("export const MAZES = [MAZE1, MAZE2, MAZE3];")
    lines.append("")
    return "\n".join(lines)


if __name__ == "__main__":
    src = sys.argv[1]
    dst = sys.argv[2] if len(sys.argv) > 2 else "src/data/maps.js"
    data = extract(src)
    with open(dst, "w", encoding="utf-8") as f:
        f.write(to_js(data))
    for name, v in data.items():
        print(f"{name}: {len(v['shapes'])} shapes")
    print("wrote", dst)
