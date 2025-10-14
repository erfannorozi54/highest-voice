const { ethers } = require('ethers');

async function testContract() {
  try {
    console.log('🔍 Testing contract connection...');
    
    const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
    const contractAddress = '0x5FbDB2315678afecb367f032d93F642f64180aa3';
    
    // Simple ABI for testing
    const abi = [
      'function currentAuctionId() view returns (uint256)',
      'function getCountdownEnd() view returns (uint256)',
      'function minimumCollateral() view returns (uint256)'
    ];
    
    const contract = new ethers.Contract(contractAddress, abi, provider);
    
    console.log('📡 Contract address:', contractAddress);
    
    // Test basic contract calls
    const currentAuctionId = await contract.currentAuctionId();
    console.log('✅ Current auction ID:', currentAuctionId.toString());
    
    const countdownEnd = await contract.getCountdownEnd();
    console.log('✅ Countdown end:', countdownEnd.toString());
    
    const minimumCollateral = await contract.minimumCollateral();
    console.log('✅ Minimum collateral:', ethers.formatEther(minimumCollateral), 'ETH');
    
    // Calculate time remaining
    const now = Math.floor(Date.now() / 1000);
    const timeRemaining = Number(countdownEnd) - now;
    console.log('✅ Time remaining:', timeRemaining, 'seconds');
    
    console.log('🎉 Contract is working perfectly!');
    
  } catch (error) {
    console.error('❌ Contract test failed:', error.message);
    if (error.code === 'CALL_EXCEPTION') {
      console.error('💡 This might be a contract ABI mismatch or the contract is not deployed');
    }
  }
}

testContract();
