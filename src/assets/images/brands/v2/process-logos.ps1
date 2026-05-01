# =============================================================================
# Logo background remover v2
# =============================================================================
# Reads every image in v2/row1/ and v2/row2/, strips the background to
# transparent, forces all remaining pixels to PURE BLACK at full alpha
# (only edge pixels near the bg-tolerance get smooth alpha for anti-
# aliasing), then AUTO-CROPS the transparent margins so each logo glyph
# fills its bounding box. Outputs to v2-clean/row1/ and v2-clean/row2/.
#
# Improvements vs v1:
#   • Old "alpha = 255 - luminance" made mid-grey source pixels render
#     as semi-transparent → logos looked grey instead of black.
#     New: pixels meaningfully different from bg get FULL 255 alpha;
#     only pixels in a narrow falloff band right at the bg threshold
#     get smooth alpha for clean anti-aliased edges.
#   • Auto-crop using alpha-channel bounding box: scan all rows + cols
#     for any pixel with alpha > 8, take min/max XY, crop with a small
#     padding. This kills the empty padding that was making some logos
#     look tiny inside the 180×80 marquee cell.
# =============================================================================

Add-Type -AssemblyName System.Drawing

$ErrorActionPreference = 'Stop'

$root      = 'C:\Brotherockers\src\assets\images\brands\v2'
$cleanRoot = 'C:\Brotherockers\src\assets\images\brands\v2-clean'
$tolerance = 55   # RGB distance threshold for "matches bg" -> transparent
$falloff   = 30   # extra distance for smooth alpha ramp at edges
$cropPad   = 4    # transparent pixels of breathing room around the trimmed glyph

New-Item -ItemType Directory -Force -Path "$cleanRoot\row1","$cleanRoot\row2" | Out-Null

