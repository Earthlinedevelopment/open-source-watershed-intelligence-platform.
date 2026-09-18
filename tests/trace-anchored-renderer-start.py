from pathlib import Path
text=Path('index.html').read_text(encoding='utf-8')
anchor="const gradeCounts={A:0,B:0,C:0},gradeLabels=[];"
a=text.find(anchor)
print("ANCHOR",a)
lo=max(0,a-50000); block=text[lo:a+12000]
for term in ["function render","lastData","scheduled","function points","const points","function project","const project","activeTier16168","getBoundingClientRect","clientWidth","clientHeight"]:
    positions=[]
    start=0
    while True:
        i=block.find(term,start)
        if i<0: break
        positions.append(lo+i); start=i+len(term)
    print(term,positions[-12:])
start=max(0,block.rfind("function render",0,block.find(anchor) if anchor in block else len(block)))
print("===== ACTUAL RENDERER START WINDOW =====")
print(block[max(0,start-12000):])
