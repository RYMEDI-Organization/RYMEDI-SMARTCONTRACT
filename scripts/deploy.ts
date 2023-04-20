import { ethers } from "hardhat";

async function main() {
  const currentTimestampInSeconds = Math.round(Date.now() / 1000);
  console.log("Deployment Script");
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().then(() =>{
  console.log("Deployment Done..!")
}).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
