import * as chai from 'chai';
import chaiAsPromised from 'chai-as-promised';

import {
  initContracts,
  registerOperator,
  registerValidator,
  withdraw,
  processTestCase,
  account1,
  account2,
  ssvNetwork,
} from '../helpers/setup';

import {
  checkWithdrawFail,
  checkTotalBalance,
  checkTotalEarnings,
} from '../helpers/asserts';

before(() => {
  chai.should();
  chai.use(chaiAsPromised);
});

const { expect } = chai;

describe('SSV Network', function() {
  before(async function () {
    await initContracts();
  });

  it('Withdraw', async function() {
    const testFlow = {
      10: {
        funcs: [
          () => registerOperator(account2, 0, 20000),
          () => registerOperator(account2, 1, 10000),
          () => registerOperator(account2, 2, 10000),
          () => registerOperator(account2, 3, 30000),
        ],
        asserts: [],
      },
      20: {
        funcs: [
          () => registerValidator(account1, 0, [0, 1, 2, 3], 10000000),
        ],
        asserts: [
          () => checkTotalBalance(account1.address),
          () => checkTotalEarnings(account2.address),
        ],
      },
      100: {
        funcs: [
          () => withdraw(account2, 5000000),
        ],
        asserts: [
          () => checkTotalBalance(account2.address),
          () => checkTotalEarnings(account2.address),
        ],
      },
      110: {
        asserts: [
          () => checkWithdrawFail(account2, 100000000000),
        ],
      },
      120: {
        asserts: [
          () => checkTotalEarnings(account2.address),
          () => checkTotalBalance(account2.address),
          () => checkWithdrawFail(account2, 10000000),
        ],
      },
    };

    await processTestCase(testFlow);
  });
});