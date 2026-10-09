# =====================================================================
#  DPM Knowledge Base - search index + page metadata builder
# ---------------------------------------------------------------------
#  Regenerates two files that the site reads at runtime:
#
#    search-index.json  Full text of every *.html page (minus nav,
#                       footer, scripts and styles) plus every glossary
#                       term - both the terms written in glossary.html
#                       and the live terms people add from the site
#                       (glossary.json). search.js fetches this file to
#                       power the site-wide Ctrl-K search.
#
#    page-meta.json     Title and last-updated date of every page:
#                       {"generated":"YYYY-MM-DD","pages":{"raci.html":
#                        {"title":"RACI Matrix","updated":"YYYY-MM-DD"}}}
#                       "updated" = date of the last git commit that
#                       touched the file; today if the file has
#                       uncommitted changes or is untracked; the file's
#                       modified time if git is not available.
#
#  404.html is deliberately left out of both files.
#
#  How to run it (from anywhere):
#    Windows:  powershell -ExecutionPolicy Bypass -File build-search-index.ps1
#    Any OS:   pwsh -NoProfile -File build-search-index.ps1
#  GitHub Actions (.github/workflows/rebuild-search-index.yml) also runs
#  it on every push to main and commits the result, so running it by
#  hand is only needed to preview search locally.
#
#  Rules for anyone editing this file:
#    * Keep it PURE ASCII. Windows PowerShell 5.1 reads a BOM-less
#      script as ANSI, so a single em-dash or box-drawing character can
#      break parsing. When you need a non-ASCII character (even inside
#      a regex), build it with [char]0xXXXX, as the patterns below do.
#    * It must run on Windows PowerShell 5.1 AND PowerShell 7 (CI runs
#      pwsh on Linux): no ?: ternary, no ?? operator, no && / || chains,
#      no ConvertFrom-Json -AsHashtable.
#    * JSON is written by the small writer below (not ConvertTo-Json,
#      which escapes differently in 5.1 and 7) as UTF-8 without BOM, and
#      pages are sorted ordinally, so local runs and CI runs produce
#      byte-identical files and the commits do not churn.
# =====================================================================
$dir = $PSScriptRoot
if (-not $dir) { $dir = (Get-Location).Path }

$inv       = [System.Globalization.CultureInfo]::InvariantCulture
$today     = (Get-Date).ToString('yyyy-MM-dd', $inv)
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
$excluded  = @('404.html')   # never indexed, never listed in page-meta.json

# Non-ASCII characters are built with [char] so this file stays ASCII.
#   Title suffix: "RACI Matrix <em-dash> DPM Knowledge Base" -> "RACI Matrix"
#   (also " | ...", " -- ..." and " <en-dash> ..." suffixes)
$script:TitleSuffixPattern = '\s*(?:' + [char]0x2014 + '|\||\s--\s|\s' + [char]0x2013 + '\s).*$'
#   Characters JSON must escape: C0 controls, plus U+2028 / U+2029 for safety
$script:JsonCtrlPattern = '[\x00-\x1F' + [char]0x2028 + [char]0x2029 + ']'

# ---------------------------------------------------------------------
#  Text helpers
# ---------------------------------------------------------------------
# Decodes numeric character references such as &#8594; or &#x2192;
$script:EntityEval = [System.Text.RegularExpressions.MatchEvaluator]{
  param($m)
  $code = 0
  if ($m.Groups[1].Success) { $code = [int]$m.Groups[1].Value }
  else { $code = [Convert]::ToInt32($m.Groups[2].Value, 16) }
  if ($code -lt 32 -or $code -gt 0x10FFFF -or ($code -ge 0xD800 -and $code -le 0xDFFF)) { return ' ' }
  return [char]::ConvertFromUtf32($code)
}

function Clean-Text([string]$s) {
  $s = $s -replace '&amp;','&' -replace '&lt;','<' -replace '&gt;','>' -replace '&nbsp;',' '
  $s = $s -replace '&#39;',"'" -replace '&quot;','"' -replace '&mdash;','--' -replace '&ndash;','-'
  $s = $s -replace '&rsquo;',"'" -replace '&lsquo;',"'" -replace '&hellip;','...'
  $s = $s -replace '&ldquo;','"' -replace '&rdquo;','"' -replace '&apos;',"'"
  $s = $s -replace '&rarr;','->' -replace '&larr;','<-' -replace '&times;','x'
  $s = $s -replace '&middot;',' ' -replace '&bull;',' '
  $s = [regex]::Replace($s, '&#(?:(\d{1,7})|[xX]([0-9a-fA-F]{1,6}));', $script:EntityEval)
  $s = ($s -replace '\s+',' ').Trim()
  return $s
}

