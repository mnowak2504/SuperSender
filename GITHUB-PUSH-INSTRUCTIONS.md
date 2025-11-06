# Instrukcje: Wypchnięcie kodu do GitHub

## Problem
Git jest skonfigurowany z kontem "ImportFromPoland", ale repozytorium należy do "mnowak2504". 

## Rozwiązanie: Użyj Personal Access Token

### Krok 1: Utwórz Personal Access Token
1. Przejdź do: https://github.com/settings/tokens
2. Kliknij "Generate new token" → "Generate new token (classic)"
3. Nadaj nazwę (np. "Supersender Push")
4. Wybierz zakres uprawnień: **repo** (pełny dostęp do repozytoriów)
5. Kliknij "Generate token"
6. **SKOPIUJ TOKEN** - będzie widoczny tylko raz!

### Krok 2: Wypchnij kod używając tokenu

W terminalu wykonaj:

```bash
git push -u origin main
```

Gdy zostaniesz poproszony o:
- **Username**: wpisz `mnowak2504`
- **Password**: wklej **Personal Access Token** (nie hasło GitHub!)

### Alternatywa: Użyj tokenu bezpośrednio w URL

```bash
git remote set-url origin https://mnowak2504:YOUR_TOKEN@github.com/mnowak2504/SuperSender.git
git push -u origin main
```

(Zastąp `YOUR_TOKEN` swoim tokenem)

### Alternatywa 2: Zmień konfigurację Git

```bash
git config --global user.name "mnowak2504"
git config --global user.email "twoj-email@example.com"
```

Następnie użyj tokenu przy push.

---

## Po udanym pushu:

1. Sprawdź repozytorium na GitHub: https://github.com/mnowak2504/SuperSender
2. Przejdź do wdrożenia na Vercel (zobacz `DEPLOYMENT.md`)

