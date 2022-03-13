import { ethers, upgrades } from 'hardhat';
import { publishAbi } from './utils';

async function main() {
  await publishAbi();

  const ssvRegistryAddress = process.env.SSVREGISTRY_ADDRESS;
  const ssvTokenAddress = process.env.SSVTOKEN_ADDRESS;
  const ssvNetworkFactory = await ethers.getContractFactory('SSVNetwork');
  console.log(`Deploying SSVNetwork with ssvRegistry ${ssvRegistryAddress} and ssvToken ${ssvTokenAddress}...`);
  const contract = await upgrades.deployProxy(ssvNetworkFactory, [ssvRegistryAddress, ssvTokenAddress, process.env.MINIMUM_BLOCKS_BEFORE_LIQUIDATION, process.env.OPERATOR_MAX_FEE_INCREASE, process.env.SET_OPERATOR_FEE_PERIOD, process.env.APPROVE_OPERATOR_FEE_PERIOD]);
  await contract.deployed();
  // const contractDev = await upgrades.deployProxy(Contract);
  // await contractDev.deployed();
  console.log(`SSVNetwork deployed to: ${contract.address}`); // , ${contractDev.address}`);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
