const { expect } = require("chai");
const { rarityManifestedAddr, candiesAddr, randomCodexAddr, candiesWhale } = require("../registry.json");

describe("Raffle", function () {

    before(async function () {
        [this.user, this.anotherUser] = await ethers.getSigners();

        //Deploy
        this.Raffle = await ethers.getContractFactory("Raffle");
        this.raffle = await this.Raffle.connect(this.user).deploy(rarityManifestedAddr, candiesAddr, randomCodexAddr);
        await this.raffle.deployed();

        await hre.network.provider.request({
            method: "hardhat_impersonateAccount",
            params: [candiesWhale],
        });

        this.candiesWhaleSigner = await ethers.getSigner(candiesWhale);
        this.candiesWhaleSummoner = 131094;
        this.winnersCount = 5;

        this.rarity = new ethers.Contract(rarityManifestedAddr, [
            'function approve(address to, uint256 tokenId) external;',
        ], this.user);
    });

    it("Should enter raffle...", async function () {
        await this.rarity.connect(this.candiesWhaleSigner).approve(this.raffle.address, this.candiesWhaleSummoner);
        await this.raffle.connect(this.candiesWhaleSigner).enterRaffle(this.candiesWhaleSummoner, 200);
        await expect(this.raffle.connect(this.candiesWhaleSigner).enterRaffle(this.candiesWhaleSummoner, 0)).to.be.revertedWith("zero amount");
        await expect(this.raffle.connect(this.candiesWhaleSigner).enterRaffle(this.candiesWhaleSummoner, 52)).to.be.revertedWith("!amount");

        let tickets = await this.raffle.connect(this.candiesWhaleSigner).getTicketsPerSummoner(this.candiesWhaleSummoner);
        expect(tickets).equal(2);
    });

    it.skip("Should enter raffle with many summoners...", async function () {

    });

    it("Should reward...", async function () {
        await expect(this.raffle.connect(this.anotherUser).reward(this.winnersCount)).to.be.revertedWith("!owner");
        await expect(this.raffle.connect(this.user).reward(this.winnersCount)).to.be.revertedWith("!endTime");
        await network.provider.send("evm_increaseTime", [604800]); //Time travel 7 days
        await this.raffle.connect(this.user).reward(this.winnersCount);
        await expect(this.raffle.connect(this.user).reward(this.winnersCount)).to.be.revertedWith("rewarded");

        let winners = await this.raffle.getWinners();
        expect(winners.length).equal(this.winnersCount);
    });

    it("Should not be able to enter raffle...", async function () {
        await expect(this.raffle.connect(this.candiesWhaleSigner).enterRaffle(this.candiesWhaleSummoner, 200)).to.be.revertedWith("!endTime");
    });

});