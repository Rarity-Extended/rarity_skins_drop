const { expect } = require("chai");
const { rarityManifestedAddr, candiesAddr, randomCodexAddr } = require("../registry.json");

describe("Raffle", function () {

    before(async function () {
        [user, anotherUser] = await ethers.getSigners();

        //Deploy
        this.Raffle = await ethers.getContractFactory("Raffle");
        this.raffle = await this.Raffle.deploy(rarityManifestedAddr, candiesAddr, randomCodexAddr);
        await this.raffle.deployed();
    });

    it("Should enter raffle...", async function () {

    });

    it("Should enter raffle with many summoners...", async function () {

    });

    it("Should reward...", async function () {

    });

    it("Should get tickets per summoner...", async function () {

    });

});