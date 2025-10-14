const { ethers } = require('ethers');

async function testConnection() {
  try {
    console.log('🔍 Testing connection to local Hardhat node...');
    
    // Test with both URLs
    const urls = [
      'http://127.0.0.1:8545',
      'http://localhost:8545'
    ];
    
    for (const url of urls) {
      console.log(`\n📡 Testing: ${url}`);
      
      try {
        const provider = new ethers.JsonRpcProvider(url);
        
        // Test basic connection
        const blockNumber = await provider.getBlockNumber();
        console.log(`✅ Block number: ${blockNumber}`);
        
        // Test network info
        const network = await provider.getNetwork();
        console.log(`✅ Chain ID: ${network.chainId}`);
        
        // Test account balance
        const balance = await provider.getBalance('0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266');
        console.log(`✅ Account balance: ${ethers.formatEther(balance)} ETH`);
        
        console.log(`🎉 ${url} is working perfectly!`);
        
      } catch (error) {
        console.log(`❌ ${url} failed:`, error.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testConnection();
