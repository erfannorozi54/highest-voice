// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/Base64.sol";

/**
 * @title NFTRenderer
 * @notice External library for generating NFT metadata and SVG images
 * @dev Separating SVG generation into a library reduces main contract bytecode size
 */
library NFTRenderer {
    struct WinnerNFTData {
        uint256 auctionId;
        uint256 winningBid;
        string text;
        uint256 timestamp;
        uint256 tipsReceived;
    }

    /**
     * @notice Generate complete token URI with metadata and SVG
     */
    function generateTokenURI(
        uint256 tokenId,
        WinnerNFTData memory nft,
        bool isLegendary
    ) external pure returns (string memory) {
        // Generate SVG image
        string memory svg = isLegendary 
            ? _generateLegendarySVG(nft)
            : _generateSVG(nft);
            
        string memory imageURI = string(abi.encodePacked(
            'data:image/svg+xml;base64,',
            Base64.encode(bytes(svg))
        ));
        
        // Create JSON metadata
        string memory json;
        if (isLegendary) {
            json = string(abi.encodePacked(
                '{"name":"LEGENDARY - Highest Voice #',
                Strings.toString(tokenId),
                '","description":"The ultimate soulbound trophy for the most beloved voice! This legendary NFT is awarded to the winner who received the highest tips in HighestVoice history. Non-transferable and eternally prestigious.",',
                '"image":"', imageURI, '",',
                '"attributes":[',
                '{"trait_type":"Type","value":"Legendary Soulbound"},',
                '{"trait_type":"Auction","value":"', Strings.toString(nft.auctionId), '"},',
                '{"trait_type":"Token ID","value":"', Strings.toString(tokenId), '"},',
                '{"trait_type":"Winning Bid","display_type":"number","value":"', Strings.toString(nft.winningBid), '"},',
                '{"trait_type":"Tips Received","display_type":"number","value":"', Strings.toString(nft.tipsReceived), '"},',
                '{"trait_type":"Status","value":"Soulbound"},',
                '{"trait_type":"Rarity","value":"Legendary"},',
                '{"trait_type":"Timestamp","display_type":"date","value":', Strings.toString(nft.timestamp), '}',
                ']}'
            ));
        } else {
            json = string(abi.encodePacked(
                '{"name":"HighestVoice Winner #',
                Strings.toString(tokenId),
                '","description":"Winner of auction #',
                Strings.toString(nft.auctionId),
                ' on the HighestVoice protocol. This NFT certifies victory in a second-price sealed-bid auction where voices compete for on-chain projection.",',
                '"image":"', imageURI, '",',
                '"attributes":[',
                '{"trait_type":"Auction","value":"', Strings.toString(nft.auctionId), '"},',
                '{"trait_type":"Token ID","value":"', Strings.toString(tokenId), '"},',
                '{"trait_type":"Winning Bid","display_type":"number","value":"', Strings.toString(nft.winningBid), '"},',
                '{"trait_type":"Tips Received","display_type":"number","value":"', Strings.toString(nft.tipsReceived), '"},',
                '{"trait_type":"Timestamp","display_type":"date","value":', Strings.toString(nft.timestamp), '}',
                ']}'
            ));
        }
        
        return string(abi.encodePacked(
            'data:application/json;base64,',
            Base64.encode(bytes(json))
        ));
    }

    /**
     * @notice Generate special SVG for legendary soulbound token
     */
    function _generateLegendarySVG(WinnerNFTData memory nft) internal pure returns (string memory) {
        // Convert wei to ETH string (with 4 decimals)
        uint256 tipsInEth = nft.tipsReceived / 1e14;
        string memory tipsStr = string(abi.encodePacked(
            Strings.toString(tipsInEth / 10000),
            '.',
            _padZeros(tipsInEth % 10000, 4)
        ));
        
        return string(abi.encodePacked(
            '<svg xmlns="http://www.w3.org/2000/svg" width="500" height="500" viewBox="0 0 500 500">',
            '<defs>',
            '<linearGradient id="legendaryBg" x1="0%" y1="0%" x2="100%" y2="100%">',
            '<stop offset="0%" style="stop-color:#ff0080;stop-opacity:1"/>',
            '<stop offset="50%" style="stop-color:#7928ca;stop-opacity:1"/>',
            '<stop offset="100%" style="stop-color:#ff0080;stop-opacity:1"/>',
            '</linearGradient>',
            '<linearGradient id="goldenTrophy" x1="0%" y1="0%" x2="0%" y2="100%">',
            '<stop offset="0%" style="stop-color:#ffd700;stop-opacity:1"/>',
            '<stop offset="100%" style="stop-color:#ff8c00;stop-opacity:1"/>',
            '</linearGradient>',
            '<radialGradient id="glow">',
            '<stop offset="0%" style="stop-color:#ffffff;stop-opacity:0.8"/>',
            '<stop offset="100%" style="stop-color:#ffffff;stop-opacity:0"/>',
            '</radialGradient>',
            '</defs>',
            '<rect width="500" height="500" fill="url(#legendaryBg)"/>',
            // Animated glow effect
            '<circle cx="250" cy="250" r="200" fill="url(#glow)" opacity="0.2"/>',
            // Double border for legendary status
            '<rect x="15" y="15" width="470" height="470" fill="none" stroke="#ffd700" stroke-width="4" opacity="0.8" rx="15"/>',
            '<rect x="25" y="25" width="450" height="450" fill="none" stroke="#ffffff" stroke-width="2" opacity="0.6" rx="10"/>',
            // Large legendary crown
            '<path d="M 250 80 L 260 110 L 290 100 L 275 130 L 300 150 L 265 150 L 250 180 L 235 150 L 200 150 L 225 130 L 210 100 L 240 110 Z" fill="url(#goldenTrophy)" stroke="#ff8c00" stroke-width="2"/>',
            // Stars around crown
            '<circle cx="200" cy="90" r="3" fill="#ffd700"/>',
            '<circle cx="300" cy="90" r="3" fill="#ffd700"/>',
            '<circle cx="180" cy="130" r="2" fill="#ffffff"/>',
            '<circle cx="320" cy="130" r="2" fill="#ffffff"/>',
            // Title with "LEGENDARY"
            '<text x="250" y="220" font-family="Arial,sans-serif" font-size="24" font-weight="bold" fill="#ffd700" text-anchor="middle">',
            'LEGENDARY',
            '</text>',
            '<text x="250" y="250" font-family="Arial,sans-serif" font-size="28" font-weight="bold" fill="#ffffff" text-anchor="middle">',
            'HIGHEST VOICE',
            '</text>',
            // Soulbound badge
            '<rect x="180" y="270" width="140" height="30" fill="#000000" opacity="0.5" rx="15"/>',
            '<text x="250" y="292" font-family="Arial,sans-serif" font-size="14" font-weight="bold" fill="#ff00ff" text-anchor="middle">',
            'SOULBOUND',
            '</text>',
            // Stats box
            '<rect x="70" y="320" width="360" height="100" fill="#ffffff" opacity="0.15" rx="10"/>',
            // Tips (main stat for legendary)
            '<text x="250" y="350" font-family="Arial,sans-serif" font-size="16" fill="#ffffff" text-anchor="middle" opacity="0.9">',
            'HIGHEST TIPS RECEIVED',
            '</text>',
            '<text x="250" y="385" font-family="Arial,sans-serif" font-size="32" font-weight="bold" fill="#ffd700" text-anchor="middle">',
            tipsStr, ' ETH',
            '</text>',
            // Auction reference
            '<text x="250" y="410" font-family="Arial,sans-serif" font-size="12" fill="#e0e0e0" text-anchor="middle" opacity="0.7">',
            'Auction #', Strings.toString(nft.auctionId),
            '</text>',
            // Footer
            '<text x="250" y="470" font-family="Arial,sans-serif" font-size="12" fill="#ffd700" text-anchor="middle" opacity="0.8">',
            'Most Beloved Voice - Non-Transferable',
            '</text>',
            '</svg>'
        ));
    }
    
    /**
     * @notice Generate SVG image for regular NFT
     */
    function _generateSVG(WinnerNFTData memory nft) internal pure returns (string memory) {
        // Convert wei to ETH string (with 4 decimals)
        uint256 bidInEth = nft.winningBid / 1e14;
        string memory bidStr = string(abi.encodePacked(
            Strings.toString(bidInEth / 10000),
            '.',
            _padZeros(bidInEth % 10000, 4)
        ));
        
        uint256 tipsInEth = nft.tipsReceived / 1e14;
        string memory tipsStr = string(abi.encodePacked(
            Strings.toString(tipsInEth / 10000),
            '.',
            _padZeros(tipsInEth % 10000, 4)
        ));
        
        return string(abi.encodePacked(
            '<svg xmlns="http://www.w3.org/2000/svg" width="500" height="500" viewBox="0 0 500 500">',
            '<defs>',
            '<linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">',
            '<stop offset="0%" style="stop-color:#1e3a8a;stop-opacity:1"/>',
            '<stop offset="100%" style="stop-color:#7c3aed;stop-opacity:1"/>',
            '</linearGradient>',
            '<linearGradient id="trophy" x1="0%" y1="0%" x2="0%" y2="100%">',
            '<stop offset="0%" style="stop-color:#fbbf24;stop-opacity:1"/>',
            '<stop offset="100%" style="stop-color:#f59e0b;stop-opacity:1"/>',
            '</linearGradient>',
            '</defs>',
            '<rect width="500" height="500" fill="url(#bgGradient)"/>',
            '<rect x="20" y="20" width="460" height="460" fill="none" stroke="#ffffff" stroke-width="2" opacity="0.3" rx="10"/>',
            // Trophy icon
            '<path d="M 250 80 L 260 100 L 280 95 L 270 115 L 285 130 L 260 130 L 250 150 L 240 130 L 215 130 L 230 115 L 220 95 L 240 100 Z" fill="url(#trophy)"/>',
            // Title
            '<text x="250" y="200" font-family="Arial,sans-serif" font-size="32" font-weight="bold" fill="#ffffff" text-anchor="middle">',
            'HIGHEST VOICE',
            '</text>',
            '<text x="250" y="235" font-family="Arial,sans-serif" font-size="18" fill="#94a3b8" text-anchor="middle">',
            'Winner Certificate',
            '</text>',
            // Auction info box
            '<rect x="100" y="260" width="300" height="140" fill="#ffffff" opacity="0.1" rx="10"/>',
            '<text x="250" y="290" font-family="Arial,sans-serif" font-size="14" fill="#cbd5e1" text-anchor="middle">',
            'Auction #', Strings.toString(nft.auctionId),
            '</text>',
            // Winning bid
            '<text x="250" y="325" font-family="Arial,sans-serif" font-size="12" fill="#94a3b8" text-anchor="middle">',
            'Winning Bid',
            '</text>',
            '<text x="250" y="350" font-family="Arial,sans-serif" font-size="24" font-weight="bold" fill="#fbbf24" text-anchor="middle">',
            bidStr, ' ETH',
            '</text>',
            // Tips received
            '<text x="250" y="380" font-family="Arial,sans-serif" font-size="12" fill="#94a3b8" text-anchor="middle">',
            'Tips Received: ', tipsStr, ' ETH',
            '</text>',
            // Footer
            '<text x="250" y="450" font-family="Arial,sans-serif" font-size="10" fill="#64748b" text-anchor="middle">',
            'HighestVoice Protocol - Decentralized Voice Auctions',
            '</text>',
            '</svg>'
        ));
    }
    
    /**
     * @notice Pad a number with leading zeros to reach desired decimal places
     */
    function _padZeros(uint256 num, uint256 decimals) internal pure returns (string memory) {
        bytes memory numBytes = bytes(Strings.toString(num));
        if (numBytes.length >= decimals) {
            return string(numBytes);
        }
        
        bytes memory result = new bytes(decimals);
        uint256 zerosNeeded = decimals - numBytes.length;
        
        for (uint256 i = 0; i < zerosNeeded; i++) {
            result[i] = '0';
        }
        for (uint256 i = 0; i < numBytes.length; i++) {
            result[zerosNeeded + i] = numBytes[i];
        }
        
        return string(result);
    }
}
