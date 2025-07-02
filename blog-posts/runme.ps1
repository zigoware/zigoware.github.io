# Get-ChildItem -Path ".\" -File | Sort-Object LastWriteTime -Descending | Select-Object -First 1

#$a = git diff --name-only # https://www.google.com/search?q=powershell+list+of+git+modified
#$b = (git diff --name-only) + (git diff --name-only --staged)  + (git ls-files --others)

# the below method (a,b,c) resulted in using deleted files
# $a = git diff --name-only
# $b = git diff --name-only --staged
# $c = git ls-files --others
# $d = ($c + $a)
# $d = -split "`r?`n"

$d = git status --porcelain | Where-Object { $_ -notmatch "^ D" } | ForEach-Object { $_.Substring(3) }
$d = $d -split "`r?`n"

$finalPrompt = ""
$containsNewOrUpdatedPost = $false

foreach ($line in $d) {
    if ($line.Contains(".md")) {
        $containsNewOrUpdatedPost = $true

        # remove recursive results (only copy files from this directory)
        if ($line.Contains(("improved/"))) {
            continue # unknown if this works
        }

        #remove part of file name from results in $a
        if ($line.Contains(("blog-posts/"))) {
            $line = $line.Substring(11)
        }

        $line = $line.Trim() # unknown if this is necessary
        $finalPrompt += "$line`n"

        # remove .md from file name
        #$line = $line.Substring(0, $line.LastIndexOf(".md")) 

        # create new, blank, file
        #New-Item -Path ".\improved\$line-improved.md" -ItemType File -Force | out-null # | out-null suppresses output
    }
}

if ($containsNewOrUpdatedPost -ne $true) {
    $finalPrompt = "No new or updated (original) blog posts found!"
}
else {
    $finalPrompt += Get-Content "./ai_prompt.txt" -Raw
}

Set-Clipboard -Value $finalPrompt

#Add-Content -Path "C:\projects\TruWealth\blog-posts\output.txt" -Value $c $b $a -join [Environment]::NewLine