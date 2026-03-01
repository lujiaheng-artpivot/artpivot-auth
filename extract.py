#!/usr/bin/env python3
import re
with open('/Users/lujiaheng/Downloads/nixes-studio_cinematic_4.html','r') as f:
    html=f.read()
styles=re.findall(r'<style[^>]*>(.*?)</style>',html,re.DOTALL)
css='\n'.join(styles)
body=re.search(r'<body[^>]*>(.*?)</body>',html,re.DOTALL)
bhtml=body.group(1) if body else ''
scripts=re.findall(r'<script(?!\s+src)[^>]*>(.*?)</script>',html,re.DOTALL)
js='\n'.join(scripts)
ext=re.findall(r'<script\s+src="([^"]+)"',html)
with open('/Users/lujiaheng/artpivot-auth/src/app/original.css','w') as f:
    f.write(css)
with open('/Users/lujiaheng/artpivot-auth/src/app/body.html','w') as f:
    f.write(bhtml)
with open('/Users/lujiaheng/artpivot-auth/src/app/original.js','w') as f:
    f.write(js)
print('CSS:',len(css))
print('Body:',len(bhtml))
print('JS:',len(js))
print('Ext:',ext)