# Plain text (glossary.json) only needs its whitespace tidied
function Collapse-Space([string]$s) {
  return ($s -replace '\s+',' ').Trim()
}

function Get-Category([string]$name) {
  if ($name -match '^index\.html$') { return 'Home' }
  if ($name -match '^(lan-wan-basics|ip-routing|switching|wireless|firewalls|zscaler)\.html$') { return 'Networking' }
  if ($name -match '^(cisco|paloalto|fortinet|devices)\.html$') { return 'Vendors' }
  if ($name -match '^(lan-process|process-ap|process-wlc-switch|wan-process)\.html$') { return 'Process' }
  if ($name -match '^(checklist|planner|templates|tools|hoto|assistant)\.html$') { return 'Tools' }
  if ($name -match '^(glossary|option43|resources|raci|whats-new)\.html$') { return 'Reference' }
  if ($name -match '^(karim-elzarka|mona-tantawy|peter-sabet|maryam-etry|org-chart)\.html$') { return 'Team' }
  if ($name -match '-squad\.html$') { return 'Squads' }
  return 'Page'
}

# ---------------------------------------------------------------------
#  Minimal JSON writer (identical output on PowerShell 5.1 and 7)
# ---------------------------------------------------------------------
$script:JsonCtrlEval = [System.Text.RegularExpressions.MatchEvaluator]{
  param($m)
  return ('\u' + ([int][char]$m.Value).ToString('x4'))
}

