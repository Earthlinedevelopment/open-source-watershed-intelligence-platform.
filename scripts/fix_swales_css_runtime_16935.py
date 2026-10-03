from pathlib import Path
import ast
src=Path('scripts/two_task_report_swales_16934.py').read_text(errors='ignore')
tree=ast.parse(src)
css=None
for node in tree.body:
    if isinstance(node,ast.Assign) and any(isinstance(t,ast.Name) and t.id=='css' for t in node.targets):
        css=ast.literal_eval(node.value);break
if not css: raise SystemExit('css payload not found')
p=Path('index.html');s=p.read_text(errors='ignore')
old="src=src.replace('</head>','<style id=\"earthline-swales-layout-16934\">'+css+'</style></head>');"
if old not in s: raise SystemExit('broken css owner not found')
safe=css.replace('\\','\\\\').replace("'","\\'")
new="src=src.replace('</head>','<style id=\"earthline-swales-layout-16934\">"+safe+"</style></head>');"
s=s.replace(old,new,1)
p.write_text(s)
