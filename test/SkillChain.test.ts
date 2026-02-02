import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { time } from "@nomicfoundation/hardhat-network-helpers";

describe("SkillChain DApp", function () {
  
  // Configuration du déploiement pour les tests
  async function deploySkillChainFixture() {
    const [owner, addr1, addr2] = await ethers.getSigners();
    const SkillChain = await ethers.getContractFactory("SkillChain");
    const skillChain = await SkillChain.deploy() as any;

    return { skillChain, owner, addr1, addr2 };
  }

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      const { skillChain, owner } = await loadFixture(deploySkillChainFixture);
      expect(await skillChain.owner()).to.equal(owner.address);
    });
  });

  describe("Minting & Limits", function () {
    it("Should mint a token successfully", async function () {
      const { skillChain, addr1 } = await loadFixture(deploySkillChainFixture);
      await skillChain.safeMint(addr1.address, "ipfs://test", "Maison", 100);
      expect(await skillChain.balanceOf(addr1.address)).to.equal(1);
    });

    it("Should fail if user exceeds 4 resources", async function () {
      const { skillChain, addr1 } = await loadFixture(deploySkillChainFixture);
      
      // Initialisation
      for(let i=0; i<4; i++) {
        await skillChain.safeMint(addr1.address, `ipfs://${i}`, "Item", 10);
      }

      // Vérification de la contrainte
      await expect(
        skillChain.safeMint(addr1.address, "ipfs://5", "Item", 10)
      ).to.be.revertedWith("Limite: Vous ne pouvez pas posseder plus de 4 ressources.");
    });
  });

  describe("Transfers & Time Constraints", function () {
    it("Should prevent transfer if token is locked (10 min lock)", async function () {
      const { skillChain, addr1, addr2 } = await loadFixture(deploySkillChainFixture);
      
      // Initialisation
      await skillChain.safeMint(addr1.address, "ipfs://test", "Maison", 100);
      
      // Vérification du blocage temporel
      await expect(
        skillChain.connect(addr1).transferFrom(addr1.address, addr2.address, 0)
      ).to.be.revertedWith("Lock: Token verrouille.");
    });

    it("Should allow transfer after lock time expires", async function () {
      const { skillChain, addr1, addr2 } = await loadFixture(deploySkillChainFixture);
      await skillChain.safeMint(addr1.address, "ipfs://test", "Maison", 100);

      // Simulation temporelle
      await time.increase(11 * 60);

      await expect(
        skillChain.connect(addr1).transferFrom(addr1.address, addr2.address, 0)
      ).not.to.be.reverted;
    });

    it("Should enforce cooldown between actions (5 min)", async function () {
      const { skillChain, addr1, addr2 } = await loadFixture(deploySkillChainFixture);
      
      // Initialisation
      await skillChain.safeMint(addr1.address, "ipfs://1", "A", 10);
      await skillChain.safeMint(addr1.address, "ipfs://2", "B", 10);

      // Simulation temporelle
      await time.increase(11 * 60);

      // Action initiale
      await skillChain.connect(addr1).transferFrom(addr1.address, addr2.address, 0);

      // Vérification du délai de refroidissement
      await expect(
        skillChain.connect(addr1).transferFrom(addr1.address, addr2.address, 1)
      ).to.be.revertedWith("Cooldown: Veuillez patienter 5 minutes entre les actions.");
    });
  });
});