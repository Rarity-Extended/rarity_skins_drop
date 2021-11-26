const { expect } = require("chai");
const { rarityManifestedAddr, candiesAddr, randomCodexAddr, candiesWhale, candiesMinter } = require("../registry.json");

describe("Raffle", function () {

    before(async function () {
        [this.user, this.anotherUser, ...this.others] = await ethers.getSigners();

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
            'function approve(address to, uint256 tokenId) external',
            'function summon(uint _class) external',
            'function next_summoner() external view returns(uint)',
        ], this.user);

        await hre.network.provider.request({
            method: "hardhat_impersonateAccount",
            params: [candiesMinter],
        });
        this.candiesMinterSigner = await ethers.getSigner(candiesMinter);

        this.candies = new ethers.Contract(candiesAddr, [
            'function mint(uint dst, uint amount) external',
            'function setMinter(address _minter) external'
        ], this.candiesMinterSigner);

        await this.candies.connect(this.candiesMinterSigner).setMinter(this.candiesMinterSigner.address);

    });

    it("Should enter raffle...", async function () {
        await this.rarity.connect(this.candiesWhaleSigner).approve(this.raffle.address, this.candiesWhaleSummoner);
        await this.raffle.connect(this.candiesWhaleSigner).enterRaffle(this.candiesWhaleSummoner, 200);
        await expect(this.raffle.connect(this.candiesWhaleSigner).enterRaffle(this.candiesWhaleSummoner, 0)).to.be.revertedWith("zero amount");
        await expect(this.raffle.connect(this.candiesWhaleSigner).enterRaffle(this.candiesWhaleSummoner, 52)).to.be.revertedWith("!amount");

        let tickets = await this.raffle.connect(this.candiesWhaleSigner).getTicketsPerSummoner(this.candiesWhaleSummoner);
        expect(tickets).equal(2);
    });

    it("Should enter raffle with many summoners...", async function () {
        this.timeout( 6000000000 );
        for (let q = 0; q < this.others.length; q++) {
            const signer = this.others[q];
            
            let summonerId = await this.rarity.connect(signer).next_summoner();
            // console.log("summonerId", summonerId);
            await this.rarity.connect(signer).summon(1);
            await this.rarity.connect(signer).approve(this.raffle.address, summonerId);
            await this.candies.connect(this.candiesMinterSigner).mint(summonerId, 200);
            await this.raffle.connect(signer).enterRaffle(summonerId, 200);
            let tickets = await this.raffle.connect(signer).getTicketsPerSummoner(summonerId);
            expect(tickets).equal(2);
        }
    });

    it("Should reward...", async function () {
        await expect(this.raffle.connect(this.anotherUser).reward(this.winnersCount)).to.be.revertedWith("!owner");
        await expect(this.raffle.connect(this.user).reward(this.winnersCount)).to.be.revertedWith("!endTime");
        await network.provider.send("evm_increaseTime", [604800]); //Time travel 7 days
        await this.raffle.connect(this.user).reward(this.winnersCount);
        await expect(this.raffle.connect(this.user).reward(this.winnersCount)).to.be.revertedWith("rewarded");

        let winners = await this.raffle.getWinners();
        expect(winners.length).equal(this.winnersCount);
        // let participants = await this.raffle.getParticipants();
        // console.log(winners);
        // console.log(participants);
    });

    it("Should not be able to enter raffle...", async function () {
        await expect(this.raffle.connect(this.candiesWhaleSigner).enterRaffle(this.candiesWhaleSummoner, 200)).to.be.revertedWith("!endTime");
    });

});