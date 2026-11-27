"""Bump the ?v= cache-buster on every script tag: python tools/bump.py"""
import re, os
p = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'index.html')
s = open(p, encoding='utf-8').read()
n = int(re.search(r'\?v=(\d+)', s).group(1)) + 1
open(p, 'w', encoding='utf-8').write(re.sub(r'\?v=\d+', '?v=%d' % n, s)); print('v', n)
