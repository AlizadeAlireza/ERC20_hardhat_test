// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract HvIco is Ownable, ReentrancyGuard {
    ERC20 public hvToken;

    using SafeMath for uint256;

    address public treasury;

    uint256 maxLimitToken = 10;
    uint256 icoPrice = 0.1 ether;

    constructor(address _tokenAddress, address _treasury) {
        hvToken = ERC20(_tokenAddress);
        treasury = _treasury;
    }

    function buyTokenByETH() public payable nonReentrant {
        // get incoming amount => save gas
        uint256 incomingAmount = msg.value;

        // require incoming amount > icoPrice ==> at least sell one token
        require(incomingAmount > icoPrice, "Invalid Amount");

        // if incoming amount is more than max incoming amount ( maxLimitToken * icoPrice ) ==> incomignAmount = max incoming amount;
        if (incomingAmount > maxLimitToken * icoPrice) {
            incomingAmount = maxLimitToken * icoPrice;
        }

        // now how much token user can buy ==> example : 1ether / 0.1 = 10 tokens;
        uint256 sendToTheUser = incomingAmount.div(icoPrice);

        // get balance of address this for hvToken;
        uint256 contractTokenAmount = hvToken.balanceOf(address(this));

        // if sendToTheUser is more than contract balance ==> set sendToTheUser to the contract balance !
        // then update incomingAmount to new amount == > we can sell 5 tokens ==> so we get 5 * 0.1 = 0.5 ether from user;
        if (sendToTheUser > contractTokenAmount) {
            sendToTheUser = contractTokenAmount;
            incomingAmount = sendToTheUser * icoPrice;
        }

        // transfer hvTokens to the user;
        require(hvToken.transfer(msg.sender, sendToTheUser), "error");

        // instantly transfer ether to the bank;
        (bool Ok,) = treasury.call({value : incomingAmount})("");
        require(Ok. "error");

        // now if all msg.value is not spneded, we return back extra msg.value to the user ! 
        if(address(this.balance()) > 0){
            (bool Ok,) = treasury.call({value : address(this.balance())})("");
            require(Ok. "error");
        }
    }
}