function Process-Logo {
    param(
        [string]$srcPath,
        [string]$dstPath
    )

    $img = [System.Drawing.Image]::FromFile($srcPath)
    $w = $img.Width
    $h = $img.Height

    $bmp = New-Object System.Drawing.Bitmap $w, $h, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g   = [System.Drawing.Graphics]::FromImage($bmp)
    $g.DrawImage($img, 0, 0, $w, $h)
    $g.Dispose()
    $img.Dispose()

    $rect   = New-Object System.Drawing.Rectangle 0, 0, $w, $h
    $data   = $bmp.LockBits($rect,
                [System.Drawing.Imaging.ImageLockMode]::ReadWrite,
                [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $stride = $data.Stride
    $bytes  = New-Object byte[] ($stride * $h)
    [System.Runtime.InteropServices.Marshal]::Copy($data.Scan0, $bytes, 0, $bytes.Length)

    # ── Sample 4 corners (5×5 patch each) ──
    $samples = @(
        @{cx=2;        cy=2},
        @{cx=$w-3;     cy=2},
        @{cx=2;        cy=$h-3},
        @{cx=$w-3;     cy=$h-3}
    )
    $rSum = 0; $gSum = 0; $bSum = 0; $count = 0
    foreach ($s in $samples) {
        for ($dy = -2; $dy -le 2; $dy++) {
            for ($dx = -2; $dx -le 2; $dx++) {
                $px = $s.cx + $dx; $py = $s.cy + $dy
                if ($px -lt 0 -or $px -ge $w -or $py -lt 0 -or $py -ge $h) { continue }
                $i = $py * $stride + $px * 4
                $bSum += $bytes[$i]
                $gSum += $bytes[$i + 1]
                $rSum += $bytes[$i + 2]
                $count++
            }
        }
    }
    $bgR = $rSum / $count
    $bgG = $gSum / $count
    $bgB = $bSum / $count
    $bgLum = 0.299 * $bgR + 0.587 * $bgG + 0.114 * $bgB
    $isDark = $bgLum -lt 128

    if ($isDark) {
        $bgR = 255 - $bgR
        $bgG = 255 - $bgG
        $bgB = 255 - $bgB
    }

    # ── Process every pixel ──
    $tolSq      = $tolerance * $tolerance
    $rampMaxSq  = ($tolerance + $falloff) * ($tolerance + $falloff)
    $rampSpan   = [double]($rampMaxSq - $tolSq)

    for ($i = 0; $i -lt $bytes.Length; $i += 4) {
        $b = [int]$bytes[$i]
        $g = [int]$bytes[$i + 1]
        $r = [int]$bytes[$i + 2]

        if ($isDark) {
            $r = 255 - $r
            $g = 255 - $g
            $b = 255 - $b
        }

        $dR = $r - $bgR
        $dG = $g - $bgG
        $dB = $b - $bgB
        $distSq = $dR*$dR + $dG*$dG + $dB*$dB

        $bytes[$i]     = 0
        $bytes[$i + 1] = 0
        $bytes[$i + 2] = 0
        if ($distSq -lt $tolSq) {
            # Background pixel — transparent.
            $bytes[$i + 3] = 0
        } elseif ($distSq -lt $rampMaxSq) {
            # Edge pixel — smooth alpha ramp from 0 (at tolerance) to 255
            # (at tolerance+falloff). Keeps anti-aliased glyph edges
            # without a hard staircase outline.
            $t = ($distSq - $tolSq) / $rampSpan
            $alpha = [int]($t * 255)
            if ($alpha -gt 255) { $alpha = 255 }
            if ($alpha -lt 0)   { $alpha = 0 }
            $bytes[$i + 3] = $alpha
        } else {
            # Logo body — fully opaque black.
            $bytes[$i + 3] = 255
        }
    }

    # Write processed pixels back into the bitmap.
    [System.Runtime.InteropServices.Marshal]::Copy($bytes, 0, $data.Scan0, $bytes.Length)
    $bmp.UnlockBits($data)

    # ── Find bounding box of non-transparent pixels ──
    $minX = $w; $maxX = -1; $minY = $h; $maxY = -1
    for ($y = 0; $y -lt $h; $y++) {
        for ($x = 0; $x -lt $w; $x++) {
            $idx = $y * $stride + $x * 4
            if ($bytes[$idx + 3] -gt 8) {
                if ($x -lt $minX) { $minX = $x }
                if ($x -gt $maxX) { $maxX = $x }
                if ($y -lt $minY) { $minY = $y }
                if ($y -gt $maxY) { $maxY = $y }
            }
        }
    }

    if ($maxX -lt 0) {
        # Edge case: image processed to fully transparent. Just save as-is.
        $bmp.Save($dstPath, [System.Drawing.Imaging.ImageFormat]::Png)
        $bmp.Dispose()
        return
    }

    $minX = [Math]::Max(0, $minX - $cropPad)
    $minY = [Math]::Max(0, $minY - $cropPad)
    $maxX = [Math]::Min($w - 1, $maxX + $cropPad)
    $maxY = [Math]::Min($h - 1, $maxY + $cropPad)
    $cropW = $maxX - $minX + 1
    $cropH = $maxY - $minY + 1

    # Build cropped output bitmap.
    $cropped = New-Object System.Drawing.Bitmap $cropW, $cropH, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $cg      = [System.Drawing.Graphics]::FromImage($cropped)
    $srcRect = New-Object System.Drawing.Rectangle $minX, $minY, $cropW, $cropH
    $dstRect = New-Object System.Drawing.Rectangle 0, 0, $cropW, $cropH
    $cg.DrawImage($bmp, $dstRect, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)
    $cg.Dispose()
    $cropped.Save($dstPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $cropped.Dispose()
    $bmp.Dispose()
}

# ── Iterate both rows ──
$processed = 0
$failed    = @()
foreach ($rowName in @('row1', 'row2')) {
    $srcDir = Join-Path $root      $rowName
    $dstDir = Join-Path $cleanRoot $rowName
    Get-ChildItem $srcDir -File | Where-Object { $_.Name -ne '.DS_Store' } | ForEach-Object {
        $dstName = [System.IO.Path]::GetFileNameWithoutExtension($_.Name) + '.png'
        $dstPath = Join-Path $dstDir $dstName
        try {
            Process-Logo -srcPath $_.FullName -dstPath $dstPath
            $processed++
        } catch {
            $failed += "$($_.Name): $($_.Exception.Message)"
        }
    }
}

Write-Host "Processed: $processed"
if ($failed.Count -gt 0) {
    Write-Host "Failed: $($failed.Count)"
    $failed | ForEach-Object { Write-Host "  - $_" }
}
