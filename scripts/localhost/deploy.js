const hre = require("hardhat");
const {
    rarityManifestedAddr,
    candiesAddr,
    candiesMinter,
    randomCodexAddr,
    skinsAddr,
    skindsId,
    skinsWhaleAddr
} = require("../../registry.json");

async function main() {
    await hre.run("clean");
    await hre.run("compile");

    // from: https://github.com/nomiclabs/hardhat/issues/1226#issuecomment-924352129
    const provider = new ethers.providers.JsonRpcProvider("http://localhost:8545");
    await provider.send("hardhat_impersonateAccount", [skinsWhaleAddr]);
    const deployer = provider.getSigner(skinsWhaleAddr);

    const Raffle = await hre.ethers.getContractFactory("Raffle");
    const raffle = (await (await Raffle.connect(deployer))
      .deploy(rarityManifestedAddr, candiesAddr, randomCodexAddr, skinsAddr));
    console.log("Deployed at:", raffle.address);

    await raffle.deployTransaction.wait(1);

    const skins = new ethers.Contract(skinsAddr, [
      'function setApprovalForAll(address operator, bool _approved) external'
    ], deployer);

    // //Approve all prizes
    await skins.setApprovalForAll(raffle.address, true);
    console.log("Prizes approved");

    // //Load prizes
    await raffle.loadPrizes(skindsId);
    console.log("Prizes loaded");

    // //Approve raffle to mint candies
    await provider.send("hardhat_impersonateAccount", [candiesMinter]);
    const candies_signer = provider.getSigner(candiesMinter);
    const candies = new ethers.Contract(candiesAddr, [
      'function setMinter(address _minter) external'
    ], candies_signer);

    await candies.setMinter(raffle.address);
    console.log(`${raffle.address} can now mint candies`);

}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
