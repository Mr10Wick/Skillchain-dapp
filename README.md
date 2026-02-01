# SkillChain - Monopoly Web3 🏠🎲

**SkillChain** est une DApp (Application Décentralisée) simulant un jeu de gestion d'actifs immobiliers sur la Blockchain, inspirée du Monopoly. Ce projet a été réalisé dans le cadre du module **5BLOC - Blockchain**.

## 📋 Description

Le but est de collectionner des titres de propriété (Maisons, Gares, Hôtels) sous forme de **NFTs (ERC721)**. Le Smart Contract garantit l'équité du jeu en imposant des règles strictes immuables.

### Règles Métiers (Smart Contract)
1.  **Limite de Possession** : Un joueur ne peut pas posséder plus de **4 ressources** simultanément.
2.  **Anti-Spam (Cooldown)** : Un délai de **5 minutes** est imposé entre deux actions d'un même joueur.
3.  **Anti-Spéculation (Lock)** : Une ressource acquise est **verrouillée pendant 10 minutes** avant de pouvoir être revendue ou transférée.

## 🛠 Stack Technique

*   **Blockchain** : Ethereum (EVM)
*   **Smart Contract** : Solidity `^0.8.20` (OpenZeppelin)
*   **Framework** : Hardhat
*   **Langage de Script** : TypeScript
*   **Stockage** : IPFS (Métadonnées JSON)

## 🚀 Installation et Lancement

### 1. Prérequis
*   Node.js (v20 recommandé)
*   NPM

### 2. Installation
```bash
git clone https://github.com/Mr10Wick/Skillchain-dapp.git
cd Skillchain-dapp
npm install
```

### 3. Lancer les Tests (Démonstration)
Pour voir le scénario complet de validation des règles métiers :
```bash
npx hardhat test test/DemoScenario.test.ts
```

### 4. Déploiement Local
```bash
npx hardhat run scripts/deploy.ts
```

## 📂 Structure du Projet

*   `contracts/` : Code source Solidity (`SkillChain.sol`).
*   `test/` : Tests unitaires et scénarios de démo.
*   `scripts/` : Scripts de déploiement.
*   `DOCUMENTATION_TECHNIQUE.md` : Rapport détaillé du projet.
