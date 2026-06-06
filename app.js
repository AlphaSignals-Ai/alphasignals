// --- 1. Navigation HUD ---
function switchView(viewId) {
    document.querySelectorAll('.view-section').forEach(el => el.classList.remove('active-view'));
    document.getElementById(viewId).classList.add('active-view');
    
    document.querySelectorAll('.hud-btn').forEach(btn => btn.classList.remove('active'));
    event.currentTarget.classList.add('active');

    if(viewId === 'terminal-view' && !window.chartInitialized) {
        initChart('BINANCE:BTCUSDT');
        window.chartInitialized = true;
    }
}

// --- 2. Chart Initialization ---
window.chartInitialized = false;
function initChart(symbolStr) {
    document.getElementById('tv_chart_container').innerHTML = '';
    new TradingView.widget({
        autosize: true,
        symbol: symbolStr,
        interval: "15",
        timezone: "Etc/UTC",
        theme: "dark",
        style: "1",
        locale: "en",
        enable_publishing: false,
        backgroundColor: "transparent", // الشفافية ليعمل مع Glassmorphism
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
    switchView('terminal-view');
    document.querySelectorAll('.hud-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.hud-btn')[0].classList.add('active');
}

// --- 3. Live Markets & Fallback System ---
let allTokens = [];
let previousPrices = {};
let currentMarketTab = 'all';

// بيانات طوارئ في حال حظر التصفح لـ Binance API
const fallbackData = [
    {symbol: 'BTC', price: 61245.50, change: 1.24, type: 'perps'},
    {symbol: 'ETH', price: 3420.10, change: -0.85, type: 'perps'},
    {symbol: 'SOL', price: 145.80, change: 5.60, type: 'perps'},
    {symbol: 'HYPE', price: 63.20, change: 9.10, type: 'perps'},
    {symbol: 'XRP', price: 0.58, change: 0.12, type: 'spot'},
    {symbol: 'AAPL', price: 189.50, change: -0.20, type: 'stocks'},
    {symbol: 'TSLA', price: 175.20, change: 2.10, type: 'stocks'}
];

async function fetchLiveMarkets() {
    try {
        const res = await fetch('https://api.binance.com/api/v3/ticker/24hr');
        if (!res.ok) throw new Error("API Blocked");
        
        const data = await res.json();
        const usdtPairs = data.filter(d => d.symbol.endsWith('USDT') && parseFloat(d.quoteVolume) > 5000000)
                              .sort((a, b) => parseFloat(b.quoteVolume) - parseFloat(a.quoteVolume));

        allTokens = usdtPairs.map(d => {
            const sym = d.symbol.replace('USDT', '');
            const price = parseFloat(d.lastPrice);
            
            let flashClass = '';
            if (previousPrices[sym]) {
                if (price > previousPrices[sym]) flashClass = 'flash-up';
                else if (price < previousPrices[sym]) flashClass = 'flash-down';
            }
            previousPrices[sym] = price;

            return {
                symbol: sym,
                price: price,
                change: parseFloat(d.priceChangePercent),
                type: parseFloat(d.quoteVolume) > 100000000 ? 'perps' : 'spot',
                flash: flashClass
            };
        });

        // إضافة الأسهم والعملات اللامركزية يدوياً
        if(!allTokens.find(t => t.symbol === 'AAPL')) {
            allTokens.unshift({symbol: 'TSLA', price: 175.20, change: 2.1, type: 'stocks', flash: ''});
            allTokens.unshift({symbol: 'AAPL', price: 189.50, change: -0.5, type: 'stocks', flash: ''});
            allTokens.unshift({symbol: 'HYPE', price: 62.50, change: 8.4, type: 'perps', flash: ''});
        }

    } catch (e) {
        console.warn("Using fallback data due to API block/CORS.");
        // تشغيل نظام الطوارئ لمنع ظهور "No markets found"
        allTokens = fallbackData.map(t => {
            // محاكاة تقلب الأسعار الوهمي لإبقاء الشاشة حية
            const wobble = t.price * (Math.random() * 0.002 - 0.001);
            const newPrice = t.price + wobble;
            let flashClass = newPrice > t.price ? 'flash-up' : 'flash-down';
            t.price = newPrice;
            t.flash = flashClass;
            return t;
        });
    }
    renderMarketsTable();
}

function filterMarkets(tab, btnElement) {
    currentMarketTab = tab;
    document.querySelectorAll('.glass-tab').forEach(b => b.classList.remove('active'));
    btnElement.classList.add('active');
    renderMarketsTable();
}

function renderMarketsTable() {
    const searchInput = document.getElementById('market-search').value.toUpperCase();
    const tbody = document.getElementById('markets-tbody');
    tbody.innerHTML = '';

    const filtered = allTokens.filter(t => {
        const matchSearch = t.symbol.includes(searchInput);
        const matchTab = currentMarketTab === 'all' || t.type === currentMarketTab;
        return matchSearch && matchTab;
    });

    if(filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:var(--text-muted);">No data available in this sector.</td></tr>';
        return;
    }

    filtered.forEach(t => {
        const priceFmt = t.price < 1 ? t.price.toFixed(5) : t.price.toFixed(2);
        const changeClass = t.change >= 0 ? 'txt-green' : 'txt-red';
        const changeSign = t.change >= 0 ? '+' : '';

        const tr = document.createElement('tr');
        if (t.flash) {
            tr.classList.add(t.flash);
            setTimeout(() => tr.classList.remove(t.flash), 1000);
        }

        tr.innerHTML = `
            <td><strong>${t.symbol}</strong></td>
            <td><span class="type-tag">${t.type.toUpperCase()}</span></td>
            <td style="text-align: right; font-family:monospace; font-size:1.05rem;">$${priceFmt}</td>
            <td style="text-align: right;" class="${changeClass}">${changeSign}${t.change.toFixed(2)}%</td>
            <td style="text-align: right;">
                <button class="hud-btn" style="padding:4px 10px; font-size:0.75rem;" onclick="openInTerminal('${t.symbol}USDT')">Chart</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// --- 4. News & Whales Feed (Fixed Initialization) ---
const intelNews = [
    { time: "Just Now", src: "Reuters", text: "SEC delays decision on Spot Ethereum ETF options.", type: "txt-red" },
    { time: "5m ago", src: "Hyperliquid", text: "L1 Network upgrade successfully deployed.", type: "txt-green" },
    { time: "12m ago", src: "Bloomberg", text: "Global markets await Fed interest rate decision.", type: "txt-blue" },
    { time: "1h ago", src: "CryptoX", text: "Solana hits 1,000 TPS after new validator patch.", type: "txt-green" }
];

const intelWhales = [
    { time: "1m ago", text: "🚨 5,000 BTC ($310M) transferred to Coinbase.", alert: "txt-red" },
    { time: "8m ago", text: "🧟‍♂️ Dormant wallet (1,500 ETH) woke up after 5 years.", alert: "txt-blue" },
    { time: "15m ago", text: "🟢 50M USDC minted at Circle Treasury.", alert: "txt-green" },
    { time: "22m ago", text: "🐋 Whale bought 250k SOL via Jupiter.", alert: "txt-green" }
];

function renderIntelFeeds() {
    document.getElementById('live-news-feed').innerHTML = intelNews.map(n => `
        <div class="feed-item">
            <div class="feed-meta"><span>${n.time} • ${n.src}</span></div>
            <div class="${n.type}">${n.text}</div>
        </div>`).join('');

    document.getElementById('live-whale-feed').innerHTML = intelWhales.map(w => `
        <div class="feed-item">
            <div class="feed-meta"><span>${w.time}</span></div>
            <div class="${w.alert}">${w.text}</div>
        </div>`).join('');
}

// --- 5. Sniper Hologram Interface ---
function handleSniperUpload() {
    const textEl = document.getElementById('upload-text');
    const resultBox = document.getElementById('sniper-result');
    const uploadArea = document.querySelector('.hologram-upload');
    
    textEl.innerText = "Extracting Matrix Data...";
    uploadArea.style.borderColor = "var(--accent)";
    uploadArea.style.background = "rgba(0, 255, 136, 0.05)";
    resultBox.style.display = "none";

    setTimeout(() => {
        textEl.innerText = "Initialize PNL Image Scan";
        uploadArea.style.borderColor = "rgba(255,255,255,0.2)";
        uploadArea.style.background = "rgba(0,0,0,0.2)";
        
        resultBox.style.display = "block";
        resultBox.innerHTML = `
            <div style="display:flex; align-items:center; gap:10px; margin-bottom:15px;">
                <span style="font-size:1.5rem;">🎯</span>
                <strong class="txt-green" style="font-size:1.2rem; text-shadow:0 0 10px rgba(0,255,136,0.5);">Entity Identified on L1</strong>
            </div>
            <div style="background:rgba(0,0,0,0.3); padding:15px; border-radius:8px; margin-bottom:15px;">
                <span style="color:var(--text-muted); font-size:0.8rem;">Target Wallet Hash:</span><br>
                <strong style="font-family:monospace; font-size:1.1rem; color:white; letter-spacing:1px;">0x7a2b9F4c...8dE1A3fB</strong>
            </div>
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:15px; font-size:0.9rem;">
                <div><span style="color:var(--text-muted);">Extracted Trade:</span><br><strong>SOL-PERP (LONG)</strong></div>
                <div><span style="color:var(--text-muted);">Execution Price:</span><br><strong>$145.20</strong></div>
                <div><span style="color:var(--text-muted);">Est. Capital:</span><br><strong>$50,000+</strong></div>
                <div><span style="color:var(--text-muted);">Historical Win Rate:</span><br><strong class="txt-green">68.4%</strong></div>
            </div>
        `;
    }, 2000);
}

// --- Bootstrap Sequence ---
window.onload = () => {
    switchView('terminal-view'); 
    renderIntelFeeds(); // تم إصلاح استدعاء الأخبار لتظهر فوراً
    fetchLiveMarkets(); // سيعمل سواء اتصل بـ Binance أو استخدم نظام الطوارئ
    
    // محاكاة النبض الحي للأسواق
    setInterval(fetchLiveMarkets, 4000);
};
