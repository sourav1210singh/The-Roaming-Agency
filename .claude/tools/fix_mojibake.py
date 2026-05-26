# -*- coding: utf-8 -*-
"""
Run-based sloppy-cp1252 -> UTF-8 mojibake reversal.
Only fixes non-ASCII runs that cleanly reverse to valid UTF-8;
leaves already-correct standalone accented chars / real emoji intact.
"""
import re, sys, os

# Sloppy Windows-1252: like cp1252 but the 5 "undefined" bytes
# (0x81,0x8D,0x8F,0x90,0x9D) map to their C1 control code points,
# so a UTF-8 sequence mis-decoded through it round-trips.
import codecs

CP1252_DEC = {}
for b in range(256):
    try:
        ch = bytes([b]).decode('cp1252')
    except UnicodeDecodeError:
        ch = chr(b)  # sloppy: undefined -> same code point
    CP1252_DEC[b] = ch
# reverse map: unicode char -> originating byte
SLOPPY_ENC = {}
for b, ch in CP1252_DEC.items():
    SLOPPY_ENC.setdefault(ch, b)
for b in (0x81, 0x8D, 0x8F, 0x90, 0x9D):
    SLOPPY_ENC[chr(b)] = b

NONASCII_RUN = re.compile(r'[^\x00-\x7f]+')

def reverse_run(run):
    """Return fixed string if the run is mojibake, else None."""
    try:
        raw = bytes(SLOPPY_ENC[c] for c in run)
    except KeyError:
        return None  # contains a char not produced by cp1252 mis-decode -> already correct (real emoji/accent)
    try:
        fixed = raw.decode('utf-8')
    except UnicodeDecodeError:
        return None  # not a clean UTF-8 byte stream -> leave alone
    if fixed == run:
        return None
    if '�' in fixed:
        return None
    return fixed

def fix_text(s):
    changes = {}
    def repl(m):
        run = m.group(0)
        fixed = reverse_run(run)
        if fixed is None:
            return run
        changes[run] = fixed
        return fixed
    out = NONASCII_RUN.sub(repl, s)
    return out, changes

def main():
    apply = '--apply' in sys.argv
    files = [a for a in sys.argv[1:] if not a.startswith('--')]
    grand = {}
    rep = open('.claude/tools/mojibake_report.txt', 'w', encoding='utf-8')
    def log(*a):
        print(*a, file=rep)
    for path in files:
        with open(path, 'rb') as f:
            raw = f.read()
        had_bom = raw.startswith(codecs.BOM_UTF8)
        if had_bom:
            raw = raw[len(codecs.BOM_UTF8):]
        s = raw.decode('utf-8')
        out, changes = fix_text(s)
        name = os.path.basename(path)
        n = sum(s.count(k) for k in changes)
        print(f"\n=== {name} ===  bom={had_bom}  runs_fixed={len(changes)}  total_occurrences~={n}")
        for k in sorted(changes):
            disp_k = k if len(k) <= 12 else k[:12] + '...'
            log(f"   {disp_k!r}  ->  {changes[k]!r}")
            grand[k] = changes[k]
        if apply:
            with open(path, 'wb') as f:
                f.write(out.encode('utf-8'))  # UTF-8, NO BOM
            # verify no mojibake markers remain
            leftover = re.findall(r'[ÃÂâðÅÄÊÎÔ][\x80-\xBF\x80-\xFF]', out)
            log(f"   WROTE (utf-8 no bom). leftover-suspect={len(leftover)}")
    print(f"\n--- distinct mappings across all files: {len(grand)} ---")
    for k in sorted(grand):
        log(f"   {k!r} -> {grand[k]!r}")
    rep.close()

if __name__ == '__main__':
    main()

rep_close=None
