#!/usr/bin/env python3
from pathlib import Path
import subprocess
p=Path('index.html')
s=p.read_text()
assert subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip()=='ccffaf04883ed3ab6c49eea3e508466c056ee070'
start=s.index('<style id="earthline-m136-regional-layout-only">')
end=s.index('</style>',start)+len('</style>')
block=s[start:end]
original="""   left:50%!important;top:78px!important;
   width:min(350px,calc(100vw - 24px))!important;
   max-width:calc(100vw - 24px)!important;"""
replacement="""   left:calc((100vw + var(--el-rail-16188,54px))/2)!important;top:78px!important;
   width:min(350px,calc(100vw - var(--el-rail-16188,54px) - 20px))!important;
   max-width:calc(100vw - var(--el-rail-16188,54px) - 20px)!important;"""
assert block.count(original)==1
block=block.replace(original,replacement)
out=s[:start]+block+s[end:]
assert out[:start]==s[:start] and out[start+len(block):]==s[end:]
p.write_text(out)
print('M136_PHONE_ONLY_CHANGED',len(replacement)-len(original),'bytes')
