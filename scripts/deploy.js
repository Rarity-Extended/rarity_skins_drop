const hre = require("hardhat");
const {
    rarityManifestedAddr,
    candiesAddr,
    randomCodexAddr,
    skinsAddr,
    skindsId
} = require("../registry.json");

async function main() {
    await hre.run("clean");
    await hre.run("compile");

    const Raffle = await hre.ethers.getContractFactory("Raffle");
    const raffle = await Raffle.deploy(rarityManifestedAddr, candiesAddr, randomCodexAddr, skinsAddr);
    console.log("Deployed at:", raffle.address);

    console.log("Waiting to confirm. (Prevent verification failing)");
    await raffle.deployTransaction.wait(5);

    //Verify. (Comment if making trouble)
    await hre.run("verify:verify", {
        address: raffle.address,
        constructorArguments: [rarityManifestedAddr, candiesAddr, randomCodexAddr, skinsAddr]
    });
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });