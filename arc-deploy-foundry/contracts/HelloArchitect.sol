// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract HelloArchitect {
    string public greeting = "Hello, Architect!";
    event GreetingChanged(string oldGreeting, string newGreeting);

    function setGreeting(string calldata _greeting) external {
        string memory old = greeting;
        greeting = _greeting;
        emit GreetingChanged(old, _greeting);
    }

    function getGreeting() external view returns (string memory) {
        return greeting;
    }
}
