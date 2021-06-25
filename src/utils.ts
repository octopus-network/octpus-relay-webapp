//@ts-nocheck

import { connect, Contract, keyStores, WalletConnection } from "near-api-js";
import { BigNumber } from "bignumber.js";
BigNumber.set({ DECIMAL_PLACES: nearConfig.tokenDecimal });

// Initialize contract & set global variables
export async function initContract() {
  // Initialize connection to the NEAR testnet
  const near = await connect(
    Object.assign(
      { deps: { keyStore: new keyStores.BrowserLocalStorageKeyStore() } },
      nearConfig
    )
  );

  // Initializing Wallet based Account. It can work with NEAR testnet wallet that
  // is hosted at https://wallet.testnet.near.org
  window.walletConnection = new WalletConnection(near);

  // Getting the Account ID. If still unauthorized, it's just empty string
  window.accountId = window.walletConnection.getAccountId();

  window.contractName = nearConfig.contractName;
  window.tokenContractName = nearConfig.tokenContract;

  // Initializing our contract APIs by contract name and configuration
  window.contract = await new Contract(
    window.walletConnection.account(),
    nearConfig.contractName,
    {
      // View methods are read only. They don't modify the state, but usually return some value.
      viewMethods: [
        "get_appchain",
        "get_num_appchains",
        "get_curr_validator_set_len",
        "get_appchain_minium_validators",
        "get_appchains",
        "get_total_staked_balance",
        "get_validator_set",
        "get_validators",
        "get_minium_staking_amount",
      ],
      // Change methods can modify the state. But you don't receive the returned value when called.
      changeMethods: [
        "update_appchain",
        "unstake",
        "activate_appchain",
        "freeze_appchain",
        "remove_appchain",
        "pass_appchain",
        "appchain_go_staging"
      ],
    }
  );

  window.tokenContract = await new Contract(
    window.walletConnection.account(),
    nearConfig.tokenContract,
    {
      viewMethods: ["ft_balance_of", "storage_balance_of"],
      changeMethods: ["ft_transfer_call", "ft_transfer", "storage_deposit"],
    }
  );
}

export function logout() {
  window.walletConnection.signOut();
  // reload page
  window.location.replace(window.location.origin + window.location.pathname);
}

export function login() {
  // Allow the current app to make calls to the specified contract on the
  // user's behalf.
  // This works by creating a new access key for the user's account and storing
  // the private key in localStorage.
  window.walletConnection.requestSignIn(
    nearConfig.contractName,
    "Octopus Relay"
  );
}

export function fromDecimals(numStr) {
  return new BigNumber(numStr).div(Math.pow(10, 24)).toNumber();
}

export function toDecimals(num) {
  return new BigNumber(num).multipliedBy(10 ** 24).toString(10);
}

export function readableAppchain(appchain) {
  return Object.assign(appchain, {
    bond_tokens: fromDecimals(appchain.bond_tokens),
    validators: appchain.validators.map((v) =>
      Object.assign(v, { staked_amount: fromDecimals(v.staked_amount) })
    ),
  });
}

export function readableAppchains(appchains) {
  return appchains.map((ac) => readableAppchain(ac));
}
