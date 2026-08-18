# ═══════════════════════════════════════════════════════════
#  Orange Business — Network Knowledge Base
#  Search-index builder  ·  regenerates search-index.json
#  ───────────────────────────────────────────────────────────
#  Run this after editing page content or glossary terms:
#      powershell -ExecutionPolicy Bypass -File build-search-index.ps1
#  It scans every *.html in this folder (full text, minus nav/footer)
#  plus every glossary term, and writes search-index.json, which
#  search.js fetches to power the site-wide search.
# ═══════════════════════════════════════════════════════════
$dir = $PSScriptRoot
if (-not $dir) { $dir = (Get-Location).Path }

function Clean-Text([string]$s) {
  $s = $s -replace '&amp;','&' -replace '&lt;','<' -replace '&gt;','>' -replace '&nbsp;',' '
  $s = $s -replace '&#39;',"'" -replace '&quot;','"' -replace '&mdash;','--' -replace '&ndash;','-'
  $s = $s -replace '&rsquo;',"'" -replace '&lsquo;',"'" -replace '&hellip;','...'
  $s = ($s -replace '\s+',' ').Trim()
  return $s
}

$entries = New-Object System.Collections.ArrayList
$files = Get-ChildItem -Path (Join-Path $dir '*.html')

foreach ($f in $files) {
  $raw = Get-Content -LiteralPath $f.FullName -Raw -Encoding UTF8

  $title = ''
  if ($raw -match '(?is)<title>(.*?)</title>') { $title = (Clean-Text $matches[1]) }
  $title = ($title -replace '\s*[—|].*$','').Trim()
  if (-not $title) { $title = $f.BaseName }

  $headings = New-Object System.Collections.ArrayList
  foreach ($m in [regex]::Matches($raw, '(?is)<h[1-4][^>]*>(.*?)</h[1-4]>')) {
    $h = Clean-Text ($m.Groups[1].Value -replace '(?s)<[^>]+>','')
    if ($h -and $h.Length -lt 90) { [void]$headings.Add($h) }
  }

  $body = $raw
  $body = [regex]::Replace($body, '(?is)<nav\b.*?</nav>', ' ')
  $body = [regex]::Replace($body, '(?is)<footer\b.*?</footer>', ' ')
  $body = [regex]::Replace($body, '(?is)<div class="breadcrumb".*?</div>', ' ')
  $body = [regex]::Replace($body, '(?is)<script.*?</script>', ' ')
  $body = [regex]::Replace($body, '(?is)<style.*?</style>', ' ')
  $body = [regex]::Replace($body, '(?is)<[^>]+>', ' ')
  $body = Clean-Text $body
  if ($body.Length -gt 12000) { $body = $body.Substring(0,12000) }

  $name = $f.Name
  $cat = 'Page'
  if     ($name -match '^index\.html$') { $cat = 'Home' }
  elseif ($name -match '^(lan-wan-basics|ip-routing|switching|wireless|firewalls|zscaler)\.html$') { $cat = 'Networking' }
  elseif ($name -match '^(cisco|paloalto|fortinet|devices)\.html$') { $cat = 'Vendors' }
  elseif ($name -match '^(lan-process|process-ap|process-wlc-switch|wan-process)\.html$') { $cat = 'Process' }
  elseif ($name -match '^(glossary|option43)\.html$') { $cat = 'Reference' }
  elseif ($name -match '^(karim-elzarka|mona-tantawy|peter-sabet|maryam-etry)\.html$') { $cat = 'Team' }
  elseif ($name -match '-squad\.html$') { $cat = 'Squads' }

  [void]$entries.Add([pscustomobject]@{ t=$title; u=$name; c=$cat; h=$headings.ToArray(); x=$body })
}

# Glossary terms as first-class entries (direct answers)
$glossPath = Join-Path $dir 'glossary.html'
if (Test-Path -LiteralPath $glossPath) {
  $gloss = Get-Content -LiteralPath $glossPath -Raw -Encoding UTF8
  foreach ($m in [regex]::Matches($gloss, '(?is)<div class="glossary-term">(.*?)</div>\s*<div class="glossary-def">(.*?)</div>')) {
    $term = Clean-Text ($m.Groups[1].Value -replace '(?s)<[^>]+>','')
    $def  = Clean-Text ($m.Groups[2].Value -replace '(?s)<[^>]+>','')
    if ($term) { [void]$entries.Add([pscustomobject]@{ t=$term; u='glossary.html'; c='Glossary'; h=@(); x=$def }) }
  }
}

$json = $entries | ConvertTo-Json -Depth 6 -Compress
[System.IO.File]::WriteAllText((Join-Path $dir 'search-index.json'), $json, (New-Object System.Text.UTF8Encoding($false)))
Write-Output ("search-index.json rebuilt - {0} entries." -f $entries.Count)
