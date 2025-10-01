const { task } = require("hardhat/config");

task(
  "accounts",
  "Prints the list of accounts and their private keys",
  async (taskArgs, hre) => {
    const accountsConfig = hre.config.networks.hardhat.accounts;
    if (!accountsConfig || !accountsConfig.mnemonic) {
      console.log(
        "Mnemonic not found in hardhat.config.js for the hardhat network."
      );
      return;
    }

    console.log("Mnemonic:", accountsConfig.mnemonic);
    console.log("\n==================================");
    console.log("Accounts and Private Keys");
    console.log("==================================");

    // Create the master node from the mnemonic's seed
    const masterNode = hre.ethers.HDNodeWallet.fromSeed(
      hre.ethers.Mnemonic.fromPhrase(accountsConfig.mnemonic).computeSeed()
    );

    for (let i = 0; i < accountsConfig.count; i++) {
      // Derive the account using the full derivation path
      const account = masterNode.derivePath(`m/44'/60'/0'/0/${i}`);
      console.log(`\nAccount #${i}:`);
      console.log(`  Address: ${account.address}`);
      console.log(`  Private Key: ${account.privateKey}`);
    }
  }
);

module.exports = {};
