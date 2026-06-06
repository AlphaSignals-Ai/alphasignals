// --- 1. Navigation Logic ---
function switchView(viewId) {
    // إخفاء جميع النوافذ
    document.querySelectorAll('.view-section').forEach(el => el.classList.remove('active-view'));
    // إظهار النافذة المطلوبة
    document.getElementById(viewId).classList.add('active-view');
    
    // تحديث أزرار القائمة
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    event.currentTarget.classList.add('active');

    // إذا تم فتح نافذة الشارت، تأكد من إعادة رسمه بشكل سليم
    if(viewId === 'terminal-view' && !window.chartInitialized) {
        initChart('BINANCE:BTCUSDT');
        window.chartInitialized = true;
    }
}

// --- 2. Chart Logic ---
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
        backgroundColor: "#131722",
        gridColor: "#2a2e39",
        hide_top_toolbar: false,
        allow_symbol_change: true,
        save_image: false,
        container_id: "tv_chart_container",
        studies: [] 
    });
}

// عند الضغط على "شارت" من صفحة الأسواق، يذهب للترمينال ويفتح العملة
function openInTerminal(symbol) {
    initChart(`BINANCE:${symbol}`);
    switchView('terminal-view');
    
    // تحديث الزر النشط في القائمة برمجياً
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.nav-btn')[0].classList.add('active');
}

// --- 3. Live Markets Logic (Hyperliquid Style) ---
let allTokens = [];
let previousPrices = {};
let currentMarketTab = 'all';

async function fetchLiveMarkets() {
    try {
        const res = await fetch('https://api.binance.com/api/v3/ticker/24hr');
        const data = await res.json();
        
        // استخراج وتصنيف العملات
        const usdtPairs = data.filter(d => d.symbol.endsWith('USDT') && parseFloat(d.quoteVolume) > 5000000)
                              .sort((a, b) => parseFloat(b.quoteVolume) - parseFloat(a.quoteVolume));

        allTokens = usdtPairs.map(d => {
            const sym = d.symbol.replace('USDT', '');
            const price = parseFloat(d.lastPrice);
            
            // تحقق مما إذا كان السعر صعد أم هبط للومضات الحية
            let flashClass = '';
            if (previousPrices[sym]) {
                if (price > previousPrices[sym]) flashClass = 'flash-up';
                else if (price < previousPrices[sym]) flashClass = 'flash-down';
            }
            previousPrices[sym] = price;

            return {
                symbol: sym,
                fullSymbol: d.symbol,
                price: price,
                change: parseFloat(d.priceChangePercent),
                type: parseFloat(d.quoteVolume) > 100000000 ? 'perps' : 'spot', // تصنيف ذكي
                flash: flashClass
            };
        });

        // إضافة أسهم يدوية كأمثلة
        if(!allTokens.find(t => t.symbol === 'AAPL')) {
            allTokens.unshift({symbol: 'TSLA', fullSymbol: 'NASDAQ:TSLA', price: 175.20, change: 2.1, type: 'stocks', flash: ''});
            allTokens.unshift({symbol: 'AAPL', fullSymbol: 'NASDAQ:AAPL', price: 189.50, change: -0.5, type: 'stocks', flash: ''});
            allTokens.unshift({symbol: 'HYPE', fullSymbol: 'BYBIT:HYPEUSDT', price: 62.50, change: 8.4, type: 'perps', flash: ''});
        }

        renderMarketsTable();
    } catch (e) {
        console.error("Market API Error", e);
    }
}

