// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract ArcAirdrop {
    event Airdrop(address indexed token, address indexed from, uint256 totalRecipients, uint256 totalAmount);

    function airdropERC20(address token, address[] calldata recipients, uint256[] calldata amounts) external {
        require(recipients.length == amounts.length, "Length mismatch");
        uint256 total = 0;
        for (uint256 i = 0; i < recipients.length; i++) {
            IERC20(token).transferFrom(msg.sender, recipients[i], amounts[i]);
            total += amounts[i];
        }
        emit Airdrop(token, msg.sender, recipients.length, total);
    }
}
