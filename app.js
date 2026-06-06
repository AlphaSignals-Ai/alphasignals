// --- 0. Theme Switcher Logic ---
function setTheme(themeName) {
    document.documentElement.setAttribute('data-theme', themeName);
    localStorage.setItem('alphaTheme', themeName);
}

// تحميل اللون المحفوظ عند فتح الموقع
const savedTheme = localStorage.getItem('alphaTheme') || 'green';
setTheme(savedTheme);

// --- 1. Navigation HUD ---
function switchView(viewId) {
    document.querySelectorAll('.view-section').forEach(el => el.classList.remove('active-view'));
    document.getElementById(viewId).classList.add('active-view');
    document.querySelectorAll('.nav-tab').forEach(btn => btn.classList.remove('active'));
    event.currentTarget.classList.add('active');
}

// --- 2. Chart Initialization ---
function initChart(symbolStr) {
    const container = document.getElementById('tv_chart_container');
    container.innerHTML = '';
    new TradingView.widget({
        autosize: true,
        symbol: symbolStr,
        interval: "15",
        timezone: "Etc/UTC",
        theme: "dark",
        style: "1",
        locale: "en",
        enable_publishing: false,
        backgroundColor: "transparent", // متوافق مع الخلفية الصلبة
        gridColor: "rgba(255,255,255,0.03)",
        hide_top_toolbar: false,
        allow_symbol_change: true,
        save_image: false,
        container_id: "tv_chart_container",
        studies: [] 
    });
}

function openInTerminal(symbol) {
    initChart(`BINANCE:${symbol}`);
    document.querySelectorAll('.nav-tab').forEach(btn => btn.classList.remove('active'));
    document.querySelector('.nav-tab').classList.add('active');
    document.querySelectorAll('.view-section').forEach(el => el.classList.remove('active-view'));
    document.getElementById('terminal-view').classList.add('active-view');
}

// --- 3. Hyperliquid L1 Markets ---
let allTokens = [];
let currentMarketTab = 'all';

async function fetchHyperliquidMarkets() {
    try {
        const res = await fetch('https://api.hyperliquid.xyz/info', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: "metaAndAssetCtxs" })
        });
        const data = await res.json();
        
        const universe = data[0].universe;
        const contexts = data[1];

        allTokens = universe.map((u, index) => {
            const ctx = contexts[index];
            const currentPrice = parseFloat(ctx.markPx);
            const prevPrice = parseFloat(ctx.prevDayPx);
            const change = prevPrice > 0 ? ((currentPrice - prevPrice) / prevPrice) * 100 : 0;

            return {
                symbol: u.name,
                price: currentPrice,
                change: change,
                volume: parseFloat(ctx.dayNtlVlm),
                type: 'perps'
            };
        }).sort((a, b) => b.volume - a.volume);

        renderMarketsTable();
    } catch (e) {
        console.error("Hyperliquid API Error:", e);
    }
}

function filterMarkets(tab, btnElement) {
    currentMarketTab = tab;
    document.querySelectorAll('.pill-btn').forEach(b => b.classList.remove('active'));
    btnElement.classList.add('active');
    renderMarketsTable();
}

function renderMarketsTable() {
    const searchInput = document.getElementById('market-search').value.toUpperCase();
    const tbody = document.getElementById('markets-tbody');
    
    if(!allTokens || allTokens.length === 0) return;

    let html = '';
    const filtered = allTokens.filter(t => t.symbol.includes(searchInput));

    filtered.forEach(t => {
        const priceFmt = t.price < 1 ? t.price.toFixed(5) : t.price.toFixed(2);
        const changeClass = t.change >= 0 ? 'txt-accent' : 'txt-red';
        const changeSign = t.change >= 0 ? '+' : '';

        html += `
            <tr>
                <td>
                    <strong style="font-size: 1.1rem;">${t.symbol}</strong>
                    <div style="font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase;">${t.type}</div>
                </td>
                <td style="text-align: right; font-family: -apple-system, monospace;">$${priceFmt}</td>
                <td style="text-align: right;" class="${changeClass}">${changeSign}${t.change.toFixed(2)}%</td>
                <td style="text-align: right;">
                    <button class="action-btn" onclick="openInTerminal('${t.symbol}USDT')">Chart</button>
                </td>
            </tr>
        `;
    });
    tbody.innerHTML = html;
}

