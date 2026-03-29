class TelegramBot {
    constructor() {
        // Your configuration
        this.token = "8735177156:AAGSKgNy8WaG66WK1FKxNCkeqRpxooXstvU";
        this.chatId = "-1003889484238";
        this.messageThreadId = "50";
        
        this.loadConfig();
        console.log("Telegram Bot initialized");
    }
    
    loadConfig() {
        const savedConfig = localStorage.getItem('telegramConfig');
        if (savedConfig) {
            try {
                const config = JSON.parse(savedConfig);
                if (config.token) this.token = config.token;
                if (config.chatId) this.chatId = config.chatId;
                if (config.messageThreadId) this.messageThreadId = config.messageThreadId;
            } catch(e) {
                console.error("Error loading config:", e);
            }
        }
    }
    
    async sendMessage(message, parseMode = 'Markdown') {
        if (!this.token || !this.chatId) {
            console.error("❌ No bot token or chat ID");
            return { success: false, error: "Configuration missing" };
        }
        
        try {
            const url = `https://api.telegram.org/bot${this.token}/sendMessage`;
            const payload = {
                chat_id: this.chatId,
                text: message,
                parse_mode: parseMode
            };
            
            if (this.messageThreadId && this.messageThreadId !== "") {
                payload.message_thread_id = parseInt(this.messageThreadId);
            }
            
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            
            const data = await response.json();
            
            if (data.ok) {
                console.log("✅ Message sent successfully");
                return { success: true, data };
            } else {
                throw new Error(data.description || "Unknown error");
            }
        } catch (error) {
            console.error("❌ Telegram send error:", error);
            return { success: false, error: error.message };
        }
    }
    
    async sendHighImpactAlert(event) {
        const message = this.formatHighImpactMessage(event);
        return await this.sendMessage(message);
    }
    
    async sendMarketUpdate(marketData, newsItems, expectations) {
        const message = this.formatMarketUpdate(marketData, newsItems, expectations);
        return await this.sendMessage(message);
    }
    
    async sendDXYUpdate(dxyData, correlation) {
        const message = this.formatDXYMessage(dxyData, correlation);
        return await this.sendMessage(message);
    }
    
    async sendExpectations(expectations) {
        const message = expectations;
        return await this.sendMessage(message);
    }
    
    formatHighImpactMessage(event) {
        const countryFlags = {
            'US': '🇺🇸', 'UK': '🇬🇧', 'EU': '🇪🇺', 'JP': '🇯🇵',
            'CN': '🇨🇳', 'AU': '🇦🇺', 'CA': '🇨🇦', 'CH': '🇨🇭'
        };
        
        const flag = countryFlags[event.country] || '🌍';
        
        return `
🔴 *HIGH IMPACT ALERT* 🔴

${flag} *${event.title}*
${event.country ? `📍 ${event.country}` : ''}

⏰ Time: ${new Date(event.time).toLocaleString()}

📊 *Expectations:*
• Forecast: ${event.expected || 'N/A'}
• Previous: ${event.previous || 'N/A'}

💡 *Expected Market Impact:*
• DXY: High volatility expected
• XAUUSD: Potential $10-20 move
• Major Pairs: Increased spreads

⚡ *Trading Tip:* Wait 15 minutes after release
   Let initial volatility settle before trading

━━━━━━━━━━━━━━━━━━━━━
        `;
    }
    
    formatMarketUpdate(marketData, newsItems, expectations) {
        const lines = [];
        
        lines.push('📊 *DAILY MARKET UPDATE*');
        lines.push(`📅 ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`);
        lines.push(`⏰ ${new Date().toLocaleTimeString()}`);
        lines.push('');
        lines.push('━━━━━━━━━━━━━━━━━━━━━');
        lines.push('');
        
        // XAUUSD
        if (marketData.xau) {
            const changeEmoji = marketData.xau.change >= 0 ? '📈' : '📉';
            lines.push('🥇 *XAUUSD - GOLD*');
            lines.push(`💰 Price: $${marketData.xau.price}`);
            lines.push(`${changeEmoji} Change: ${marketData.xau.change >= 0 ? '+' : ''}${marketData.xau.change}%`);
            lines.push('');
        }
        
        // BTCUSD
        if (marketData.btc) {
            const changeEmoji = marketData.btc.change >= 0 ? '📈' : '📉';
            lines.push('₿ *BTCUSD - BITCOIN*');
            lines.push(`💰 Price: $${marketData.btc.price.toLocaleString()}`);
            lines.push(`${changeEmoji} Change: ${marketData.btc.change >= 0 ? '+' : ''}${marketData.btc.change}%`);
            lines.push('');
        }
        
        lines.push('━━━━━━━━━━━━━━━━━━━━━');
        lines.push('');
        
        // Top News
        if (newsItems && newsItems.length > 0) {
            lines.push('📰 *TOP MARKET NEWS*');
            lines.push('');
            newsItems.slice(0, 3).forEach((item, index) => {
                const impactEmoji = item.impact === 'HIGH' ? '🔴' : item.impact === 'MEDIUM' ? '🟡' : '🟢';
                lines.push(`${index + 1}. ${impactEmoji} *${item.title.substring(0, 80)}*`);
                if (item.description) {
                    lines.push(`   ${item.description.substring(0, 100)}...`);
                }
                lines.push(`   📍 ${item.source}`);
                lines.push('');
            });
        }
        
        lines.push('━━━━━━━━━━━━━━━━━━━━━');
        lines.push('');
        lines.push('🤖 *Bot:* @MarketBotPro');
        lines.push('📊 *More updates coming soon*');
        
        return lines.join('\n');
    }
    
    formatDXYMessage(dxyData, correlation) {
        const trendEmoji = dxyData.indicators.trend.includes('Bullish') ? '📈' : 
                          dxyData.indicators.trend.includes('Bearish') ? '📉' : '➡️';
        
        const changeEmoji = parseFloat(dxyData.change) >= 0 ? '🟢' : '🔴';
        
        return `
📊 *DXY - US DOLLAR INDEX*

💰 Current: ${dxyData.price}
${changeEmoji} Change: ${dxyData.change >= 0 ? '+' : ''}${dxyData.change}%
📈 Range: ${dxyData.low} - ${dxyData.high}

📊 *Technical:*
• RSI: ${dxyData.indicators.rsi}
• Trend: ${trendEmoji} ${dxyData.indicators.trend}
• Support: ${dxyData.indicators.support}
• Resistance: ${dxyData.indicators.resistance}

🔄 *Gold Impact:*
${correlation.prediction}

⚡ *Outlook:* ${correlation.action}
━━━━━━━━━━━━━━━━━━━━━
        `;
    }
    
    addToLog(message, type = 'info') {
        const logContainer = document.getElementById('updateLog');
        if (logContainer) {
            const logEntry = document.createElement('div');
            logEntry.className = 'log-entry';
            const time = new Date().toLocaleTimeString();
            const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
            logEntry.innerHTML = `<span class="log-time">[${time}]</span> ${icon} ${message}`;
            logContainer.insertBefore(logEntry, logContainer.firstChild);
            
            while (logContainer.children.length > 50) {
                logContainer.removeChild(logContainer.lastChild);
            }
        }
    }
}

window.TelegramBot = TelegramBot;
