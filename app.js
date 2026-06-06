// 1. تشغيل شارت TradingView النقي والأصلي
function initChart() {
    new TradingView.widget({
        autosize: true,
        symbol: "BINANCE:BTCUSDT",
        interval: "15",
        timezone: "Etc/UTC",
        theme: "dark",
        style: "1",
        locale: "en",
        enable_publishing: false,
        backgroundColor: "#131722",
        gridColor: "#2a2e39",
        hide_top_toolbar: false,
        hide_legend: false,
        save_image: false,
        container_id: "tv_chart_container",
        allow_symbol_change: true, // تفعيل شريط البحث الأصلي الخاص بالشارت
        studies: [] // شارت نقي بدون أي مؤشرات مزعجة
    });
}

// 2. سحب البيانات الحية للوحة القيادة السفلية (Binance API)
let marketData = [];
let watchlist = JSON.parse(localStorage.getItem('alphaWatchlist')) || ['BTCUSDT', 'ETHUSDT', 'SOLUSDT'];

async function fetchMarketData() {
    try {
        const res = await fetch('https://api.binance.com/api/v3/ticker/24hr');
        const data = await res.json();
        marketData = data.filter(d => d.symbol.endsWith('USDT') && parseFloat(d.quoteVolume) > 5000000);
        
        renderDashboard();
    } catch (e) {
        console.log("Error fetching data:", e);
    }
}

function toggleWatchlist(symbol) {
    if (watchlist.includes(symbol)) {
        watchlist = watchlist.filter(s => s !== symbol);
    } else {
        watchlist.push(symbol);
    }
    localStorage.setItem('alphaWatchlist', JSON.stringify(watchlist));
    renderDashboard();
}

function renderDashboard() {
    // Top Gainers
    const gainers = [...marketData].sort((a, b) => b.priceChangePercent - a.priceChangePercent).slice(0, 15);
    document.getElementById('top-gainers').innerHTML = gainers.map(t => createRowHTML(t)).join('');

    // Top Losers
    const losers = [...marketData].sort((a, b) => a.priceChangePercent - b.priceChangePercent).slice(0, 15);
    document.getElementById('top-losers').innerHTML = losers.map(t => createRowHTML(t)).join('');

    // Watchlist
    const watchData = marketData.filter(t => watchlist.includes(t.symbol));
    document.getElementById('watchlist').innerHTML = watchData.length > 0 ? 
        watchData.map(t => createRowHTML(t, true)).join('') : 
        '<div style="padding:10px; color:#787b86;">Watchlist is empty. Click stars to add.</div>';
}

function createRowHTML(token, isWatchlist = false) {
    const symbol = token.symbol.replace('USDT', '');
    const price = parseFloat(token.lastPrice).toFixed(token.lastPrice < 1 ? 4 : 2);
    const change = parseFloat(token.priceChangePercent);
    const colorClass = change >= 0 ? 'text-green' : 'text-red';
    const isStarred = watchlist.includes(token.symbol) ? 'active' : '';

    return `
        <div class="list-item">
            <div>
                <span class="star-btn ${isStarred}" onclick="toggleWatchlist('${token.symbol}')">★</span>
                <strong>${symbol}</strong>
            </div>
            <div>
                <span>$${price}</span>
                <span class="${colorClass}" style="margin-left:8px;">${change > 0 ? '+' : ''}${change.toFixed(2)}%</span>
            </div>
        </div>
    `;
}

// 3. نظام الأخبار الحية ورادار الحيتان (محاكاة احترافية)
const newsItems = [
    { time: "Just Now", src: "Reuters", text: "SEC delays decision on Spot Ethereum ETF options.", sentiment: "bg-red", tag: "BEARISH" },
    { time: "2m ago", src: "On-Chain", text: "Hyperliquid (HYPE) daily volume surpasses $2B.", sentiment: "bg-green", tag: "BULLISH" },
    { time: "15m ago", src: "Bloomberg", text: "Federal Reserve hints at keeping interest rates steady.", sentiment: "bg-neutral", tag: "NEUTRAL" },
    { time: "1h ago", src: "X / Crypto", text: "Solana network congestion resolved after validator update.", sentiment: "bg-green", tag: "BULLISH" }
];

const whaleItems = [
    { time: "1m ago", text: "🚨 4,500 BTC ($285M) transferred from Unknown Wallet to Binance.", type: "text-red" },
    { time: "12m ago", text: "🧟‍♂️ A dormant wallet containing 1,000 ETH just woke up after 8 years.", type: "text-blue" },
    { time: "34m ago", text: "🟢 15,000,000 USDT transferred from Tether Treasury to Kraken.", type: "text-green" }
];

function renderFeeds() {
    document.getElementById('news-feed').innerHTML = newsItems.map(n => `
        <div class="news-item">
            <div class="news-header">
                <span>${n.time} • ${n.src}</span>
                <span class="sentiment-badge ${n.sentiment}">${n.tag}</span>
            </div>
            <div>${n.text}</div>
        </div>
    `).join('');

    document.getElementById('whale-feed').innerHTML = whaleItems.map(w => `
        <div class="whale-item">
            <div class="whale-header"><span>${w.time}</span></div>
            <div class="${w.type}">${w.text}</div>
        </div>
    `).join('');
}

// 4. صائد المحافظ الذكي (Image-to-Wallet Scanner Simulator)
function handleImageUpload() {
    const fileInput = document.getElementById('image-upload');
    const resultBox = document.getElementById('sniper-result');
    const uploadBtn = document.querySelector('.upload-btn');
    
    if (fileInput.files.length > 0) {
        // محاكاة عملية الـ OCR والبحث العكسي في البلوكشين
        uploadBtn.innerText = "🔄 Extracting PNL Data & Searching Blockchain...";
        uploadBtn.style.background = "#2962ff";
        resultBox.style.display = "none";

        setTimeout(() => {
            uploadBtn.innerText = "📸 Upload PNL Image";
            uploadBtn.style.background = "";
            
            // إظهار نتيجة البحث العكسي
            resultBox.style.display = "block";
            resultBox.innerHTML = `
                <strong style="color:#00e676;">✅ Match Found! (Hyperliquid DEX)</strong><br><br>
                <span style="color:#787b86;">Target Wallet:</span><br>
                <strong style="color:white; font-family:monospace; word-break:break-all;">0x7a2b9F4c...8dE1A3fB</strong><br><br>
                <span style="color:#787b86;">Extracted Trade:</span> SOL-PERP (LONG) @ $145.20<br>
                <span style="color:#787b86;">Wallet Win Rate:</span> 68.4%
            `;
        }, 2500); // محاكاة 2.5 ثانية للبحث
    }
}

// التشغيل الأساسي
window.onload = () => {
    initChart();
    fetchMarketData();
    renderFeeds();
    // تحديث الأسعار كل 10 ثوانٍ
    setInterval(fetchMarketData, 10000); 
};
