import { expect } from "chai";
import { ethers } from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";

describe("SkillChain: Validation des Contraintes Métiers (Integration Test)", function () {
  let skillChain: any;
  let owner: any;
  let user1: any;
  let user2: any;

  // Configuration de l'environnement de test
  before(async function () {
    [owner, user1, user2] = await ethers.getSigners();
    const SkillChain = await ethers.getContractFactory("SkillChain");
    // @ts-ignore
    skillChain = await SkillChain.deploy();
    await skillChain.waitForDeployment();
    console.log(`\n\x1b[36m[INFO] Contrat déployé à l'adresse : ${await skillChain.getAddress()}\x1b[0m`);
  });

  it("1. Test Limite Max (4)", async function () {
    console.log("\n\x1b[34m[TEST 1] Vérif. Limite Max...\x1b[0m");
    
    // Pré-requis : Acquisition de 4 ressources
    for (let i = 0; i < 4; i++) {
      await skillChain.safeMint(user1.address, `ipfs://metadata_${i}`, "Resource", 100);
    }
    const balance = await skillChain.balanceOf(user1.address);
    console.log(`   -> Solde : ${balance} (Max atteint).`);

    // Test : Dépassement de la limite
    console.log("   -> Mint 5ème token...");
    await expect(
      skillChain.safeMint(user1.address, "ipfs://metadata_5", "Resource", 100)
    ).to.be.revertedWith("Limite: Vous ne pouvez pas posseder plus de 4 ressources.");
    
    console.log("   \x1b[32m[OK] Rejeté (Limite atteinte).\x1b[0m");
  });

  it("2. Test Lock Temporel (10 min)", async function () {
    console.log("\n\x1b[34m[TEST 2] Vérif. Lock Time...\x1b[0m");
    
    // Test : Transfert sous période de blocage
    console.log("   -> Transfert immédiat...");
    // @ts-ignore
    await expect(
      skillChain.connect(user1).transferFrom(user1.address, user2.address, 0)
    ).to.be.revertedWith("Lock: Token verrouille.");
    console.log("   \x1b[32m[OK] Bloqué (Lock actif).\x1b[0m");

    // Manipulation temporelle (Time Travel)
    console.log("   \x1b[33m[SYSTEM] +11 minutes...\x1b[0m");
    await time.increase(11 * 60);

    // Test : Transfert après période de blocage
    // @ts-ignore
    await skillChain.connect(user1).transferFrom(user1.address, user2.address, 0);
    
    const newOwner = await skillChain.ownerOf(0);
    expect(newOwner).to.equal(user2.address);
    console.log("   \x1b[32m[OK] Transfert validé.\x1b[0m");
  });

  it("3. Test Cooldown (5 min)", async function () {
    console.log("\n\x1b[34m[TEST 3] Vérif. Cooldown...\x1b[0m");

    // Contexte : Action récente
    // Test : Action sous délai de refroidissement
    console.log("   -> 2ème transaction immédiate...");
    // @ts-ignore
    await expect(
      skillChain.connect(user1).transferFrom(user1.address, user2.address, 1)
    ).to.be.revertedWith("Cooldown: Veuillez patienter 5 minutes entre les actions.");
    console.log("   \x1b[32m[OK] Rejeté (Cooldown actif).\x1b[0m");

    // Simulation de l'avancement du temps
    console.log("   \x1b[33m[SYSTEM] +6 minutes...\x1b[0m");
    await time.increase(6 * 60);

    // Test : Action après refroidissement
    // @ts-ignore
    await skillChain.connect(user1).transferFrom(user1.address, user2.address, 1);
    console.log("   \x1b[32m[OK] Transaction validée.\x1b[0m");
    console.log("\n----------------------------------------------------------------");
    console.log("\x1b[32m[BILAN] Contraintes validées.\x1b[0m");
    console.log("----------------------------------------------------------------\n");
  });
});
