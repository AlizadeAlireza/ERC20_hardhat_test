const { ethers } = require("hardhat")
const { networkConfig, INITIAL } = require("../helper-hardhat-config")

async function main() {
    // get the contract owner

    const contractOwner = await ethers.getSigners()
    console.log(`Deploying Contracts from: ${contractOwner[0].address}`)

    const OurToken = await ethers.getContractFactory("AlirezaToken")
    arguments = [networkConfig[INITIAL]]
    // deploy the contract
    console.log("deploying our token...")
    const ourToken = await OurToken.deploy({
        from: contractOwner[0],
        args: arguments,
    })
    await ourToken.deployed()
    console.log(`OurToken deployed to: ${ourToken.address}`)
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exitCode = 1
    })