function filterMarkets(tab, btnElement) {
    currentMarketTab = tab;
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
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
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:#787b86;">No markets found</td></tr>';
        return;
    }

    filtered.forEach(t => {
        const priceFmt = t.price < 1 ? t.price.toFixed(5) : t.price.toFixed(2);
        const changeClass = t.change >= 0 ? 'text-green' : 'text-red';
        const changeSign = t.change >= 0 ? '+' : '';
        const typeBadge = `<span style="background:#2A2E39; padding:2px 6px; border-radius:4px; font-size:0.65rem; text-transform:uppercase;">${t.type}</span>`;

        const tr = document.createElement('tr');
        // تفعيل الأنيميشن إذا كان موجوداً
        if (t.flash) {
            tr.classList.add(t.flash);
            // إزالة الكلاس بعد انتهاء الأنيميشن ليعمل في التحديث القادم
            setTimeout(() => tr.classList.remove(t.flash), 1000);
        }

        tr.innerHTML = `
            <td><strong>${t.symbol}</strong></td>
            <td>${typeBadge}</td>
            <td style="text-align: right; font-weight:bold;">$${priceFmt}</td>
            <td style="text-align: right;" class="${changeClass}">${changeSign}${t.change.toFixed(2)}%</td>
            <td style="text-align: right;">
                <button class="btn-chart" onclick="openInTerminal('${t.symbol}USDT')">View Chart</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// --- 4. News & Whales Feed Simulator ---
const intelNews = [
    { time: "Just Now", src: "Reuters", text: "SEC delays decision on Spot Ethereum ETF.", type: "bearish" },
    { time: "5m ago", src: "Hyperliquid", text: "L1 Network upgrade successfully deployed.", type: "bullish" },
    { time: "12m ago", src: "Bloomberg", text: "Global markets await Fed interest rate decision.", type: "" },
    { time: "1h ago", src: "CryptoX", text: "Solana hits 1,000 TPS after new validator patch.", type: "bullish" }
];

const intelWhales = [
    { time: "1m ago", text: "🚨 5,000 BTC ($310M) transferred from Unknown to Coinbase.", alert: "red" },
    { time: "8m ago", text: "🧟‍♂️ Dormant wallet containing 1,500 ETH woke up after 5 years.", alert: "blue" },
    { time: "15m ago", text: "🟢 50,000,000 USDC minted at Circle Treasury.", alert: "green" },
    { time: "22m ago", text: "🐋 Whale bought 250,000 SOL via Jupiter Aggregator.", alert: "green" }
];

function renderIntelFeeds() {
    // News
    document.getElementById('live-news-feed').innerHTML = intelNews.map(n => {
        let badge = '';
        if(n.type === 'bullish') badge = '<span class="badge bullish">BULLISH</span>';
        if(n.type === 'bearish') badge = '<span class="badge bearish">BEARISH</span>';
        
        return `
        <div class="intel-item">
            <div class="intel-meta">
                <span>${n.time} • ${n.src}</span>
                ${badge}
            </div>
            <div style="color:white;">${n.text}</div>
        </div>`;
    }).join('');

    // Whales
    document.getElementById('live-whale-feed').innerHTML = intelWhales.map(w => {
        let colorClass = w.alert === 'red' ? 'text-red' : (w.alert === 'green' ? 'text-green' : 'text-blue');
        return `
        <div class="intel-item">
            <div class="intel-meta"><span>${w.time}</span></div>
            <div class="${colorClass}" style="font-weight:500;">${w.text}</div>
        </div>`;
    }).join('');
}

// --- 5. Sniper Tool Logic ---
function handleSniperUpload() {
    const textEl = document.getElementById('upload-text');
    const resultBox = document.getElementById('sniper-result');
    const uploadArea = document.querySelector('.upload-area');
    
    textEl.innerText = "🔄 Scanning PNL Image Data & Querying Blockchain...";
    uploadArea.style.borderColor = "#2962ff";
    resultBox.style.display = "none";

    // محاكاة عملية التحقيق المعقدة
    setTimeout(() => {
        textEl.innerText = "📸 Click to Upload PNL Image";
        uploadArea.style.borderColor = "var(--border)";
        
        resultBox.style.display = "block";
        resultBox.innerHTML = `
            <div style="display:flex; align-items:center; gap:10px; margin-bottom:15px;">
                <span style="font-size:1.5rem;">🎯</span>
                <strong class="text-green" style="font-size:1.2rem;">Match Found in Hyperliquid L1!</strong>
            </div>
            <div style="background:var(--bg); padding:15px; border-radius:6px; margin-bottom:10px; border:1px solid var(--border);">
                <span style="color:var(--muted); font-size:0.8rem; display:block; margin-bottom:5px;">Target Wallet Address:</span>
                <strong style="color:white; font-family:monospace; font-size:1.1rem; word-break:break-all;">0x7a2b9F4c...8dE1A3fB</strong>
            </div>
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; font-size:0.85rem;">
                <div><span style="color:var(--muted);">Extracted Trade:</span><br><strong style="color:white;">SOL-PERP (LONG)</strong></div>
                <div><span style="color:var(--muted);">Entry Price:</span><br><strong style="color:white;">$145.20</strong></div>
                <div><span style="color:var(--muted);">Estimated Size:</span><br><strong style="color:white;">$50,000+</strong></div>
                <div><span style="color:var(--muted);">Wallet Win Rate:</span><br><strong class="text-green">68.4%</strong></div>
            </div>
        `;
    }, 2500);
}

// --- Initialization ---
window.onload = () => {
    switchView('terminal-view'); // فتح نافذة الشارت كافتراضي
    renderIntelFeeds();
    fetchLiveMarkets();
    
    // تحديث الأسواق كل 5 ثواني لتعطي نبض الحياة والألوان
    setInterval(fetchLiveMarkets, 5000);
};
