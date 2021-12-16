// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import "./interfaces/IRarity.sol";
import "./interfaces/IrERC20.sol";
import "./interfaces/IRandomCodex.sol";
import "./onlyExtended.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";

contract Raffle is OnlyExtended, IERC721Receiver {

    uint private globalSeed = 0; //Used in `_get_random()`
    uint public endTime;
    uint public rewardForSacrifice = 150;
    IrERC20 private candies;
    IRandomCodex private randomCodex;
    IRarity private rm;
    IERC721 private Skins;

    uint[] public participants;
    address[] public winners;
    uint[] public skinsIds;
    mapping(uint => uint) ticketsPerSummoner;

    bool public rewarded = false;
    bool public prizesLoaded = false;

    constructor(address _rm, address _candies, address _randomCodex, address _skins) {
        candies = IrERC20(_candies);
        randomCodex = IRandomCodex(_randomCodex);
        rm = IRarity(_rm);
        Skins = IERC721(_skins);

        endTime = block.timestamp + 7 days; //Raffle end in 7 days
    }

    function _isApprovedOrOwner(uint _adventurer, address _operator) internal view returns (bool) {
        return (rm.getApproved(_adventurer) == _operator || rm.ownerOf(_adventurer) == _operator || rm.isApprovedForAll(rm.ownerOf(_adventurer), _operator));
    }

    function _get_random(uint limit, bool withZero) internal view returns (uint) {
        //pseudo random fn
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

    function _check_if_already_won(address[] memory currentWinners, address target) internal pure returns (bool) {
        //Return TRUE if target already won
        for (uint256 k = 0; k < currentWinners.length; k++) {
            address winner = currentWinners[k];
            if (winner == target){
                return true;
            }
        }
        return false;
    }

    function loadPrizes(uint[] memory _skinsIds) external onlyExtended {
        //Load NFTs in this contract
        skinsIds = _skinsIds;

        for (uint256 h = 0; h < _skinsIds.length; h++) {
            Skins.safeTransferFrom(msg.sender, address(this), _skinsIds[h]);
        }

        prizesLoaded = true;
    }

    function enterRaffle(uint summoner, uint amount) external {
        //Enter raffle, burn amount
        require(block.timestamp <= endTime, "!endTime");
        require(amount != 0, "zero amount");
        require(amount % 25 == 0, "!amount"); //Can only enter raffle with multiples of 25
        require(_isApprovedOrOwner(summoner, msg.sender), "!owner");
        candies.burn(summoner, amount);
        uint tickets = amount / 25;
        for (uint256 i = 0; i < tickets; i++) {
            participants.push(summoner);
        }
        ticketsPerSummoner[summoner] += tickets;
        _update_global_seed();
    }

    function sacrifice(uint summonerToSacrifice, uint summonerToReceive) external {
        //Sacrifice a summoner for candies
        require(rm.level(summonerToSacrifice) >= 4, "!level");
        rm.safeTransferFrom(msg.sender, address(0x000000000000000000000000000000000000dEaD), summonerToSacrifice, "");
        candies.mint(summonerToReceive, rewardForSacrifice);
    }

    function reward() external onlyExtended {
        //Admin execute the raffle
        require(block.timestamp >= endTime, "!endTime");
        require(!rewarded, "rewarded");
        require(prizesLoaded, "!prizes");
        uint[] memory _participants = participants;
        require(skinsIds.length < _participants.length, "!participantsLength");

        for (uint256 e = 0; e < skinsIds.length; e++) {
            uint num = _get_random(participants.length, true);
            address candidate = rm.ownerOf(_participants[num]);

            if(!_check_if_already_won(winners, candidate)){ //check if already won
                winners.push(candidate);
            }else{
                e--;
            }
        }

        rewarded = true;

        //Airdrop
        for (uint256 gm = 0; gm < winners.length; gm++) {
            Skins.safeTransferFrom(address(this), winners[gm], skinsIds[gm]);
        }
    }

    function getTicketsPerSummoner(uint summoner) external view returns (uint) {
        return ticketsPerSummoner[summoner];
    }

    function getWinners() external view returns (address[] memory) {
        return winners;
    }

    function getParticipants() external view returns (uint[] memory) {
        return participants;
    }

    function getWinningOdds(uint summoner, uint plusTickets) external view returns (uint, uint) {
        uint tickets = ticketsPerSummoner[summoner] + plusTickets;
        uint totalParticipants = participants.length + plusTickets;
        uint prizesCount = skinsIds.length;
        
        uint numerator = 0;
        uint denominator = 0;

        if(prizesCount <= totalParticipants){
            numerator = tickets;
            denominator = totalParticipants;
        }else{
            return (100, 100);
        }

        // Return odds in numerator/denominator
        return (numerator, denominator);
    }

    function onERC721Received(
        address operator,
        address from,
        uint256 tokenId,
        bytes calldata data
    ) external override returns (bytes4) {
        return this.onERC721Received.selector;
    }

}