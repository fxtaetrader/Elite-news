class MarketBot {
    constructor() {
        console.log("Initializing Market Bot Pro...");
        this.dataFetcher = new MarketDataFetcher();
        this.forexFactory = new ForexFactoryScraper();
        this.dxyTracker = new DXYTracker();
        this.signals = new MarketSignals();
        this.telegramBot = new TelegramBot();
        this.updateInterval = null;
        
        this.init();
    }
    
    async init() {
        this.updateStatus('initializing');
        this.setupEventListeners();
        this.startScheduler();
        
        // Test connection
        await this.telegramBot.sendMessage("🤖 *Market Bot Pro Online*\n\nBot is active and monitoring markets!");
        
        // Initial update
        await this.performFullUpdate();
        
        // Check for high impact news
        await this.checkHighImpactNews();
        
        this.updateStatus('active');
        console.log("Bot initialization complete!");
    }
    
    setupEventListeners() {
        document.getElementById('manualUpdateBtn')?.addEventListener('click', () => {
            this.performFullUpdate(true);
        });
        
        document.getElementById('testNewsBtn')?.addEventListener('click', () => {
            this.testHighImpactAlert();
        });
        
        document.getElementById('updateFrequency')?.addEventListener('change', (e) => {
            localStorage.setItem('updateFrequency', e.target.value);
            this.startScheduler();
        });
        
        // Load saved settings
        const savedFreq = localStorage.getItem('updateFrequency');
        if (savedFreq && document.getElementById('updateFrequency')) {
            document.getElementById('updateFrequency').value = savedFreq;
        }
    }
    
    startScheduler() {
        if (this.updateInterval) clearInterval(this.updateInterval);
        
        const frequency = document.getElementById('updateFrequency')?.value || 'daily';
        let intervalMinutes = 60;
        
        switch(frequency) {
            case 'hourly': intervalMinutes = 60; break;
            case 'daily': intervalMinutes = 1440; break;
            case 'manual': return;
        }
        
        this.updateInterval = setInterval(() => {
            this.performFullUpdate();
        }, intervalMinutes * 60 * 1000);
        
        // Also check for high impact news every 30 minutes
        setInterval(() => {
            this.checkHighImpactNews();
        }, 30 * 60 * 1000);
        
        console.log(`Scheduler set to every ${intervalMinutes} minutes`);
    }
    
    async performFullUpdate() {
        console.log("Starting full market update...");
        this.updateStatus('updating');
        
        try {
            // Fetch all data
            const [xauData, btcData, dxyData, otherMarkets, xauNews, btcNews] = await Promise.all([
                this.dataFetcher.fetchXAUUSD(),
                this.dataFetcher.fetchBTCUSD(),
                this.dxyTracker.fetchDXY(),
                this.dataFetcher.fetchOtherMarkets(),
                this.dataFetcher.fetchMarketNews('XAUUSD'),
                this.dataFetcher.fetchMarketNews('BTCUSD')
            ]);
            
            const allNews = [...xauNews, ...btcNews];
            const marketData = { xau: xauData, btc: btcData, dxy: dxyData, majorPairs: otherMarkets };
            
            // Generate expectations
            const expectations = await this.signals.generateExpectations(marketData);
            
            // Calculate correlation
            const correlation = this.dxyTracker.calculateGoldCorrelation(dxyData, xauData);
            
            // Update UI
            this.updateUI(marketData, allNews, expectations, correlation);
            
            // Send to Telegram (multiple messages)
            const sendHighImpact = document.getElementById('sendHighImpact')?.checked;
            const includeDXY = document.getElementById('includeDXY')?.checked;
            
            // Send main market update
            await this.telegramBot.sendMarketUpdate(marketData, allNews, expectations);
            
            // Send DXY update if enabled
            if (includeDXY) {
                await this.telegramBot.sendDXYUpdate(dxyData, correlation);
            }
            
            // Send expectations separately
            const expectationsMessage = this.signals.formatExpectationsMessage(expectations);
            await this.telegramBot.sendExpectations(expectationsMessage);
            
            this.telegramBot.addToLog("✅ Full market update sent successfully", 'success');
            this.updateStatus('active');
            
        } catch (error) {
            console.error('Update failed:', error);
            this.updateStatus('error', error.message);
            this.telegramBot.addToLog(`❌ Update failed: ${error.message}`, 'error');
        }
    }
    
    async checkHighImpactNews() {
        console.log("Checking for high impact news...");
        
        try {
            const highImpactEvents = await this.forexFactory.fetchHighImpactNews();
            const upcomingEvents = await this.forexFactory.fetchUpcomingEvents(4); // Next 4 hours
            
            if (upcomingEvents && upcomingEvents.length > 0) {
                const sendHighImpact = document.getElementById('sendHighImpact')?.checked;
                
                if (sendHighImpact) {
                    for (const event of upcomingEvents) {
                        await this.telegramBot.sendHighImpactAlert(event);
                        this.telegramBot.addToLog(`🔴 Sent alert: ${event.title}`, 'success');
                        // Wait 2 seconds between messages
                        await new Promise(resolve => setTimeout(resolve, 2000));
                    }
                }
            }
            
            // Update UI with news
            this.updateNewsUI(highImpactEvents);
            
        } catch (error) {
            console.error("Error checking high impact news:", error);
        }
    }
    
    async testHighImpactAlert() {
        const mockEvent = {
            title: "TEST: Federal Reserve Speech",
            country: "US",
            currency: "USD",
            impact: "HIGH",
            time: new Date().toISOString(),
            expected: "Hawkish tone expected",
            previous: "Neutral stance"
        };
        
        await this.telegramBot.sendHighImpactAlert(mockEvent);
        this.telegramBot.addToLog("📰 Test news alert sent", 'success');
    }
    
    updateUI(marketData, newsItems, expectations, correlation) {
        // Update XAUUSD
        const xauPriceEl = document.querySelector('#xauPrice .price');
        const xauChangeEl = document.querySelector('#xauPrice .change');
        if (xauPriceEl) xauPriceEl.textContent = `$${marketData.xau.price}`;
        if (xauChangeEl) {
            xauChangeEl.textContent = `${marketData.xau.change >= 0 ? '+' : ''}${marketData.xau.change}%`;
            xauChangeEl.className = `change ${marketData.xau.change >= 0 ? 'positive' : 'negative'}`;
        }
        
        // Update BTCUSD
        const btcPriceEl = document.querySelector('#btcPrice .price');
        const btcChangeEl = document.querySelector('#btcPrice .change');
        if (btcPriceEl) btcPriceEl.textContent = `$${marketData.btc.price.toLocaleString()}`;
        if (btcChangeEl) {
            btcChangeEl.textContent = `${marketData.btc.change >= 0 ? '+' : ''}${marketData.btc.change}%`;
            btcChangeEl.className = `change ${marketData.btc.change >= 0 ? 'positive' : 'negative'}`;
        }
        
        // Update DXY
        const dxyPriceEl = document.querySelector('#dxyPrice .price');
        const dxyChangeEl = document.querySelector('#dxyPrice .change');
        if (dxyPriceEl) dxyPriceEl.textContent = marketData.dxy.price;
        if (dxyChangeEl) {
            dxyChangeEl.textContent = `${marketData.dxy.change >= 0 ? '+' : ''}${marketData.dxy.change}%`;
            dxyChangeEl.className = `change ${marketData.dxy.change >= 0 ? 'positive' : 'negative'}`;
        }
        
        // Update correlation
        const correlationEl = document.querySelector('.correlation-value');
        if (correlationEl) {
            correlationEl.innerHTML = `
                <div class="correlation-info">
                    <p>📊 Correlation: ${correlation.interpretation}</p>
                    <p>${correlation.prediction}</p>
                    <p>⚡ ${correlation.action}</p>
                </div>
            `;
        }
        
        // Update expectations in UI
        const expectationsEl = document.getElementById('marketExpectations');
        if (expectationsEl && expectations) {
            expectationsEl.innerHTML = `
                <div class="expectation-card">
                    <h4>🥇 XAUUSD: ${expectations.xauusd.direction} (${expectations.xauusd.strength})</h4>
                    <p>${expectations.xauusd.expectation}</p>
                </div>
                <div class="expectation-card">
                    <h4>₿ BTCUSD: ${expectations.btcusd.direction} (${expectations.btcusd.strength})</h4>
                    <p>${expectations.btcusd.expectation}</p>
                </div>
                <div class="expectation-card">
                    <h4>📊 Overall Outlook</h4>
                    <p>${expectations.overall.outlook}</p>
                    <p>Risk Level: ${expectations.overall.riskLevel}</p>
                </div>
            `;
        }
    }
    
    updateNewsUI(events) {
        const newsContainer = document.getElementById('forexFactoryNews');
        if (newsContainer && events && events.length > 0) {
            newsContainer.innerHTML = events.map(event => `
                <div class="news-card high-impact">
                    <div class="news-header">
                        <span class="impact-badge">🔴 HIGH IMPACT</span>
                        <span class="news-time">${new Date(event.time).toLocaleTimeString()}</span>
                    </div>
                    <div class="news-title">${event.title}</div>
                    <div class="news-details">
                        <span>📊 Expected: ${event.expected || 'N/A'}</span>
                        <span>📈 Previous: ${event.previous || 'N/A'}</span>
                    </div>
                </div>
            `).join('');
        }
    }
    
    updateStatus(status, errorMsg = null) {
        const statusText = document.getElementById('statusText');
        const dot = document.querySelector('.dot');
        
        if (!statusText) return;
        
        switch(status) {
            case 'initializing':
                statusText.textContent = 'Initializing...';
                if (dot) dot.style.background = '#ff9800';
                break;
            case 'active':
                statusText.textContent = 'Active - Monitoring Markets';
                if (dot) dot.style.background = '#4caf50';
                break;
            case 'updating':
                statusText.textContent = 'Updating...';
                if (dot) dot.style.background = '#2196f3';
                break;
            case 'error':
                statusText.textContent = `Error: ${errorMsg || 'Unknown'}`;
                if (dot) dot.style.background = '#f44336';
                break;
        }
    }
}

// Initialize bot
document.addEventListener('DOMContentLoaded', () => {
    window.marketBot = new MarketBot();
});
