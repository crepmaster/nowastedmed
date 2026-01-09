# Phase 1 — Règles officielles (v1.0)

Ce document liste **l’ensemble des règles normatives** appliquées par la Phase 1.
Chaque règle possède un identifiant stable et une sévérité.

---

## P1-A — Entrypoint & Bundling

### P1-A1 — Entrypoint résolu et existant
- **Sévérité** : BLOCKER
- **Description** :  
  L’application doit disposer d’un point d’entrée réel, existant sur le disque,
  et cohérent avec la configuration de démarrage.
- **Échec si** :
  - l’entrypoint référencé n’existe pas
  - un fichier de configuration pointe vers un chemin invalide
- **Correctif attendu** :  
  Corriger le chemin ou la configuration afin de référencer un entrypoint valide.

---

### P1-A2 — Entrypoint unique
- **Sévérité** : BLOCKER
- **Description** :  
  Un seul entrypoint actif est autorisé.
- **Échec si** :
  - plusieurs entrypoints concurrents sont configurés ou référencés
- **Correctif attendu** :  
  Supprimer toute configuration ou fichier d’entrée redondant.

---

## P1-B — Bootstrap Chain

### P1-B1 — Un seul `Application.run()`
- **Sévérité** : BLOCKER
- **Description** :  
  La chaîne de bootstrap NativeScript doit être unique.
- **Échec si** :
  - plus d’un `Application.run()` est détecté dans le code runtime
- **Correctif attendu** :  
  Conserver `Application.run()` uniquement dans l’entrypoint principal.

---

### P1-B2 — Pas de bootstrap par effet de bord
- **Sévérité** : BLOCKER
- **Description** :  
  Le démarrage de l’application ne doit pas être déclenché par l’import d’un module.
- **Échec si** :
  - `Application.run()` est présent dans un module utilitaire ou partagé
- **Correctif attendu** :  
  Déplacer le bootstrap dans l’entrypoint.

---

## P1-C — Webpack & Config Sanity

### P1-C1 — Configuration cohérente
- **Sévérité** : BLOCKER
- **Description** :  
  La configuration de bundling doit être lisible et cohérente avec l’entrypoint.
- **Échec si** :
  - la configuration est absente ou invalide
  - l’entry webpack pointe vers un fichier inexistant
- **Correctif attendu** :  
  Aligner la configuration sur l’entrypoint réel.

---

### P1-C2 — Mismatch ESM / CJS
- **Sévérité** : WARN
- **Description** :  
  Incohérence entre modules ESM, `.mjs` et configuration Node.
- **Action recommandée** :  
  Harmoniser `type: module`, extensions et imports.

---

## P1-D — Top-level Import Blockers

### P1-D1 — Imports Node.js core interdits au runtime
- **Sévérité** : BLOCKER
- **Description** :  
  NativeScript ne supporte pas les modules Node.js core au runtime.
- **Échec si** :
  - import top-level de `fs`, `crypto`, `path`, `os`, etc. dans le code runtime
- **Correctif attendu** :  
  Supprimer ou encapsuler ces imports hors runtime.

---

### P1-D2 — Accès natif plateforme sans garde
- **Sévérité** : BLOCKER
- **Description** :  
  Accès direct à des APIs Android/iOS au top-level sans condition.
- **Correctif attendu** :  
  Encapsuler l’accès derrière des gardes plateforme.

---

### P1-D3 — Dépendances fragiles au boot
- **Sévérité** : WARN
- **Description** :  
  Dépendances connues pour poser problème au démarrage.
- **Action recommandée** :  
  Vérifier la compatibilité runtime.

---

## P1-E — Hygiène CI

### P1-E1 — Lock file cohérent
- **Sévérité** : WARN (ou BLOCKER selon politique)
- **Description** :  
  Le lock file doit être cohérent avec `npm ci`.
- **Correctif attendu** :  
  Régénérer le lock file proprement.