function JStr([string]$s) {
  if ($null -eq $s) { $s = '' }
  $s = $s.Replace('\', '\\').Replace('"', '\"')
  $s = [regex]::Replace($s, $script:JsonCtrlPattern, $script:JsonCtrlEval)
  return '"' + $s + '"'
}

function JArr($items) {
  $parts = New-Object System.Collections.ArrayList
  foreach ($i in @($items)) {
    if ($null -ne $i) { [void]$parts.Add((JStr ([string]$i))) }
  }
  return '[' + ($parts -join ',') + ']'
}

function Entry-Json($e) {
  return '{"t":' + (JStr $e.t) + ',"u":' + (JStr $e.u) + ',"c":' + (JStr $e.c) +
         ',"h":' + (JArr $e.h) + ',"x":' + (JStr $e.x) + '}'
}

# ---------------------------------------------------------------------
#  "Last updated" dates (git -> today for local edits -> file time)
# ---------------------------------------------------------------------
$gitOk = $false
if (Get-Command git -ErrorAction SilentlyContinue) {
  $inside = "$(& git -C $dir rev-parse --is-inside-work-tree 2>$null)".Trim()
  if ($LASTEXITCODE -eq 0 -and $inside -eq 'true') { $gitOk = $true }
}

function Get-UpdatedDate($file) {
  $fallback = $file.LastWriteTime.ToString('yyyy-MM-dd', $inv)
  if (-not $gitOk) { return $fallback }
  $n = $file.Name

  # '--' is quoted so no PowerShell version can swallow it
  $status = "$(& git -C $dir status --porcelain '--' $n 2>$null)".Trim()
  if ($LASTEXITCODE -ne 0) { return $fallback }
  if ($status) { return $today }            # modified, staged or untracked

  $d = "$(& git -C $dir log -1 --format=%cs '--' $n 2>$null)".Trim()
  if ($LASTEXITCODE -ne 0) { return $fallback }
  if ($d -match '^\d{4}-\d{2}-\d{2}$') { return $d }

  # git older than 2.21 has no %cs: use the date part of %ci instead
  $d = "$(& git -C $dir log -1 --format=%ci '--' $n 2>$null)".Trim()
  if ($d -match '^(\d{4}-\d{2}-\d{2})') { return $matches[1] }

  return $today                             # never committed (e.g. ignored)
}

# ---------------------------------------------------------------------
#  Collect pages - ordinal sort gives the same order on every OS
# ---------------------------------------------------------------------
$byName = @{}
foreach ($f in @(Get-ChildItem -LiteralPath $dir -Filter '*.html' -File)) {
  if ($f.Extension -ne '.html') { continue }
  if ($excluded -contains $f.Name.ToLowerInvariant()) { continue }
  $byName[$f.Name] = $f
}
$names = New-Object 'System.Collections.Generic.List[string]'
foreach ($k in $byName.Keys) { $names.Add([string]$k) }
$names.Sort([System.StringComparer]::Ordinal)

$entries = New-Object System.Collections.ArrayList
$pages   = New-Object System.Collections.ArrayList

foreach ($name in $names) {
  $f = $byName[$name]
  $raw = Get-Content -LiteralPath $f.FullName -Raw -Encoding UTF8
  if ($null -eq $raw) { $raw = '' }

  $title = ''
  if ($raw -match '(?is)<title>(.*?)</title>') { $title = (Clean-Text $matches[1]) }
  # Drop the site suffix: "RACI Matrix <em-dash> DPM Knowledge Base" -> "RACI Matrix"
  $title = [regex]::Replace($title, $script:TitleSuffixPattern, '').Trim()
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

  [void]$entries.Add([pscustomobject]@{ t=$title; u=$name; c=(Get-Category $name); h=$headings.ToArray(); x=$body })
  [void]$pages.Add([pscustomobject]@{ name=$name; title=$title; updated=(Get-UpdatedDate $f) })
}

# ---------------------------------------------------------------------
#  Glossary terms as first-class entries (direct answers)
# ---------------------------------------------------------------------
$seenTerms = @{}

# 1) Terms written in glossary.html
$glossPath = Join-Path $dir 'glossary.html'
if (Test-Path -LiteralPath $glossPath) {
  $gloss = Get-Content -LiteralPath $glossPath -Raw -Encoding UTF8
  if ($null -eq $gloss) { $gloss = '' }
  foreach ($m in [regex]::Matches($gloss, '(?is)<div class="glossary-term">(.*?)</div>\s*<div class="glossary-def">(.*?)</div>')) {
    $term = Clean-Text ($m.Groups[1].Value -replace '(?s)<[^>]+>','')
    $def  = Clean-Text ($m.Groups[2].Value -replace '(?s)<[^>]+>','')
    if ($term) {
      $seenTerms[$term.ToLowerInvariant()] = $true
      [void]$entries.Add([pscustomobject]@{ t=$term; u='glossary.html'; c='Glossary'; h=@(); x=$def })
    }
  }
}

# 2) Live terms added from the site (glossary-data.js commits them to
#    glossary.json as {"terms":[{"term":"...","def":"..."}]}). Skip any
#    term glossary.html already defines (case-insensitive), like the page does.
$glossJsonPath = Join-Path $dir 'glossary.json'
if (Test-Path -LiteralPath $glossJsonPath) {
  $data = $null
  try {
    $rawJson = [System.IO.File]::ReadAllText($glossJsonPath, [System.Text.Encoding]::UTF8)
    if ($rawJson.Trim()) { $data = $rawJson | ConvertFrom-Json }
  } catch {
    Write-Warning ('glossary.json could not be parsed, live terms skipped: ' + $_.Exception.Message)
    $data = $null
  }
  if ($null -ne $data -and $null -ne $data.terms) {
    foreach ($t in @($data.terms)) {
      if ($null -eq $t) { continue }
      $term = Collapse-Space ([string]$t.term)
      $def  = Collapse-Space ([string]$t.def)
      if (-not $term) { continue }
      $key = $term.ToLowerInvariant()
      if ($seenTerms.ContainsKey($key)) { continue }
      $seenTerms[$key] = $true
      [void]$entries.Add([pscustomobject]@{ t=$term; u='glossary.html'; c='Glossary'; h=@(); x=$def })
    }
  }
}

# ---------------------------------------------------------------------
#  Write search-index.json (compact, one array)
# ---------------------------------------------------------------------
$indexParts = New-Object System.Collections.ArrayList
foreach ($e in $entries) { [void]$indexParts.Add((Entry-Json $e)) }
$json = '[' + ($indexParts -join ',') + ']'
[System.IO.File]::WriteAllText((Join-Path $dir 'search-index.json'), $json, $utf8NoBom)

# ---------------------------------------------------------------------
#  Write page-meta.json (one page per line, for readable diffs)
# ---------------------------------------------------------------------
$metaLines = New-Object System.Collections.ArrayList
foreach ($p in $pages) {
  [void]$metaLines.Add('    ' + (JStr $p.name) + ': {"title": ' + (JStr $p.title) + ', "updated": ' + (JStr $p.updated) + '}')
}
$nl = "`n"
$meta = '{' + $nl +
        '  "generated": ' + (JStr $today) + ',' + $nl +
        '  "pages": {' + $nl +
        ($metaLines -join (',' + $nl)) + $nl +
        '  }' + $nl +
        '}' + $nl
[System.IO.File]::WriteAllText((Join-Path $dir 'page-meta.json'), $meta, $utf8NoBom)

Write-Output ("search-index.json rebuilt - {0} entries." -f $entries.Count)
Write-Output ("page-meta.json rebuilt - {0} pages." -f $pages.Count)
