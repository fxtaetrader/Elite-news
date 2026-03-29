class MarketSignals {
    constructor() {
        this.timeframes = ['1H', '4H', 'Daily'];
    }

    async generateExpectations(marketData) {
        console.log("Generating market expectations...");
        
        const expectations = {
            xauusd: this.analyzeXAUUSD(marketData.xau),
            btcusd: this.analyzeBTCUSD(marketData.btc),
            majorPairs: this.analyzeMajorPairs(marketData.majorPairs),
            overall: this.generateOverallOutlook(marketData)
        };
        
        return expectations;
    }

    analyzeXAUUSD(xauData) {
        const change = parseFloat(xauData.change);
        
        let direction = change > 0.5 ? 'Bullish' : change < -0.5 ? 'Bearish' : 'Sideways';
        let strength = Math.abs(change) > 1 ? 'Strong' : Math.abs(change) > 0.3 ? 'Moderate' : 'Weak';
        let expectation = '';
        
        if (direction === 'Bullish') {
            expectation = `Gold showing ${strength.toLowerCase()} bullish momentum. Look for continuation toward next resistance levels.`;
        } else if (direction === 'Bearish') {
            expectation = `Gold under ${strength.toLowerCase()} bearish pressure. Further downside possible.`;
        } else {
            expectation = `Gold consolidating. Await breakout for clear direction.`;
        }
        
        return {
            pair: 'XAUUSD',
            currentPrice: xauData.price,
            dailyChange: `${change >= 0 ? '+' : ''}${change}%`,
            direction: direction,
            strength: strength,
            expectation: expectation,
            keyLevels: this.calculateKeyLevels(xauData.price),
            sentiment: this.calculateSentiment(change)
        };
    }

    analyzeBTCUSD(btcData) {
        const change = parseFloat(btcData.change);
        
        let direction = change > 1 ? 'Bullish' : change < -1 ? 'Bearish' : 'Sideways';
        let strength = Math.abs(change) > 3 ? 'Strong' : Math.abs(change) > 1 ? 'Moderate' : 'Weak';
        let expectation = '';
        
        if (direction === 'Bullish') {
            expectation = `Bitcoin showing ${strength.toLowerCase()} bullish momentum. Crypto market sentiment positive.`;
        } else if (direction === 'Bearish') {
            expectation = `BTC under ${strength.toLowerCase()} bearish pressure. Watch support levels.`;
        } else {
            expectation = `Bitcoin consolidating. Volume decreasing - potential breakout soon.`;
        }
        
        return {
            pair: 'BTCUSD',
            currentPrice: `$${btcData.price.toLocaleString()}`,
            dailyChange: `${change >= 0 ? '+' : ''}${change}%`,
            direction: direction,
            strength: strength,
            expectation: expectation,
            keyLevels: this.calculateBTCLevels(btcData.price),
            sentiment: this.calculateSentiment(change)
        };
    }

    analyzeMajorPairs(majorPairsData) {
        const pairs = [
            { name: 'EUR/USD', bias: this.calculateBias('EUR', majorPairsData) },
            { name: 'GBP/USD', bias: this.calculateBias('GBP', majorPairsData) },
            { name: 'USD/JPY', bias: this.calculateBias('JPY', majorPairsData) },
            { name: 'AUD/USD', bias: this.calculateBias('AUD', majorPairsData) },
            { name: 'USD/CAD', bias: this.calculateBias('CAD', majorPairsData) },
            { name: 'NZD/USD', bias: this.calculateBias('NZD', majorPairsData) }
        ];
        
        return pairs;
    }

    calculateBias(currency, marketData) {
        // Simulate bias based on market conditions
        const biases = ['Bullish', 'Bearish', 'Neutral'];
        const weights = [0.3, 0.3, 0.4];
        
        // Adjust based on DXY if available
        if (marketData && marketData.dxy) {
            const dxyChange = parseFloat(marketData.dxy.change);
            if (currency === 'EUR' || currency === 'GBP' || currency === 'AUD' || currency === 'NZD') {
                // Inverse correlation with DXY
                return dxyChange < 0 ? 'Bullish' : dxyChange > 0 ? 'Bearish' : 'Neutral';
            } else if (currency === 'JPY' || currency === 'CAD') {
                return 'Neutral';
            }
        }
        
        return biases[Math.floor(Math.random() * weights.length)];
    }

    calculateKeyLevels(price) {
        const priceNum = parseFloat(price);
        const range = priceNum * 0.005; // 0.5% range
        
        return {
            support1: (priceNum - range).toFixed(2),
            support2: (priceNum - range * 2).toFixed(2),
            resistance1: (priceNum + range).toFixed(2),
            resistance2: (priceNum + range * 2).toFixed(2)
        };
    }

    calculateBTCLevels(price) {
        const priceNum = parseFloat(price);
        const range = priceNum * 0.02; // 2% range for BTC
        
        return {
            support1: Math.round(priceNum - range),
            support2: Math.round(priceNum - range * 2),
            resistance1: Math.round(priceNum + range),
            resistance2: Math.round(priceNum + range * 2)
        };
    }

    calculateSentiment(change) {
        const changeNum = parseFloat(change);
        
        if (changeNum > 1) return { ratio: '70/30', bias: 'Bullish', confidence: 'High' };
        if (changeNum > 0.3) return { ratio: '60/40', bias: 'Slightly Bullish', confidence: 'Medium' };
        if (changeNum < -1) return { ratio: '30/70', bias: 'Bearish', confidence: 'High' };
        if (changeNum < -0.3) return { ratio: '40/60', bias: 'Slightly Bearish', confidence: 'Medium' };
        return { ratio: '50/50', bias: 'Neutral', confidence: 'Low' };
    }

    generateOverallOutlook(marketData) {
        const xauDirection = parseFloat(marketData.xau?.change) > 0 ? 'bullish' : 'bearish';
        const btcDirection = parseFloat(marketData.btc?.change) > 0 ? 'bullish' : 'bearish';
        
        let outlook = '';
        let riskLevel = 'Medium';
        
        if (xauDirection === 'bullish' && btcDirection === 'bullish') {
            outlook = 'Risk-on sentiment prevailing. Markets showing strength across both traditional and crypto assets.';
            riskLevel = 'Low to Medium';
        } else if (xauDirection === 'bearish' && btcDirection === 'bearish') {
            outlook = 'Risk-off sentiment dominating. Caution advised across all markets.';
            riskLevel = 'High';
        } else {
            outlook = 'Mixed signals across markets. Asset-specific drivers in play.';
            riskLevel = 'Medium to High';
        }
        
        return {
            outlook: outlook,
            riskLevel: riskLevel,
            suggestedFocus: xauDirection === 'bullish' ? 'Gold and USD pairs' : 'Bitcoin and crypto assets',
            marketCondition: xauDirection === btcDirection ? 'Trending' : 'Range-bound'
        };
    }

    formatExpectationsMessage(expectations) {
        const sentimentEmoji = {
            'Bullish': '🟢',
            'Bearish': '🔴',
            'Neutral': '🟡'
        };
        
        return `
🎯 *MARKET EXPECTATIONS & OUTLOOK*

🥇 *XAUUSD - GOLD*
💰 Price: $${expectations.xauusd.currentPrice}
📊 Daily: ${expectations.xauusd.dailyChange}
🎯 Direction: ${sentimentEmoji[expectations.xauusd.direction]} ${expectations.xauusd.direction} (${expectations.xauusd.strength})
💡 Expectation: ${expectations.xauusd.expectation}
📊 Sentiment: ${expectations.xauusd.sentiment.bias} (${expectations.xauusd.sentiment.confidence} confidence)

₿ *BTCUSD - BITCOIN*
💰 Price: ${expectations.btcusd.currentPrice}
📊 Daily: ${expectations.btcusd.dailyChange}
🎯 Direction: ${sentimentEmoji[expectations.btcusd.direction]} ${expectations.btcusd.direction} (${expectations.btcusd.strength})
💡 Expectation: ${expectations.btcusd.expectation}
📊 Sentiment: ${expectations.btcusd.sentiment.bias}

💱 *MAJOR PAIRS EXPECTATIONS:*
${expectations.majorPairs.map(pair => `• ${pair.name}: ${sentimentEmoji[pair.bias]} ${pair.bias}`).join('\n')}

📊 *OVERALL MARKET OUTLOOK:*
• Condition: ${expectations.overall.marketCondition}
• Outlook: ${expectations.overall.outlook}
• Risk Level: ${expectations.overall.riskLevel}
• Suggested Focus: ${expectations.overall.suggestedFocus}

⚠️ *Disclaimer:* This is market analysis and expectations only.
Always conduct your own research before trading.
━━━━━━━━━━━━━━━━━━━━━
        `;
    }
}

window.MarketSignals = MarketSignals;
