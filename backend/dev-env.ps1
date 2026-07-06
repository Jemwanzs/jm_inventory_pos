# Dot-source this before running cargo in a fresh shell:  . .\dev-env.ps1
# Needed because this machine's shell sessions don't auto-refresh env vars
# from the registry after installing VS Build Tools, and Git Bash's PATH
# shadows MSVC's link.exe with its own /usr/bin/link.
$env:LIB = [Environment]::GetEnvironmentVariable("LIB", "User")
$env:INCLUDE = [Environment]::GetEnvironmentVariable("INCLUDE", "User")
$env:PATH = [Environment]::GetEnvironmentVariable("Path", "User") + ";" + [Environment]::GetEnvironmentVariable("Path", "Machine") + ";$env:USERPROFILE\.cargo\bin"
