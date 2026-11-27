# LESSONS - auto-maintained by scripts/lessons.py

> Machine-owned. Do NOT hand-edit. Changes are overwritten on the next `lessons.py` write.
> Canonical state lives in `.specs/lessons.json`. Edit lessons only via the script.
> promote_threshold=2 distinct features · window_days=45 · quarantine_threshold=2

## Confirmed (load these at Plan/Checks)

Corroborated across multiple features. Safe to apply as guidance.

_none_

## Candidates (under observation - do NOT load as guidance yet)

Seen once or not yet corroborated. Tracked, not trusted.

### L-001 - Valide o pacote em um checkout da branch publicada e confira os arquivos e endpoints consumidos pela VM.
- signal: `weak_test` · recurrence: 1 feature(s) · harmful: 0
- features: cicd-aws-demo
- evidence: CICD-03
- last seen: 2026-11-26T19:28:58Z

### L-002 - Teste redirecionamentos e respostas vazias ao verificar a página antes de aprovar um deploy.
- signal: `weak_test` · recurrence: 1 feature(s) · harmful: 0
- features: cicd-aws-demo
- evidence: CICD-04
- last seen: 2026-11-26T19:28:58Z

### L-003 - Reaplique a versão registrada se a persistência do estado falhar depois de ativar a candidata.
- signal: `ac_gap` · recurrence: 1 feature(s) · harmful: 0
- features: cicd-aws-demo
- evidence: CICD-05
- last seen: 2026-11-26T19:28:59Z

## Quarantined (failed when applied - ignore)

A confirmed lesson that recurred alongside failure. Kept for the maintainer to review.

_none_
