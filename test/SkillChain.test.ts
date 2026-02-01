import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { time } from "@nomicfoundation/hardhat-network-helpers";

describe("SkillChain DApp", function () {
  
  // Fixture pour déployer le contrat une seule fois pour les tests
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
      
      // Mint 4 tokens
      for(let i=0; i<4; i++) {
        await skillChain.safeMint(addr1.address, `ipfs://${i}`, "Item", 10);
      }

      // Le 5ème doit échouer
      await expect(
        skillChain.safeMint(addr1.address, "ipfs://5", "Item", 10)
      ).to.be.revertedWith("Limite: Vous ne pouvez pas posseder plus de 4 ressources.");
    });
  });

  describe("Transfers & Time Constraints", function () {
    it("Should prevent transfer if token is locked (10 min lock)", async function () {
      const { skillChain, addr1, addr2 } = await loadFixture(deploySkillChainFixture);
      
      // Owner mint un token pour addr1
      await skillChain.safeMint(addr1.address, "ipfs://test", "Maison", 100);
      
      // addr1 essaie de le transférer tout de suite -> Doit échouer (Lock)
      await expect(
        skillChain.connect(addr1).transferToken(addr1.address, addr2.address, 0)
      ).to.be.revertedWith("Lock: Ce token est verrouille temporairement apres son acquisition.");
    });

    it("Should allow transfer after lock time expires", async function () {
      const { skillChain, addr1, addr2 } = await loadFixture(deploySkillChainFixture);
      await skillChain.safeMint(addr1.address, "ipfs://test", "Maison", 100);

      // Avancer le temps de 11 minutes
      await time.increase(11 * 60);

      await expect(
        skillChain.connect(addr1).transferToken(addr1.address, addr2.address, 0)
      ).not.to.be.reverted;
    });

    it("Should enforce cooldown between actions (5 min)", async function () {
      const { skillChain, addr1, addr2 } = await loadFixture(deploySkillChainFixture);
      
      // Mint 2 tokens pour addr1
      await skillChain.safeMint(addr1.address, "ipfs://1", "A", 10);
      await skillChain.safeMint(addr1.address, "ipfs://2", "B", 10);

      // Avancer le temps pour passer le lock initial du mint
      await time.increase(11 * 60);

      // Premier transfert OK
      await skillChain.connect(addr1).transferToken(addr1.address, addr2.address, 0);

      // Deuxième transfert immédiat -> Doit échouer (Cooldown)
      await expect(
        skillChain.connect(addr1).transferToken(addr1.address, addr2.address, 1)
      ).to.be.revertedWith("Cooldown: Veuillez patienter 5 minutes entre les actions.");
    });
  });
});