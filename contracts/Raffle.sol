// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import "./interfaces/IRarity.sol";
import "./interfaces/IrERC20.sol";
import "./interfaces/IRandomCodex.sol";
import "./onlyExtended.sol";

contract Raffle is OnlyExtended {

    uint private globalSeed = 0;
    uint public endTime = 7 days; //Raffle end in 7 days
    IrERC20 public candies;
    IRandomCodex public randomCodex;
    IRarity public rm;

    uint[] public participants;
    address[] public winners;
    bool public rewarded;
    mapping(uint => uint) ticketsPerSummoner;

    constructor(address _rm, address _candies, address _randomCodex) {
        candies = IrERC20(_candies);
        randomCodex = IRandomCodex(_randomCodex);
        rm = IRarity(_rm);
    }

    function _get_random(uint limit, bool withZero) internal view returns (uint) {
        uint _globalSeed = globalSeed;
        _globalSeed += gasleft();
        uint result = 0;
        if (withZero) {
            result = randomCodex.dn(_globalSeed, limit);
        }else{
            if (limit == 1) {
                return 1;
            }
            result = randomCodex.dn(_globalSeed, limit);
            result += 1;
        }
        return result;
    }

    function _update_global_seed() internal {
        string memory _string = string(
            abi.encodePacked(
                abi.encodePacked(msg.sender), 
                abi.encodePacked(block.timestamp), 
                abi.encodePacked(globalSeed), 
                abi.encodePacked(block.difficulty), 
                abi.encodePacked(gasleft())
            )
        );
        globalSeed = uint256(keccak256(abi.encodePacked(_string)));
    }

    function enterRaffle(uint summoner, uint amount) external {
        require(block.timestamp <= endTime, "!endTime");
        require(amount != 0, "zero amount");
        require(amount % 100 == 0, "!amount"); //Can only enter raffle with multiples of 100
        candies.burn(summoner, amount);
        uint tickets = amount / 100;
        for (uint256 i = 0; i < tickets; i++) {
            participants.push(summoner);
        }
        ticketsPerSummoner[summoner] += tickets;
        _update_global_seed();
    }

    function reward(uint winnersCount) external onlyExtended {
        require(block.timestamp >= endTime, "!endTime");
        require(!rewarded, "rewarded");
        uint[] memory _participants = participants;

        for (uint256 e = 0; e < winnersCount; e++) {
            uint num = _get_random(participants.length, true);
            address winner = rm.ownerOf(_participants[num]);
            winners.push(winner);
        }

        rewarded = true;
    }

    function getTicketsPerSummoner(uint summoner) external view returns (uint) {
        return ticketsPerSummoner[summoner];
    }

}