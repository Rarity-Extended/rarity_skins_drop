const hre = require('hardhat')
const { skinsWhaleAddr } = require('../../registry.json')

async function main() {
  await hre.run('clean')
  await hre.run('compile')

  const raffle_address = '0xD86CBAA11F7Da4dbB2444d28c027cfa7752258d6'

  // from: https://github.com/nomiclabs/hardhat/issues/1226#issuecomment-924352129
  const provider = new ethers.providers.JsonRpcProvider("http://localhost:8545");

  // need gas money?
  console.log('send gas money to', skinsWhaleAddr)
  const gas_money_params = [{
    from: (await ethers.getSigners())[0].address,
    to: skinsWhaleAddr,
    value: ethers.utils.parseUnits('1000', 'ether').toHexString()
  }]
  await provider.send('eth_sendTransaction', gas_money_params)

  await provider.send("hardhat_impersonateAccount", [skinsWhaleAddr]);
  const deployer = provider.getSigner(skinsWhaleAddr);

  const raffle = new ethers.Contract(
    raffle_address, [
      'function reward() external',
      'function getWinners() external view returns (address[] memory)',
    ], deployer
  )

  console.log('📅 Time travel 7 days')
  await network.provider.send("evm_increaseTime", [ 60 * 60 * 24 * 7 ]);

  console.log('🏆 Draw winning tickets')
  await (await raffle.reward()).wait(1)

  const winners = await raffle.getWinners()
  winners.forEach((w, i) => console.log('winner', i+1, w))

}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })