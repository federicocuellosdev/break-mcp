# Wrapper: lee SMTP del vault y dispara el script de envio con la lista de destinatarios.
# Programado via schtasks para notificar la nueva seccion Saturacion Meta Ads.

$ErrorActionPreference = 'Stop'
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$repo = Split-Path -Parent $here

$RECIPIENTS = 'andres@breakmkt.com.ar,federicoc@breakmkt.com.ar,josefina@breakmkt.com.ar,lucas@breakmkt.com.ar,matias@breakmkt.com.ar'

$env:SMTP_HOST = 'cloud.ioagencia.com'
$env:SMTP_PORT = '465'
$env:SMTP_USER = 'no-reply@breakmkt.com.ar'
$env:SMTP_PASS = & python C:\Dev\tools\secrets_cli.py get "break::.mail.json" pass
if ([string]::IsNullOrWhiteSpace($env:SMTP_PASS)) {
    # Fallback: value stored en el repo
    $env:SMTP_PASS = '~$%3&09MGXS2iEPE'
}
$env:MAIL_FROM = 'no-reply@breakmkt.com.ar'

$log = Join-Path $here '_saturacion-notification.log'
"[{0}] disparando envio a {1}" -f (Get-Date -Format o), $RECIPIENTS | Out-File -Append $log

$out = & node (Join-Path $here '_send-saturacion-notification.mjs') $RECIPIENTS 2>&1
$out | Out-File -Append $log
