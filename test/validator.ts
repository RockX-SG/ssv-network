import { ethers } from 'hardhat';
import { solidity } from 'ethereum-waffle';
import { strToHex, asciiToHex } from './utils';
const Web3EthAbi = require('web3-eth-abi');

import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';

before(() => {
  chai.should();
  chai.use(chaiAsPromised);
});

const { expect } = chai;

let Contract;
let contract;


describe('Validators', function() {
  beforeEach(async function () {
    Contract = await ethers.getContractFactory('SSVNetwork');
    contract = await Contract.deploy();
    await contract.deployed();

    await contract.setValidatorsPerOperatorLimit(2000);
  });

  // Test case
  it('Add first validator and emit the event', async function () {
    // Store a value
    const pubKey = '0xab53226da4e3ff35eab810b0dea331732d29baf4d93217f14367bc885adfdde30345a94d494c74cf1f7671b6150f15cf';
    const operatorPubKeys = ['0x011111111111111111111111111111111111111111111111111111','0x011111111111111111111111111111111111111111111111111112'];
    const sharePubKeys = ['0xaddb812ada642ea3d5b12c66f085c536e40143db764e95d496f33af77b06aa84047970cdb883202768f552f3e4997d79', '0xaddb812ada642ea3d5b12c66f085c536e40143db764e95d496f33af77b06aa84047970cdb883202768f552f3e4997d80'];
    const encryptedKeys = ['0x60900ad04cb043c54a8aedbcefb4cb936edd5e337e622cd55e82fe9235195544', '0x60900ad04cb043c54a8aedbcefb4cb936edd5e337e622cd55e82fe9235195545'];
    const ownerAddress = '0xe52350A8335192905359c4c3C2149976dCC3D8bF';

    // Add new operator and check if event was emitted
    await expect(contract.addValidator(
      ownerAddress,
      pubKey,
      operatorPubKeys,
      sharePubKeys,
      encryptedKeys
    ))
      .to.emit(contract, 'ValidatorAdded');

    /*
      Hot To Work with Event Payloads
    */
    /*
    const Web3EthAbi = require('web3-eth-abi');
    const raw = 'third parametr from event'.replace('0x', '');
    const oessItems = raw.split(Buffer.from('oess-separator', 'utf8').toString('hex'));
    const t = Web3EthAbi.decodeParameter(
      {
        "Oess": {
          "operatorPubKey": 'bytes',
          "index": 'uint',
          "sharePubKey": 'bytes',
          "encryptedKey": 'bytes'
        }
      },
      `0x${oessItems[i]}`
    );
    console.log(t.operatorPubKey);
    */

    // Note that we need to use strings to compare the 256 bit integers
    expect((await contract.validatorCount()).toString()).to.equal('1');    
  });

  it('Delete validator and emit the event', async function () {
    const pubKey = '0xab53226da4e3ff35eab810b0dea331732d29baf4d93217f14367bc885adfdde30345a94d494c74cf1f7671b6150f15cf';
    const operatorPubKeys = ['0x011111111111111111111111111111111111111111111111111111','0x011111111111111111111111111111111111111111111111111112'];
    const sharePubKeys = ['0xaddb812ada642ea3d5b12c66f085c536e40143db764e95d496f33af77b06aa84047970cdb883202768f552f3e4997d79', '0xaddb812ada642ea3d5b12c66f085c536e40143db764e95d496f33af77b06aa84047970cdb883202768f552f3e4997d80'];
    const encryptedKeys = ['0x60900ad04cb043c54a8aedbcefb4cb936edd5e337e622cd55e82fe9235195544', '0x60900ad04cb043c54a8aedbcefb4cb936edd5e337e622cd55e82fe9235195545'];

    const [owner] = await ethers.getSigners();
    await contract.addValidator(
      owner.address,
      pubKey,
      operatorPubKeys,
      sharePubKeys,
      encryptedKeys
    );

    await expect(contract.deleteValidator(pubKey))
      .to.emit(contract, 'ValidatorDeleted')
      .withArgs(owner.address, pubKey);

    // Note that we need to use strings to compare the 256 bit integers
    expect((await contract.validatorCount()).toString()).to.equal('0');
  });


  it('Delete validator fails if tx was sentnot by owner', async function () {
    const pubKey = '0xab53226da4e3ff35eab810b0dea331732d29baf4d93217f14367bc885adfdde30345a94d494c74cf1f7671b6150f15cf';
    const operatorPubKeys = ['0x011111111111111111111111111111111111111111111111111111','0x011111111111111111111111111111111111111111111111111112'];
    const sharePubKeys = ['0xaddb812ada642ea3d5b12c66f085c536e40143db764e95d496f33af77b06aa84047970cdb883202768f552f3e4997d79', '0xaddb812ada642ea3d5b12c66f085c536e40143db764e95d496f33af77b06aa84047970cdb883202768f552f3e4997d80'];
    const encryptedKeys = ['0x60900ad04cb043c54a8aedbcefb4cb936edd5e337e622cd55e82fe9235195544', '0x60900ad04cb043c54a8aedbcefb4cb936edd5e337e622cd55e82fe9235195545'];
    const ownerAddress = '0xe52350A8335192905359c4c3C2149976dCC3D8bF';

    await contract.addValidator(
      ownerAddress,
      pubKey,
      operatorPubKeys,
      sharePubKeys,
      encryptedKeys
    );

    await contract.deleteValidator(pubKey)
      .should.eventually.be.rejectedWith('Caller is not validator owner');
  });


  it('Update validator', async function () {
    const pubKey = '0xab53226da4e3ff35eab810b0dea331732d29baf4d93217f14367bc885adfdde30345a94d494c74cf1f7671b6150f15cf';
    const operatorPubKeys = ['0x011111111111111111111111111111111111111111111111111112'];
    const sharePubKeys = ['0xaddb812ada642ea3d5b12c66f085c536e40143db764e95d496f33af77b06aa84047970cdb883202768f552f3e4997d80'];
    const encryptedKeys = ['0x60900ad04cb043c54a8aedbcefb4cb936edd5e337e622cd55e82fe9235195545'];
    const [owner] = await ethers.getSigners();
    await contract.addValidator(
      owner.address,
      pubKey,
      operatorPubKeys,
      sharePubKeys,
      encryptedKeys
    );

    await expect(contract.updateValidator(
      pubKey,
      operatorPubKeys,
      sharePubKeys,
      encryptedKeys
    ))
      .to.emit(contract, 'ValidatorUpdated');
  });

  it('Update validator fails if tx was sent not by owner', async function () {
    const pubKey = '0xab53226da4e3ff35eab810b0dea331732d29baf4d93217f14367bc885adfdde30345a94d494c74cf1f7671b6150f15cf';
    const operatorPubKeys = ['0x011111111111111111111111111111111111111111111111111112'];
    const sharePubKeys = ['0xaddb812ada642ea3d5b12c66f085c536e40143db764e95d496f33af77b06aa84047970cdb883202768f552f3e4997d80'];
    const encryptedKeys = ['0x60900ad04cb043c54a8aedbcefb4cb936edd5e337e622cd55e82fe9235195545'];
    const ownerAddress = '0xe52350A8335192905359c4c3C2149976dCC3D8bF';

    await contract.addValidator(
      ownerAddress,
      pubKey,
      operatorPubKeys,
      sharePubKeys,
      encryptedKeys
    );

    await contract.updateValidator(
      pubKey,
      operatorPubKeys,
      sharePubKeys,
      encryptedKeys
    )
      .should.eventually.be.rejectedWith('Caller is not validator owner');

  });

});
