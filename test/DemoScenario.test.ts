import { expect } from "chai";
import { ethers } from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";

describe("SkillChain: Validation des Contraintes Métiers (Integration Test)", function () {
  let skillChain: any;
  let owner: any;
  let user1: any;
  let user2: any;

  // Initialisation du contexte avant les tests
  before(async function () {
    [owner, user1, user2] = await ethers.getSigners();
    const SkillChain = await ethers.getContractFactory("SkillChain");
    // @ts-ignore
    skillChain = await SkillChain.deploy();
    await skillChain.waitForDeployment();
    console.log(`\n[INFO] Contrat déployé à l'adresse : ${await skillChain.getAddress()}`);
  });

  it("1. Validation de la limite de possession (Max: 4)", async function () {
    console.log("\n[TEST 1] Vérification de la contrainte MAX_RESOURCES_PER_USER...");
    
    // Mint des 4 premières ressources autorisées
    for (let i = 0; i < 4; i++) {
      await skillChain.safeMint(user1.address, `ipfs://metadata_${i}`, "Resource", 100);
    }
    const balance = await skillChain.balanceOf(user1.address);
    console.log(`   -> Solde actuel : ${balance} tokens (Maximum atteint).`);

    // Tentative de mint d'une 5ème ressource (Doit échouer)
    console.log("   -> Tentative de mint d'un 5ème token...");
    await expect(
      skillChain.safeMint(user1.address, "ipfs://metadata_5", "Resource", 100)
    ).to.be.revertedWith("Limite: Vous ne pouvez pas posseder plus de 4 ressources.");
    
    console.log("   [SUCCÈS] La transaction a été rejetée correctement par le Smart Contract.");
  });

  it("2. Validation du Lock Temporel (Anti-Flip: 10 min)", async function () {
    console.log("\n[TEST 2] Vérification de la contrainte LOCK_TIME...");
    
    // Tentative de transfert immédiat du token ID 0 (Doit échouer)
    console.log("   -> Tentative de transfert immédiat après acquisition...");
    // @ts-ignore
    await expect(
      skillChain.connect(user1).transferToken(user1.address, user2.address, 0)
    ).to.be.revertedWith("Lock: Ce token est verrouille temporairement apres son acquisition.");
    console.log("   [SUCCÈS] Transfert bloqué. Le token est verrouillé.");

    // Simulation de l'avancement du temps sur la blockchain locale
    console.log("   [SYSTEM] Avance rapide du temps (+11 minutes)...");
    await time.increase(11 * 60);

    // Nouvelle tentative après expiration du délai (Doit réussir)
    // @ts-ignore
    await skillChain.connect(user1).transferToken(user1.address, user2.address, 0);
    
    const newOwner = await skillChain.ownerOf(0);
    expect(newOwner).to.equal(user2.address);
    console.log("   [SUCCÈS] Transfert validé après expiration du délai de blocage.");
  });

  it("3. Validation du Cooldown Utilisateur (Anti-Spam: 5 min)", async function () {
    console.log("\n[TEST 3] Vérification de la contrainte COOLDOWN_TIME...");

    // L'utilisateur vient d'effectuer une action (transfert précédent).
    // Tentative d'une seconde action immédiate (Doit échouer)
    console.log("   -> Tentative d'exécution d'une seconde transaction consécutive...");
    // @ts-ignore
    await expect(
      skillChain.connect(user1).transferToken(user1.address, user2.address, 1)
    ).to.be.revertedWith("Cooldown: Veuillez patienter 5 minutes entre les actions.");
    console.log("   [SUCCÈS] Transaction rejetée. Le cooldown est actif.");

    // Simulation de l'avancement du temps
    console.log("   [SYSTEM] Avance rapide du temps (+6 minutes)...");
    await time.increase(6 * 60);

    // Nouvelle tentative (Doit réussir)
    // @ts-ignore
    await skillChain.connect(user1).transferToken(user1.address, user2.address, 1);
    console.log("   [SUCCÈS] Transaction validée après la période de refroidissement.");
    console.log("\n----------------------------------------------------------------");
    console.log("[BILAN] Toutes les contraintes techniques sont validées.");
    console.log("----------------------------------------------------------------\n");
  });
});