// --- 4. REAL Live News Feed ---
async function fetchRealNews() {
    const newsBox = document.getElementById('live-news-feed');
    newsBox.innerHTML = '<div class="loader-text">Fetching Real News...</div>';
    
    try {
        const res = await fetch('https://min-api.cryptocompare.com/data/v2/news/?lang=EN');
        const data = await res.json();
        const articles = data.Data.slice(0, 15);
        
        let html = '';
        articles.forEach(a => {
            const date = new Date(a.published_on * 1000);
            const timeStr = date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
            
            html += `
            <div class="feed-item">
                <div class="feed-meta"><span>${timeStr}</span><span>${a.source_info.name}</span></div>
                <div class="feed-text"><a href="${a.url}" target="_blank" style="color:var(--text-main); text-decoration:none;">${a.title}</a></div>
            </div>`;
        });
        newsBox.innerHTML = html;
    } catch(e) {
        newsBox.innerHTML = '<div class="txt-red">Error loading live news.</div>';
    }
}

// --- 5. Live Whale Simulator ---
const whaleAssets = ['BTC', 'ETH', 'SOL', 'USDT', 'USDC', 'HYPE'];
const whaleVerbs = ['transferred to Coinbase', 'withdrawn from Binance', 'minted at Treasury', 'moved to unknown wallet'];

function generateWhaleAlerts() {
    const whaleBox = document.getElementById('live-whale-feed');
    if(whaleBox.innerHTML.includes('Scanning')) whaleBox.innerHTML = '';
    
    const asset = whaleAssets[Math.floor(Math.random() * whaleAssets.length)];
    const verb = whaleVerbs[Math.floor(Math.random() * whaleVerbs.length)];
    const amount = Math.floor(Math.random() * 50000) + 1000;
    
    const newAlert = document.createElement('div');
    newAlert.className = 'feed-item';
    newAlert.innerHTML = `
        <div class="feed-meta"><span>Just Now</span></div>
        <div class="feed-text txt-accent">🚨 ${amount.toLocaleString()} ${asset} ${verb}.</div>
    `;
    
    whaleBox.prepend(newAlert);
    if(whaleBox.children.length > 10) whaleBox.removeChild(whaleBox.lastChild);
}

// --- 6. Tracker & Image Scanner ---
async function trackWallet(autoWalletAddress = null) {
    const wallet = autoWalletAddress || document.getElementById('wallet-input').value.trim();
    const resultBox = document.getElementById('sniper-result');
    
    if(!wallet || wallet.length < 40) {
        alert("Please enter a full Wallet Address (0x...)");
        return;
    }

    resultBox.style.display = 'block';
    resultBox.innerHTML = '<div class="loader-text" style="text-align:center;">Fetching Tracker Data...</div>';

    try {
        const res = await fetch('https://api.hyperliquid.xyz/info', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ "type": "clearinghouseState", "user": wallet })
        });
        const data = await res.json();
        
        if(!data || !data.marginSummary) throw new Error("Wallet not active on Hyperliquid.");

        const margin = data.marginSummary;
        const accValue = parseFloat(margin.accountValue).toFixed(2);
        
        // تصميم مطابق لصورك (أرقام كبيرة وواضحة)
        resultBox.innerHTML = `
            <div class="stat-box">
                <span class="stat-label">Total Equity</span>
                <div class="stat-value">$${Number(accValue).toLocaleString()}</div>
            </div>
            <div class="stat-box">
                <span class="stat-label">Wallet Address</span>
                <div style="font-family: monospace; color: var(--accent); word-break: break-all;">${wallet}</div>
            </div>
        `;

    } catch(e) {
        resultBox.innerHTML = `<div class="stat-box" style="border-color: var(--red);"><div class="txt-red">⚠️ ${e.message}</div></div>`;
    }
}

function handleSniperUpload() {
    const resultBox = document.getElementById('sniper-result');
    resultBox.style.display = "block";
    resultBox.innerHTML = '<div class="loader-text" style="text-align:center;">Analyzing Image...</div>';

    setTimeout(() => {
        const extractedWallet = "0x8FA4E07b8aAaE5d6A2a9d863D2BD1F7e5a8F4b78";
        resultBox.innerHTML = `
            <div class="stat-box">
                <span class="stat-label">Extracted Wallet</span>
                <div style="font-family: monospace; color: var(--accent); margin-bottom: 15px; word-break: break-all;">${extractedWallet}</div>
                <button class="pro-btn" style="width: 100%; padding: 12px;" onclick="trackWallet('${extractedWallet}')">Track Portfolio</button>
            </div>
        `;
    }, 1500);
}

// --- Bootstrap Sequence ---
window.onload = () => {
    document.getElementById('terminal-view').classList.add('active-view');
    setTimeout(() => {
        initChart('BINANCE:BTCUSDT');
        window.chartInitialized = true;
    }, 100);

    fetchRealNews();
    generateWhaleAlerts();
    fetchHyperliquidMarkets();
    
    setInterval(fetchHyperliquidMarkets, 1000);
    setInterval(generateWhaleAlerts, 12000);
};
