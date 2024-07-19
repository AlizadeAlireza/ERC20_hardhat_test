const { assert, expect } = require("chai")
const { ethers, network } = require("hardhat")
const { developmentChain, networkConfig } = require("../../helper-hardhat-config")

describe("alirezaToken Contract Tests", function () {
    let tokenContractFactory,
        deployer,
        spender1,
        spender2,
        tokenBlockReward = 50,
        approveAmount = 100
    const TOKEN_CAP = 100000000 /// ---> on milion(100,000,000)
    const name = "AlirezaToken",
        symbol = "ALT",
        decimals = 18
    const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000"

    beforeEach(async () => {
        // contract objects
        tokenContractFactory = await ethers.getContractFactory("AlirezaToken")
        tokenContract = await tokenContractFactory.deploy(TOKEN_CAP, tokenBlockReward)
        // alirezaToken = await tokenContract.connect(deployer)
        // const alireza = await getContract("AlirezaToken")

        // accounts and signers
        accounts = await ethers.getSigners()
        deployer = accounts[0]
        spender1 = accounts[1]
        spender2 = accounts[2]
    })

    describe("Tests for deployments", function () {
        it("it should set the right owner", async () => {
            expect(await tokenContract.owner()).to.equal(deployer.address)
        })
        it("should equal total supply to the owner balance", async () => {
            const ownerBalance = await tokenContract.balanceOf(deployer.address)
            const totalSupply = await tokenContract.totalSupply()
            assert(ownerBalance.toString() == totalSupply.toString())

            // the second approach

            // expect(await tokenContract.balanceOf(deployer.address).toString()).to.equal(
            //     await tokenContract.totalSupply().toString()
            // )
        })
        it("should set the max capped with the argumented during deployment", async () => {
            const cap = await tokenContract.cap()
            expect(Number(ethers.utils.formatEther(cap))).to.equal(TOKEN_CAP)
        })
        it("should set the blockReward with the argumented during deployment", async () => {
            const blockReward = await tokenContract.blockReward()
            expect(Number(ethers.utils.formatEther(blockReward))).to.equal(tokenBlockReward)
        })
        it("should be true -> name, symbol, decimals", async () => {
            expect(name).to.equal(await tokenContract.name())
            expect(symbol).to.equal(await tokenContract.symbol())
            expect(decimals).to.equal(await tokenContract.decimals())

            // another approach

            // assert(name == (await tokenContract.name()))
            // assert(symbol == (await tokenContract.symbol()))
            // assert(decimal == (await tokenContract.decimals()))
        })
    })
    describe("Tests for transactions", function () {
        it("must transfer the tokens between accounts", async () => {
            const transferAmount = 50

            // transfer between to deployer and owner
            await tokenContract.transfer(spender1.address, 50)
            expect(Number(await tokenContract.balanceOf(spender1.address))).to.equal(
                transferAmount
            )

            // transfer between spender1 and spender2

            await tokenContract.connect(spender1).transfer(spender2.address, transferAmount)
            expect(Number(await tokenContract.balanceOf(spender2.address))).to.equal(
                transferAmount
            )
            expect(Number(await tokenContract.balanceOf(spender1.address))).to.equal(0)

            // expect(Number(await tokenContract.balanceOf(deployer.address))).to.equal(
            //     (await tokenContract.totalSupply()) - transferAmount
            // )
        })
        it("should failed if sender doesn't have enough tokens for transfer", async () => {
            const initialOwnerBalance = await tokenContract.balanceOf(deployer.address)

            await expect(
                tokenContract.connect(spender1).transfer(deployer.address, 50)
            ).to.be.revertedWith("ERC20: transfer amount exceeds balance")

            expect(await tokenContract.balanceOf(deployer.address)).to.equal(initialOwnerBalance)
        })
        it("should failed if any account send token to zero address", async () => {
            // transfer from 0Xaddress to another address
            // await expect(
            //     tokenContract
            //         .connect(ethers.constants.AddressZero)
            //         .transfer(deployer.address, 50)
            // ).to.be.revertedWith("ERC20: transfer from the zero address")
            await expect(
                tokenContract.transfer(ethers.constants.AddressZero, 50)
            ).to.be.revertedWith("ERC20: transfer to the zero address")
        })
        // it("for myself", async () => {
        //     await expect(
        //         tokenContract.connect(zeroAddress).transfer(deployer.address, 50)
        //     ).to.be.revertedWith("ERC20: transfer from the zero address")
        // })

        it("should update balance after transfer", async () => {
            const initialBalanceOfOwner = await tokenContract.balanceOf(deployer.address)
            const transferAmount = 50

            // transfer from deployer to user1
            await tokenContract.transfer(spender1.address, transferAmount)

            // transfer from deployer to user2
            await tokenContract.transfer(spender2.address, transferAmount)

            const finalBalanceOfOwner = await tokenContract.balanceOf(deployer.address)

            expect(finalBalanceOfOwner).to.equal(initialBalanceOfOwner.sub(transferAmount * 2))
            expect(await tokenContract.balanceOf(spender1.address)).to.equal(transferAmount)
            expect(await tokenContract.balanceOf(spender2.address)).to.equal(transferAmount)

            // way two approach

            // expect(await tokenContract.balanceOf(deployer.address)).to.equal(
            //     initialBalanceOfOwner.sub(transferAmount * 2)
            // )
        })
        it("should be emit when a transfer is occurd", async () => {
            const transferEmit = "Transfer"
            expect(await tokenContract.transfer(spender1.address, 50)).to.emit(transferEmit)
        })
    })
    describe("tests for setBlockReward", function () {
        it("should be set initial block reward equal after deploy contract and change the reward", async () => {
            const initialBlockReward = await tokenContract.blockReward()
            const newBlockReward = 100
            await tokenContract.setBlockReward(newBlockReward)
            const afterBlockReward = await tokenContract.blockReward()
            const decimals = await tokenContract.decimals()

            // expect for initial reward after deploy
            expect(initialBlockReward.toString()).to.equal(
                (tokenBlockReward * 10 ** decimals).toString()
            )

            // expect for set new reward after deploy
            expect(afterBlockReward.toString()).to.equal(
                (newBlockReward * 10 ** decimals).toString()
            )
        })
        it("only the owner can change reward function", async () => {
            const error = `AlirezaToken__NotOwnerOfContract`
            await expect(tokenContract.connect(spender1).setBlockReward(100)).to.be.revertedWith(
                error
            )
        })
        // it("should revert error when new and old price is the same", async () => {
        //     const initialBlockReward = await tokenContract.blockReward()
        //     const decimals = await tokenContract.decimals()
        //     const newBlockReward = 50
        //     // await tokenContract.setBlockReward(newBlockReward)
        //     // const afterBlockReward = await tokenContract.blockReward()

        //     // expect to throw revert error
        //     expect(await tokenContract.setBlockReward(newBlockReward)).to.be.revertedWith(
        //         "AlirezaToken__TheBlockRewardNotChanged()"
        //     )
        // })
    })
    describe("tests for transferFrom", function () {
        it("should emit transfer and approval after transferfrom", async () => {
            // const approveAmount = 50

            const approveEmit = "Approval"
            const approveTransfer = "Transfer"
            expect(await tokenContract.approve(spender1.address, approveAmount)).to.emit(
                approveEmit
            )
            expect(
                await tokenContract
                    .connect(spender1)
                    .transferFrom(deployer.address, spender2.address, approveAmount)
            ).to.emit(approveTransfer)
        })
        it("it should return error when the approval is not true", async () => {
            const notAllowedFundsError = "ERC20: insufficient allowance"
            await tokenContract.approve(spender1.address, approveAmount)
            await expect(
                tokenContract.transferFrom(deployer.address, spender2.address, approveAmount)
            ).to.be.revertedWith(notAllowedFundsError)
        })
        it("zero address reverted", async () => {
            // approve to zero address
            await expect(tokenContract.approve(ZERO_ADDRESS, approveAmount)).to.be.revertedWith(
                "ERC20: approve to the zero address"
            )

            // approve from the zero address
            // await expect(
            //     tokenContract.connect(ZERO_ADDRESS).approve(spender1.address, approveAmount)
            // ).to.be.revertedWith("ERC20: approve from the zero address")

            // for transferFrom
            // await tokenContract.connect(ZERO_ADDRESS)
            // await expect(
            //     tokenContract
            //         .approve(spender1.address, approveAmount)
            //         .connect(spender1)
            //         .transferFrom(ZERO_ADDRESS, spender2.address, approveAmount)
            // ).to.be.revertedWith("ERC20: transfer from the zero address")

            // await tokenContract.approve(spender1.address, approveAmount)
            // await expect(
            //     tokenContract
            //         .connect(spender1)
            //         .transferFrom(deployer.address, ZERO_ADDRESS, approveAmount)
            // ).to.be.revertedWith("ERC20: transfer from the zero address")
        })
        it("should update the amounts after transfer and allowance", async () => {
            const initialBalanceOfOwner = await tokenContract.balanceOf(deployer.address)
            const transferForPayee = ethers.utils.parseEther("0.01")
            const tx_transfer = await tokenContract.transfer(spender1.address, transferForPayee)
            const userBalance = await tokenContract.balanceOf(spender1.address)
            const afterBalanceOfOwner = await tokenContract.balanceOf(deployer.address)
            // expect for transfer amount equality
            expect(userBalance).to.equal(transferForPayee) // means spender1 has 10000
            expect(Number(afterBalanceOfOwner)).to.equal(initialBalanceOfOwner - transferForPayee)
            expect(initialBalanceOfOwner).to.equal(
                afterBalanceOfOwner.add(transferForPayee).toString()
            )

            // approve from owner for spender1
            await tokenContract.approve(spender1.address, transferForPayee) // spender1 has 10000 and approve 10000

            // expect for allowance ---> allowances(owner, spender)
            expect(await tokenContract.allowance(deployer.address, spender1.address)).to.equal(
                transferForPayee
            )

            // pay from spender1 (half of that allowed it to him)
            const allowanceValue = await tokenContract.allowance(
                deployer.address,
                spender1.address
            )
            await tokenContract
                .connect(spender1)
                .transferFrom(deployer.address, spender2.address, allowanceValue)

            expect(afterBalanceOfOwner).to.equal(
                (await tokenContract.balanceOf(deployer.address)).add(allowanceValue)
            )
            expect(await tokenContract.balanceOf(spender1.address)).equal(userBalance)
            expect(await tokenContract.balanceOf(spender2.address)).equal(allowanceValue)
        })
    })
})
