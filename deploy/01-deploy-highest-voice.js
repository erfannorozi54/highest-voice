module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  await deploy('HighestVoice', {
    from: deployer,
    args: [], // Add constructor arguments here if any
    log: true,
  });
};

module.exports.tags = ['HighestVoice'];
