from pathlib import Path
text=Path('index.html').read_text(encoding='utf-8')
i=text.find("const productsStarted16198=performance.now();")
print("AT",i)
print(text[max(0,i-2500):min(len(text),i+26000)])
