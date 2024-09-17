import { ethers } from "hardhat";
const helpers = require("@nomicfoundation/hardhat-network-helpers");

async function main() {

    // Get all addresses of tokens and users to interact with
    const USDCAddress = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";

    const UniSwapRouter = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";
    const USDCHolder = "0xf584f8728b874a6a5c7a8d4d387c9aae9172d621";

    const ETH_USDC_PAIR = "0xB4e16d0168e52d35CaCD2c6185b44281Ec28C9Dc";

    // impersonate holder and make holder a signer
    await helpers.impersonateAccount(USDCHolder);
    const impersonatedSigner = await ethers.getSigner(USDCHolder);

    // set parameter values
    const amountUSDCDesired = ethers.parseUnits("100", 6);

    const amountUSDCMin = ethers.parseUnits("60", 6);
    const amountEthMin = ethers.parseEther("0.01");

    // set deadline to revert if it takes too long to perform transaction
    const deadline = Math.floor(Date.now() / 1000) + 60 * 10;

    // get token contract snapshots for the impersonated user to approve spending
    const USDC = await ethers.getContractAt("IERC20", USDCAddress, impersonatedSigner);
    const ROUTER = await ethers.getContractAt("IUniswapV2Router", UniSwapRouter, impersonatedSigner);
    const lpEthContract = await ethers.getContractAt("IERC20", ETH_USDC_PAIR, impersonatedSigner);

    // approve v2 router contract to spend desired token amount
    await USDC.approve(UniSwapRouter, amountUSDCDesired);

    // check balance before swap
    const usdcBefore = await USDC.balanceOf(impersonatedSigner.getAddress());
    const ethBalBefore = await ethers.provider.getBalance(impersonatedSigner.getAddress());
    const EthUsdcBalBefore = await lpEthContract.balanceOf(impersonatedSigner.getAddress());

    console.log("Balance before adding liquidity:::", "USDC:::", Number(usdcBefore), "ETH:::", Number(ethBalBefore));
    console.log("LP Eth Balance before adding liquidity:::", "LP:::", Number(EthUsdcBalBefore));


    // Perform addLiquidity transaction
    const tx = await ROUTER.addLiquidityETH(
        USDCAddress,
        amountUSDCDesired,
        amountUSDCMin,
        amountEthMin,
        impersonatedSigner.getAddress(),
        deadline,
        { value: ethers.parseEther("0.1") } // amount of eth to be sent
    )

    await tx.wait();

    // check balance after adding Liquidity
    const usdcAfter = await USDC.balanceOf(impersonatedSigner.getAddress());
    const ethBalAfter = await ethers.provider.getBalance(impersonatedSigner.getAddress());
    const EthUsdcBalAfter = await lpEthContract.balanceOf(impersonatedSigner.getAddress());

    console.log("Balance before adding liquidity:::", "USDC:::", Number(usdcAfter), "ETH:::", Number(ethBalAfter));
    console.log("LP Eth Balance before adding liquidity:::", "LP:::", Number(EthUsdcBalAfter));

    console.log("=========================================================");
    console.log("USDC balance after:", ethers.formatUnits(usdcAfter, 6));
    console.log("ETH balance after:", ethers.formatEther(ethBalAfter));
    console.log("USDC used:", ethers.formatUnits(usdcBefore - usdcAfter, 6));
    console.log("ETH used:", ethers.formatEther(ethBalBefore - ethBalAfter));
    console.log("LP ETH token balance after liquidity", Number(EthUsdcBalAfter));
    console.log("=========================================================");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
