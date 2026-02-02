# Rapport Technique - Projet SkillChain

## SOMMAIRE

1. [Introduction et Cas d'Usage](#1-introduction-et-cas-dusage)
2. [Architecture Technique](#2-architecture-technique)
3. [Respect des Contraintes Métiers](#3-respect-des-contraintes-métiers)
4. [Modèle de Données](#4-modèle-de-données-métadonnées)
5. [Validation par les Tests Unitaires](#5-validation-par-les-tests-unitaires)
6. [Contraintes et difficulté du projet](#6-contraintes-et-difficulté-du-projet)
7. [Sécurité et robustesse](#7-sécurité-et-robustesse)
8. [Conclusion](#8-conclusion)
[Annexes](#annexes)

---

## 1. Introduction et Cas d'Usage

### 1.1 Définition du concept :

Le projet **SkillChain** est une application décentralisée (DApp) inspirée des mécaniques du Monopoly. Elle permet la gestion d'actifs immobiliers numériques sous forme de jetons non fongibles (NFT). Le cas d'usage choisi est la **Tokenisation de ressources urbaines** (Maisons, Gares, Hôtels).

### 1.2 Justification du choix de la Blockchain :

L'utilisation de la blockchain pour ce projet se justifie par trois problématiques concrètes :

*   **Immuabilité** : Une fois acquise, la propriété d'une ressource est gravée sur le registre et ne peut être contestée.
*   **Transparence** : L'historique des transferts et la valeur des biens sont publics et vérifiables par tous.
*   **Automatisation** : Les règles de gestion (limites de temps, quotas) sont exécutées de manière autonome par le Smart Contract, sans tiers de confiance.

## 2. Architecture Technique

Nous avons mis en place un environnement de développement professionnel pour garantir la qualité du livrable :

*   **Smart Contract** : Développé en **Solidity ^0.8.20** en s'appuyant sur les standards sécurisés d'**OpenZeppelin** (`ERC721URIStorage`).
*   **Framework Hardhat** : Utilisé pour la compilation, le déploiement sur réseau local et l'exécution des tests unitaires.
*   **Environnement Node.js** : Stabilisé en version **v20 (LTS)** pour assurer la compatibilité des dépendances sur Mac M2 Pro.
*   **IPFS** : Utilisation pour le stockage décentralisé des images et métadonnées afin de respecter la contrainte d'intégrité des données.

## 3. Respect des Contraintes Métiers

Le projet valide l'intégralité des six contraintes imposées par le cahier des charges :

### 3.1 Tokenisation et Niveaux (Règle 1) :
Chaque ressource est un NFT unique. Nous avons implémenté trois types de ressources (Junior/Maison, Intermédiaire/Gare, Expert/Hôtel) via le mapping `resourceDetails`.

### 3.2 Échanges et Transferts (Règle 2) :
La fonction `transferFrom` surcharge le transfert standard pour y injecter nos validations de temps et de limites.

### 3.3 Limite de Possession (Règle 3) :
Grâce au modifier `checkLimit`, le contrat vérifie que `balanceOf(user) < 4` avant toute transaction. Si un utilisateur tente d'acquérir une 5ème ressource, la transaction est annulée avec un message d'erreur explicite.

### 3.4 Contraintes Temporelles (Règle 4) :

*   **Cooldown (5 min)** : Un mapping `lastActionTimestamp` enregistre l'heure de la dernière action. Un nouvel échange n'est possible que si 5 minutes se sont écoulées.
*   **Lock Temporaire (10 min)** : À chaque acquisition, le jeton est verrouillé via `tokenLockedUntil`. Cela empêche la spéculation immédiate.

## 4. Modèle de Données (Métadonnées)

Les métadonnées respectent strictement le format JSON imposé. Elles incluent l'historique des propriétaires et le lien vers le document certifié via un hash IPFS.

**Extrait du fichier JSON :**

```json
{
    "name": "Grand Hôtel Parisien",
    "type": "Hôtel",
    "value": "500",
    "hash": "QmDocumentHashSurIPFS...",
    "previousOwners": ["0x123...", "0x456..."],
    "createdAt": 1706710000,
    "lastTransferAt": 1706715000,
    "description": "Un hôtel de luxe situé au coeur de la blockchain.",
    "image": "ipfs://QmImageHashSurIPFS..."
}
```

---

## 4. Implémentation du Smart Contract (`SkillChain.sol`)

Le cœur de la logique métier est codé dans le contrat `SkillChain`. Voici comment nous avons traduit les contraintes fonctionnelles en code Solidity.

### A. Tokenisation des Ressources
Nous avons utilisé l'héritage d'`ERC721URIStorage` pour créer des tokens uniques (NFT) pouvant stocker une URI vers IPFS.

### B. Limite de Possession (Max 4)
Nous avons créé un `modifier` personnalisé qui vérifie le solde de l'utilisateur avant toute acquisition.

```solidity
modifier checkLimit(address to) {
    require(balanceOf(to) < MAX_RESOURCES_PER_USER, "Limite: Vous ne pouvez pas posseder plus de 4 ressources.");
    _;
}
```

### C. Contraintes Temporelles (Cooldown & Lock)
La gestion du temps est assurée par `block.timestamp` et deux mappings :
1.  **Cooldown (5 min)** : Empêche un utilisateur d'agir trop vite.
2.  **Lock (10 min)** : Empêche la revente immédiate d'un bien (anti-spéculation).

```solidity
// Vérification du Lock avant transfert
require(block.timestamp >= tokenLockedUntil[tokenId], "Lock: Token verrouille.");
```

---

## 5. Déploiement et Scripts

Pour automatiser la mise en production, nous avons développé un script en TypeScript (`scripts/deploy.ts`).

### Commande de déploiement
```bash
npx hardhat run scripts/deploy.ts
```

### Résultat (Log Console)
```text
Déploiement du contrat SkillChain...
-----------------------------------------------
PROJET SKILLCHAIN VALIDÉ
Contrat déployé à l'adresse : 0x5FbDB2315678afecb367f032d93F642f64180aa3
-----------------------------------------------
```

---

## 6. Stratégie de Tests et Validation

Pour garantir la fiabilité du code, nous avons mis en place une suite de tests automatisés utilisant **Hardhat Network Helpers** pour manipuler le temps (Time Travel).

### Scénario de Démonstration (`DemoScenario.test.ts`)
Nous avons créé un script spécifique pour la soutenance qui simule une partie complète :
1.  **Achat successif** jusqu'à la limite (vérification du blocage au 5ème item).
2.  **Tentative de revente immédiate** (vérification du Lock).
3.  **Avance rapide du temps** (+11 minutes) via `time.increase()`.
4.  **Validation du transfert** après la période de blocage.

### Exécution des tests
```bash
npx hardhat test test/DemoScenario.test.ts
```

### Preuve de fonctionnement (Screen Console)
```text
[TEST 1] Vérification de la contrainte MAX_RESOURCES_PER_USER...
   -> Tentative de mint d'un 5ème token...
   [SUCCÈS] La transaction a été rejetée correctement.

[TEST 2] Vérification de la contrainte LOCK_TIME...
   [SYSTEM] Avance rapide du temps (+11 minutes)...
   [SUCCÈS] Transfert validé après expiration du délai.
```

---

## 7. Conclusion
Le projet SkillChain est fonctionnel et respecte l'intégralité du cahier des charges. L'utilisation de Hardhat et TypeScript a permis de sécuriser le développement, tandis que les tests d'intégration prouvent la robustesse des règles métiers (Limites et Temps) sur la blockchain.