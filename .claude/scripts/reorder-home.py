cm = '  <section class="contact" id="contact">'
gm = '  <section class="section gallery-section" id="gallery">'
fm = '  <!-- ===== FOOTER ===== -->'
s = open('index.html', encoding='utf-8').read()
ci, gi, fi = s.index(cm), s.index(gm), s.index(fm)
assert ci < gi < fi, "unexpected order"
contact_block = s[ci:gi]
gallery_block = s[gi:fi]
new = s[:ci] + gallery_block + contact_block + s[fi:]
assert len(new) == len(s)
open('index.html', 'w', encoding='utf-8').write(new)
ng, nc = new.index(gm), new.index(cm)
print("reordered OK; gallery_before_contact =", ng < nc)
