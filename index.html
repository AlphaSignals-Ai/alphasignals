<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AlphaSignals | Pro Terminal</title>
    <link rel="stylesheet" href="style.css">
    <script src="https://s3.tradingview.com/tv.js"></script>
</head>
<body>
    <nav class="pro-navbar" id="top-nav">
        <div class="logo">AlphaSignals<span class="accent-text">.</span></div>
        <div class="nav-links">
            <button class="nav-tab active" onclick="switchView('terminal-view')">Terminal</button>
            <button class="nav-tab" onclick="switchView('markets-view')">Markets</button>
            <button class="nav-tab" onclick="switchView('sniper-view')">Tracker</button>
        </div>
        <!-- مبدل الألوان (Theme Switcher) -->
        <div class="theme-switcher">
            <button class="theme-dot theme-green" onclick="setTheme('green')" title="Turquoise"></button>
            <button class="theme-dot theme-blue" onclick="setTheme('blue')" title="Ice Blue"></button>
            <button class="theme-dot theme-purple" onclick="setTheme('purple')" title="Purple"></button>
        </div>
    </nav>

    <div class="ticker-bar">
        <div class="ticker-track">
            <span>🚀 Hyperliquid L1 volume surges past $2B.</span>
            <span>⚡ Real-time on-chain tracking activated.</span>
            <span>📊 Live market feeds operating at 1ms latency.</span>
        </div>
    </div>

    <div class="app-container">
        <!-- Terminal View -->
        <div id="terminal-view" class="view-section active-view">
            <div class="terminal-layout">
                <div class="pro-card chart-container">
                    <div id="tv_chart_container"></div>
                </div>
                
                <div class="sidebar-layout">
                    <div class="pro-card flex-card">
                        <div class="card-header">
                            <h3>Live News</h3>
                            <button class="icon-btn" onclick="fetchRealNews()">🔄</button>
                        </div>
                        <div class="feed-content" id="live-news-feed">
                            <div class="loader-text">Fetching news...</div>
                        </div>
                    </div>
                    
                    <div class="pro-card flex-card">
                        <div class="card-header">
                            <h3>Whale Alerts</h3>
                        </div>
                        <div class="feed-content" id="live-whale-feed">
                            <div class="loader-text">Scanning blockchain...</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Markets View -->
        <div id="markets-view" class="view-section">
            <div class="pro-card markets-card">
                <div class="markets-top">
                    <h2>Tokens</h2>
                    <input type="text" id="market-search" class="pro-input" placeholder="Search tokens..." onkeyup="renderMarketsTable()">
                </div>
                <div class="pill-tabs">
                    <button class="pill-btn active" onclick="filterMarkets('all', this)">All</button>
                    <button class="pill-btn" onclick="filterMarkets('perps', this)">Perps</button>
                </div>
                <div class="table-container">
                    <table class="pro-table">
                        <thead>
                            <tr>
                                <th>Asset</th>
                                <th style="text-align: right;">Price</th>
                                <th style="text-align: right;">24h Change</th>
                                <th style="text-align: right;">Chart</th>
                            </tr>
                        </thead>
                        <tbody id="markets-tbody">
                            <tr><td colspan="4" class="loader-text" style="text-align:center;">Syncing...</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <!-- Wallet Tracker View -->
        <div id="sniper-view" class="view-section">
            <div class="tracker-container">
                <div class="pro-card">
                    <div class="card-header" style="justify-content: center; border: none; padding-bottom: 0;">
                        <h2>Track Wallet</h2>
                    </div>
                    <p style="text-align: center; color: var(--text-muted); margin-bottom: 30px; font-size: 0.9rem;">
                        Add any Hyperliquid wallet address to track positions and PnL
                    </p>
                    
                    <div class="input-action-group">
                        <input type="text" id="wallet-input" class="pro-input" placeholder="0x4ec8fe22...">
                        <button class="pro-btn" onclick="trackWallet()">+ Track</button>
                    </div>

                    <div class="divider"><span>OR UPLOAD IMAGE</span></div>

                    <div class="upload-box" onclick="document.getElementById('image-upload').click()">
                        <div class="upload-icon">📷</div>
                        <span id="upload-text">Upload DEX PNL Image</span>
                        <input type="file" id="image-upload" accept="image/*" style="display: none;" onchange="handleSniperUpload()">
                    </div>
                </div>

                <div id="sniper-result" class="result-area" style="display: none;"></div>
            </div>
        </div>
    </div>

    <script src="app.js"></script>
</body>
</html>
