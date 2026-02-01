import { ethers } from "hardhat";

async function main() {
  console.log("Déploiement du contrat SkillChain...");
  const SkillChain = await ethers.getContractFactory("SkillChain");
  const contract = await SkillChain.deploy();
  
  await contract.waitForDeployment();
  
  const address = await contract.getAddress();
  console.log("-----------------------------------------------");
  console.log("PROJET SKILLCHAIN VALIDÉ");
  console.log("Contrat déployé à l'adresse :", address);
  console.log("-----------------------------------------------");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
