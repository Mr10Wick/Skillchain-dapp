# Documentation Technique - Projet SkillChain (Web3 Monopoly)

## 1. Contexte et Objectifs
Ce projet consiste en la réalisation d'une **Application Décentralisée (DApp)** nommée **SkillChain**. L'objectif est de simuler un jeu de gestion d'actifs immobiliers (type Monopoly) sur la blockchain, en garantissant des règles métiers strictes via des Smart Contracts.

**Les défis techniques relevés :**
- Gestion de la rareté (limite de possession).
- Gestion du temps (délais de blocage et de refroidissement).
- Stockage décentralisé des métadonnées (IPFS).

---

## 2. Architecture Technique

Pour mettre en place ce projet, nous avons sélectionné une stack technique moderne et robuste :

| Composant | Technologie | Justification |
| :--- | :--- | :--- |
| **Blockchain** | Ethereum (EVM) | Standard industriel, large support d'outils. |
| **Langage** | Solidity `^0.8.20` | Langage natif pour les Smart Contracts Ethereum. |
| **Framework** | Hardhat | Environnement de développement complet (compilation, test, déploiement). |
| **Scripting** | TypeScript | Typage fort pour éviter les erreurs dans les tests et scripts. |
| **Standard** | ERC721 (OpenZeppelin) | Standard NFT pour garantir l'unicité des propriétés. |

---

## 3. Modèle de Données (Métadonnées)

Conformément aux contraintes du Web3, les données lourdes ne sont pas stockées sur la Blockchain (coût de gaz trop élevé) mais sur **IPFS**. Le Smart Contract stocke uniquement l'URI vers un fichier JSON structuré respectant le format imposé :

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
require(block.timestamp >= tokenLockedUntil[tokenId], "Lock: Ce token est verrouille...");
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