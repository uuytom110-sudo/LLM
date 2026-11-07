#!/usr/bin/env python3
"""把站点打包成一个独立的 HTML 文件（离线可用，双击即可打开）。

用法：
  python3 scripts/build_single.py                 # 输出 dist/gewu-offline.html（完整 HTML）
  python3 scripts/build_single.py --fragment OUT  # 输出不带 <html>/<head>/<body> 外壳的片段
"""
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def build(fragment: bool = False) -> str:
    html = (ROOT / 'index.html').read_text(encoding='utf-8')
    css = (ROOT / 'css/style.css').read_text(encoding='utf-8')
    html = html.replace('<link rel="stylesheet" href="css/style.css">', '<style>\n' + css + '\n</style>')

    def inline_scripts(m):
        out = []
        for src in re.findall(r'<script src="([^"]+)"></script>', m.group(0)):
            js = (ROOT / src).read_text(encoding='utf-8').replace('</script', '<\\/script')
            out.append('<script>\n' + js + '\n</script>')
        return '\n'.join(out)

    html = re.sub(r'<!--SCRIPTS-->.*?<!--/SCRIPTS-->', inline_scripts, html, flags=re.S)

    if fragment:
        head = re.search(r'<head>(.*?)</head>', html, re.S).group(1)
        body = re.search(r'<body>(.*?)</body>', html, re.S).group(1)
        head = re.sub(r'<meta (charset|name="viewport")[^>]*>\n?', '', head)
        title = re.search(r'<title>.*?</title>', head).group(0)
        head = head.replace(title + '\n', '')
        html = title + '\n<meta name="claude:viewport-fit-sides" content="cover">\n' + head + body
    return html


if __name__ == '__main__':
    if len(sys.argv) >= 3 and sys.argv[1] == '--fragment':
        out = Path(sys.argv[2])
        text = build(fragment=True)
    else:
        out = ROOT / 'dist' / 'gewu-offline.html'
        text = build()
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(text, encoding='utf-8')
    print(f'wrote {out} ({len(text.encode("utf-8")) // 1024} KB)')
