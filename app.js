// قاعدة بيانات مصغرة للعملات
const tokens = [
    { symbol: "BTCUSDT", name: "Bitcoin", price: 63120, exchange: "BINANCE" },
    { symbol: "ETHUSDT", name: "Ethereum", price: 3450, exchange: "BINANCE" },
    { symbol: "SOLUSDT", name: "Solana", price: 165, exchange: "BINANCE" },
    { symbol: "WLDUSDT", name: "Worldcoin", price: 0.4920, exchange: "BINANCE" },
    { symbol: "HYPEUSDT", name: "Hyperliquid", price: 62.50, exchange: "BYBIT" },
    { symbol: "DOGEUSDT", name: "Dogecoin", price: 0.12, exchange: "BINANCE" }
];

// دالة الفلترة الذكية لمحرك البحث
function filterTokens() {
    const input = document.getElementById('search').value.toUpperCase();
    const dd = document.getElementById('dropdown');
    dd.innerHTML = ''; // تفريغ القائمة
    
    if (input.length === 0) {
        dd.style.display = 'none';
        return;
    }

    const filtered = tokens.filter(t => t.symbol.includes(input) || t.name.toUpperCase().includes(input));
    
    if (filtered.length > 0) {
        dd.style.display = 'block';
        filtered.forEach(t => {
            const div = document.createElement('div');
            div.className = 'item';
            div.innerHTML = `<strong>${t.symbol.replace("USDT", "")}</strong> <span style="color:#8b9bb4; font-size:0.9em;">— ${t.name}</span>`;
            div.onclick = () => selectToken(t);
            dd.appendChild(div);
        });
    } else {
        dd.style.display = 'none';
    }
}

// دالة تحديث الشارت
function loadChart(symbolConfig) {
    document.getElementById('tv-home-chart').innerHTML = '';
    new TradingView.widget({
        container_id: 'tv-home-chart',
        autosize: true,
        symbol: symbolConfig,
        interval: '15',
        timezone: 'Etc/UTC',
        theme: 'dark',
        style: '1',
        locale: 'en',
        toolbar_bg: '#131a2d',
        enable_publishing: false,
        hide_side_toolbar: false,
        allow_symbol_change: false,
        studies: ["RSI@tv-basicstudies"]
    });
}

// دالة الذكاء الاصطناعي لحساب الأهداف
function generateAI(token) {
    const aiBox = document.getElementById('ai-signals');
    aiBox.style.display = 'block';
    
    // تحديث العنوان
    document.getElementById('ai-title').innerText = `AlphaSignals AI: Analyzing ${token.name} (${token.symbol.replace("USDT", " / USDT")})...`;
    
    // محاكاة حسابات الأهداف (TP/SL)
    const isLong = Math.random() > 0.4;
    const bias = isLong ? "LONG ENTRY" : "SHORT ENTRY";
    const entry = token.price;
    const tp = isLong ? entry * 1.03 : entry * 0.97;
    const sl = isLong ? entry * 0.985 : entry * 1.015;

    const precision = entry < 1 ? 4 : 2;

    // حقن البيانات في الواجهة
    const biasEl = document.getElementById('ai-bias');
    biasEl.innerText = bias;
    biasEl.className = `ai-value ${isLong ? 'ai-green' : 'ai-red'}`;
    
    document.getElementById('ai-entry').innerText = `$${entry.toFixed(precision)}`;
    document.getElementById('ai-tp').innerText = `$${tp.toFixed(precision)}`;
    document.getElementById('ai-sl').innerText = `$${sl.toFixed(precision)}`;
}

// دالة تنفيذ الاختيار من القائمة المنسدلة
function selectToken(token) {
    document.getElementById('search').value = token.symbol.replace("USDT", "");
    document.getElementById('dropdown').style.display = 'none';
    
    const tvSymbol = `${token.exchange}:${token.symbol}`;
    
    // تحديث الواجهة فوراً
    loadChart(tvSymbol);
    generateAI(token);
}

// التحميل الافتراضي عند فتح الموقع (البيتكوين)
window.onload = function() {
    if(window.TradingView) {
        selectToken(tokens[0]); // تحميل BTC افتراضياً
    }
}
