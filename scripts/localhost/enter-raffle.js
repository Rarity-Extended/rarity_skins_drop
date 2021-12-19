const hre = require('hardhat')
const { 
  rarityManifestedAddr, 
  candiesAddr,
  candiesMinter 
} = require('../../registry.json')

async function main() {
  await hre.run('clean')
  await hre.run('compile')

  const PRIZE_COUNT = 11
  const CANDIES_PER_TICKET = 25
  const raffle_address = '0xD86CBAA11F7Da4dbB2444d28c027cfa7752258d6'
  const player_address = '0x5cdAecc1A78A3b08d186E3f02E9f05c1bb92A59B'
  const player_summoners = ['243053', '417735', '418316', '729116', '1322846', '1971427', '1972230', '1972873', '1974478', '1975325', '1975880', '1980423', '1981617', '1981813', '1999657', '2001497', '2643674']

  // from: https://github.com/nomiclabs/hardhat/issues/1226#issuecomment-924352129
  const provider = new ethers.providers.JsonRpcProvider("http://localhost:8545")
  await provider.send('hardhat_impersonateAccount', [player_address])
  const player_signer = provider.getSigner(player_address)

  const rarity = new ethers.Contract(
    rarityManifestedAddr, [
    'function approve(address operator, uint summoner) external',
    'function getApproved(uint summoner) external view returns (address)',
    'function next_summoner() external view returns(uint)',
    'function summon(uint _class) external',
  ], player_signer )

  await provider.send('hardhat_impersonateAccount', [candiesMinter])
  const candies_signer = provider.getSigner(candiesMinter)
  const candies = new ethers.Contract(
    candiesAddr, [
      'function mint(uint dst, uint amount) external',
      'function setMinter(address _minter) external',
  ], candies_signer )

  const raffle = new ethers.Contract(
    raffle_address, [
      'function enterRaffle(uint summoner, uint amount)',
    ], player_signer )

  for(let i = 0; i < player_summoners.length; i++) {
    const summoner = player_summoners[i]
    console.log('summoner', summoner, 'buys', 4, 'raffle tickets..')
    try {
      await rarity.approve(raffle_address, summoner)
      await (await raffle.enterRaffle(summoner, 4 * CANDIES_PER_TICKET)).wait(1)
    } catch(error) {
      console.log('error', error)
    }
  }

  await candies.connect(candies_signer).setMinter(candiesMinter)
  const randos = await ethers.getSigners()
  for(let i = 0; i < (PRIZE_COUNT - 1); i++) {
    const rando = randos[i]
    const summoner = await rarity.connect(rando).next_summoner()
    console.log('rando', i + 1, rando.address, 'enters summoner', summoner.toNumber())
    await rarity.connect(rando).summon(1)
    await rarity.connect(rando).approve(raffle_address, summoner)
    await candies.mint(summoner, 25)
    await (await raffle.connect(rando).enterRaffle(summoner, 25)).wait(1)
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })