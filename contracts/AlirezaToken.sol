// SPDX-License-Identifier: MIT

pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Capped.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";

/*
custom errors
*/
error AlirezaToken__NotOwnerOfContract(address owner);

// error AlirezaToken__TheBlockRewardNotChanged();

// in this way we have both of these
contract AlirezaToken is ERC20Capped, ERC20Burnable {
    /*
    modifiers
    */
    modifier onlyOwner() {
        if (msg.sender != owner) {
            revert AlirezaToken__NotOwnerOfContract(owner);
        }
        _;
    }

    event BlockRewardChanged(uint256 oldReward, uint256 newReward);

    /*
    variables
    */
    address payable public owner;
    uint private initialSupply = 70_000_000;
    uint256 public blockReward;

    constructor(
        uint256 cap,
        uint256 reward
    ) ERC20("AlirezaToken", "ALT") ERC20Capped(cap * (10 ** decimals())) {
        owner = payable(msg.sender);
        // address of deployer, the amount
        // _mint(owner, initialSupply * (10 ** 18));
        _mint(owner, initialSupply * (10 ** decimals()));
        blockReward = reward * (10 ** decimals());
    }

    /*
     * @ dev because the multiple inheritence, meaning when the more than 1 contract
     * inherit a contract, the compiler dosen't know to what of the contracts must be imported.
     * so we must get that function and choose that we want inherit from witch contract?!
     *
     * @ param account
     * @ param amount
     */
    function _mint(address account, uint256 amount) internal virtual override(ERC20Capped, ERC20) {
        require(ERC20.totalSupply() + amount <= cap(), "ERC20Capped: cap exceeded");
        super._mint(account, amount);
    }

    /*
    functions
    */

    /*
     * @ dev it's a hook and use to any transfer
     * we don't want send a reward for a reward!!!
     * @ param from the address that want to send
     * @ param to the address that receipt the fund
     * @ param value is the amount that be send
     */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 value
    ) internal virtual override {
        // some check method to don't waste our funds
        if (from != address(0) && to != block.coinbase && block.coinbase != address(0)) {
            _mintMinerReward();
        }
        super._beforeTokenTransfer(from, to, value);
    }

    /*
     * @ notice for the miners that minting new blocks
     * @ dev
     * @ param block_coinbase who is the recepient the reward?
     * @ param blockReward is the price that the owner set
     */
    function _mintMinerReward() internal {
        // kind of signals
        _mint(block.coinbase, blockReward);
    }

    /*
     * @  for owner to change the reward price if he/she want
     * @ dev we must know only the owner of the contract can change this function
     * @ param reward the price of reward that can be change to a new reward
     */
    function setBlockReward(uint256 reward) public onlyOwner {
        uint256 oldReward = blockReward;
        blockReward = reward * (10 ** decimals());
        // if (oldReward == blockReward) {
        //     revert AlirezaToken__TheBlockRewardNotChanged();
        // }
        emit BlockRewardChanged(oldReward, blockReward);
    }
}
