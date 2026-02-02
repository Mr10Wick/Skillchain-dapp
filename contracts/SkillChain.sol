// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract SkillChain is ERC721URIStorage, Ownable {
    uint256 private _nextTokenId;

    // --- Contraintes Métiers ---
    uint256 public constant MAX_RESOURCES_PER_USER = 4;
    uint256 public constant COOLDOWN_TIME = 5 minutes; // Délai entre 2 actions
    uint256 public constant LOCK_TIME = 10 minutes;    // Blocage après acquisition

    // Mapping pour suivre le dernier timestamp d'action d'un utilisateur (Cooldown)
    mapping(address => uint256) public lastActionTimestamp;

    // Mapping pour savoir quand un token spécifique est débloqué (Lock temporaire)
    mapping(uint256 => uint256) public tokenLockedUntil;

    // Stockage des métadonnées on-chain
    struct ResourceInfo {
        string resourceType;
        uint256 value;
        uint256 createdAt;
    }
    mapping(uint256 => ResourceInfo) public resourceDetails;

    constructor() ERC721("SkillChainToken", "SKILL") Ownable(msg.sender) {}

    // --- Modifiers pour les contraintes ---

    modifier checkCooldown() {
        require(block.timestamp >= lastActionTimestamp[msg.sender] + COOLDOWN_TIME, "Cooldown: Veuillez patienter 5 minutes entre les actions.");
        _;
    }

    modifier checkLimit(address to) {
        require(balanceOf(to) < MAX_RESOURCES_PER_USER, "Limite: Vous ne pouvez pas posseder plus de 4 ressources.");
        _;
    }

    // --- Fonctions Principales ---

    /**
     * @dev Création d'une ressource (Mint).
     * @param to L'adresse du destinataire
     * @param uri Le lien IPFS contenant le JSON complet (name, previousOwners, etc.)
     * @param _type Le type de ressource (ex: "Maison")
     * @param _value La valeur de la ressource
     */
    function safeMint(address to, string memory uri, string memory _type, uint256 _value) public onlyOwner checkLimit(to) {
        uint256 tokenId = _nextTokenId++;
        
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);

        // Enregistrement des métadonnées on-chain minimales
        resourceDetails[tokenId] = ResourceInfo({
            resourceType: _type,
            value: _value,
            createdAt: block.timestamp
        });

        // Application du Lock temporaire sur le token
        tokenLockedUntil[tokenId] = block.timestamp + LOCK_TIME;
        
        // Mise à jour du cooldown global
        // lastActionTimestamp[to] = block.timestamp; 
    }

    /**
     * @dev Surcharge de transferFrom pour appliquer les règles sur les transferts.
     * Cela protège aussi safeTransferFrom qui appelle transferFrom en interne.
     */
    function transferFrom(address from, address to, uint256 tokenId) public override(ERC721, IERC721) checkCooldown checkLimit(to) {
        require(block.timestamp >= tokenLockedUntil[tokenId], "Lock: Token verrouille.");
        super.transferFrom(from, to, tokenId);
        _updateConstraints(tokenId);
    }

    /**
     * @dev Surcharge de safeTransferFrom pour appliquer les règles.
     */
    function safeTransferFrom(address from, address to, uint256 tokenId, bytes memory data) public override(ERC721, IERC721) checkCooldown checkLimit(to) {
        require(block.timestamp >= tokenLockedUntil[tokenId], "Lock: Token verrouille.");
        super.safeTransferFrom(from, to, tokenId, data);
        _updateConstraints(tokenId);
    }

    function _updateConstraints(uint256 tokenId) private {
        lastActionTimestamp[msg.sender] = block.timestamp; // Cooldown pour l'expéditeur
        tokenLockedUntil[tokenId] = block.timestamp + LOCK_TIME; // Nouveau lock pour le nouveau propriétaire
    }

    // --- Helpers ---

    function getResourceDetails(uint256 tokenId) public view returns (ResourceInfo memory) {
        return resourceDetails[tokenId];
    }

    /**
     * @dev Fonction utilitaire pour vérifier si un utilisateur est en cooldown
     */
    function isUserInCooldown(address user) public view returns (bool) {
        return block.timestamp < lastActionTimestamp[user] + COOLDOWN_TIME;
    }

    /**
     * @dev Fonction utilitaire pour vérifier si un token est verrouillé
     */
    function isTokenLocked(uint256 tokenId) public view returns (bool) {
        return block.timestamp < tokenLockedUntil[tokenId];
    }
}