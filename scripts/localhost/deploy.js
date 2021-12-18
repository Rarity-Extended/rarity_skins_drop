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

    // from: https://github.com/nomiclabs/hardhat/issues/1226#issuecomment-924352129
    const provider = new ethers.providers.JsonRpcProvider("http://localhost:8545");

    const skins_signer_address = "0xccb7D7A4fd098286Eb56fAe56FD8aA6Fab67962D";
    await provider.send("hardhat_impersonateAccount", [skins_signer_address]);
    const deployer = provider.getSigner(skins_signer_address);

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
    const extended_signer_address = "0x39Ab6cFE9765C641E6dAa46593382a7efB402260";
    // const extended_signer_address = "0x0f5861aaf5F010202919C9126149c6B0c76Cf469";
    await provider.send("hardhat_impersonateAccount", [extended_signer_address]);
    const extended_signer = provider.getSigner(extended_signer_address);
    const candies = new ethers.Contract(candiesAddr, [
      'function setMinter(address _minter) external'
    ], extended_signer);

    await candies.setMinter(raffle.address);
    console.log(`${raffle.address} can now mint candies`);

}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
