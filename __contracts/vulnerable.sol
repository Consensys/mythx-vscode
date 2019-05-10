
pragma solidity ^0.5.5;

contract Vulnerable {
    uint256 public n = 2^251;

    function f() public {
        selfdestruct(msg.sender);
    }

    function a() public {
        n = n * 2;
    }
}