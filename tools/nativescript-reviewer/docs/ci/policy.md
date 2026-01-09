# Politique — WARN / BLOCKER et évolution (Phase 1)

## Objectif
Assurer une Phase 1 :
- stable
- prédictible
- strictement orientée boot & entry
- sans faux positifs

## Règles de sévérité
### BLOCKER
Une règle est BLOCKER si elle :
- casse le démarrage,
- rend le boot non déterministe,
- ou crée une ambiguïté d’entrypoint/bootstrap.

### WARN
Une règle est WARN si elle :
- signale un risque,
- une dette technique,
- ou une incohérence potentielle,
sans bloquer immédiatement.

## Promotion WARN → BLOCKER
1) Introduire la règle en WARN
2) Observer sur plusieurs PR
3) Corriger faux positifs et améliorer message
4) Promouvoir en BLOCKER lors d’une version suivante

## Versioning
- Ajout de WARN : version mineure
- Promotion en BLOCKER : version mineure (avec annonce)
- Changement de contrat Phase 1 : version majeure (rare)
