let tokens = [];

// الاتصال المباشر بـ Hyperliquid API لسحب العملات وأسعارها
async function fetchHyperliquidMarkets() {
    try {
        const response = await fetch('https://api.hyperliquid.xyz/info', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: "metaAndAssetCtxs" })
        });
        const data = await response.json();
        
        const universe = data[0].universe; // أسماء العملات (BTC, ETH, HYPE...)
        const contexts = data[1];          // أسعارها وسيولتها الحية

        tokens = universe.map((u, index) => {
            const ctx = contexts[index];
            const currentPrice = parseFloat(ctx.markPx);
            const prevPrice = parseFloat(ctx.prevDayPx);
            const change = prevPrice > 0 ? ((currentPrice - prevPrice) / prevPrice) * 100 : 0;

            return {
                symbol: u.name,          // مثل: BTC
                name: u.name,
                price: currentPrice,
                change: change,
                volume: parseFloat(ctx.dayNtlVlm),
                type: 'perps'
            };
        }).sort((a, b) => b.volume - a.volume); // ترتيب حسب قوة السيولة

        // تحديث إحصائيات الصفحة
        document.getElementById('asset-count').innerText = `${tokens.length}+`;

        updateTickerBar();
        renderTokens();
        
        // تشغيل البيتكوين أو أول عملة كافتراضي
        if(tokens.length > 0) {
            selectToken(tokens.find(t => t.symbol === 'BTC') || tokens[0]);
        }
    } catch (error) {
        console.error("Hyperliquid API Error:", error);
        document.getElementById('modal-token-list').innerHTML = '<div class="loader-text" style="color: #ff3d00;">Failed to connect to Hyperliquid L1.</div>';
    }
}

function updateTickerBar() {
    const top20 = tokens.slice(0, 20);
    const tickerText = top20.map(t => {
        const sign = t.change >= 0 ? '+' : '';
        return `${t.symbol} $${t.price.toFixed(t.price < 1 ? 4 : 2)} (${sign}${t.change.toFixed(2)}%)`;
    }).join('  •  ');
    document.getElementById('live-ticker-track').innerText = tickerText;
}

function openSearchModal() {
    document.getElementById('search-modal').style.display = 'flex';
    document.getElementById('modal-search-input').focus();
    renderTokens();
}

function closeSearchModal(event) {
    if(event) event.stopPropagation();
    document.getElementById('search-modal').style.display = 'none';
}

function setTab(tabName, btnElement) {
    const tabs = document.getElementsByClassName('tab-btn');
    for(let i=0; i<tabs.length; i++) tabs[i].classList.remove('active');
    btnElement.classList.add('active');
    renderTokens();
}

function renderTokens() {
    const input = document.getElementById('modal-search-input').value.toUpperCase();
    const listContainer = document.getElementById('modal-token-list');
    listContainer.innerHTML = '';

    const filtered = tokens.filter(t => t.symbol.includes(input));

    filtered.forEach(t => {
        const div = document.createElement('div');
        div.className = 'token-item';
        div.onclick = () => selectToken(t);
        
        const priceFmt = t.price < 1 ? t.price.toFixed(5) : t.price.toFixed(2);
        const changeColor = t.change >= 0 ? 'var(--accent)' : 'var(--red)';
        const changeSign = t.change >= 0 ? '+' : '';

        div.innerHTML = `
            <div class="token-symbol-box">
                <span class="token-symbol">${t.symbol}</span>
                <span class="token-type-badge">PERP</span>
            </div>
            <div class="token-price">$${priceFmt}</div>
            <div class="token-change" style="color: ${changeColor}">${changeSign}${t.change.toFixed(2)}%</div>
        `;
        listContainer.appendChild(div);
    });
}

// تحميل شارت TradingView بصورة نقية
function loadChart(coinName) {
    document.getElementById('tv-home-chart').innerHTML = '';
    
    // خدعة هندسية: نحول اسم عملة هايبر ليكويد لصيغة يقبلها الشارت (Binance أو Bybit)
    let tvSymbol = `BINANCE:${coinName}USDT`;
    if (coinName === 'HYPE' || coinName === 'PURR') tvSymbol = `BYBIT:${coinName}USDT`; // HYPE غير موجودة في بينانس

    new TradingView.widget({
        container_id: 'tv-home-chart',
        autosize: true,
        symbol: tvSymbol,
        interval: '15',
        timezone: 'Etc/UTC',
        theme: 'dark',
        style: '1',
        locale: 'en',
        toolbar_bg: '#131a2d',
        enable_publishing: false,
        hide_side_toolbar: false,
        allow_symbol_change: false,
        studies: [] // الشارت نقي وخالي من المؤشرات المزعجة
    });
}

// قلب النظام: سحب سجل الأوامر الحي (L2 Book) من Hyperliquid وتحليله
async function generateAI(token) {
    const aiBox = document.getElementById('ai-signals');
    aiBox.style.display = 'block';
    
    document.getElementById('ai-title').innerText = `AlphaSignals AI: Scanning Hyperliquid L2 Orderbook for ${token.symbol}...`;
    document.getElementById('ai-bias').innerText = "SCANNING...";
    document.getElementById('ai-bias').className = "ai-value";

    try {
        // سحب دفتر الأوامر من Hyperliquid API!
        const res = await fetch('https://api.hyperliquid.xyz/info', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: "l2Book", coin: token.symbol })
        });
        const data = await res.json();
        
        const bids = data.levels[0]; // طلبات الشراء
        const asks = data.levels[1]; // طلبات البيع
        
        let totalBids = 0; bids.forEach(b => totalBids += parseFloat(b.sz) * parseFloat(b.px));
        let totalAsks = 0; asks.forEach(a => totalAsks += parseFloat(a.sz) * parseFloat(a.px));

        const totalVol = totalBids + totalAsks;
        // حساب الضغط المئوي للسيولة
        const bidPercent = totalVol > 0 ? (totalBids / totalVol) * 100 : 50;
        const askPercent = totalVol > 0 ? (totalAsks / totalVol) * 100 : 50;

        // تحديث شريط السيولة المرئي
        document.getElementById('depth-bids-fill').style.width = `${bidPercent}%`;
        document.getElementById('depth-asks-fill').style.width = `${askPercent}%`;
        document.getElementById('bids-text').innerText = `Buying Volume: ${bidPercent.toFixed(1)}%`;
        document.getElementById('asks-text').innerText = `Selling Volume: ${askPercent.toFixed(1)}%`;

        // اتخاذ القرار بناءً على السيولة الحقيقية
        const isLong = bidPercent > askPercent;
        const bias = isLong ? "STRONG LONG" : "STRONG SHORT";
        const entry = token.price;
        
        // كلما زادت السيولة زاد الهدف
        const strength = isLong ? (bidPercent/100) : (askPercent/100);
        const tp = isLong ? entry * (1 + (0.04 * strength)) : entry * (1 - (0.04 * strength));
        const sl = isLong ? entry * 0.985 : entry * 1.015;

        const precision = entry < 1 ? 4 : 2;

        document.getElementById('ai-bias').innerText = bias;
        document.getElementById('ai-bias').className = `ai-value ${isLong ? 'ai-green' : 'ai-red'}`;
        document.getElementById('ai-entry').innerText = `$${entry.toFixed(precision)}`;
        document.getElementById('ai-tp').innerText = `$${tp.toFixed(precision)}`;
        document.getElementById('ai-sl').innerText = `$${sl.toFixed(precision)}`;

    } catch (e) {
        console.error("L2 Book Error:", e);
        document.getElementById('ai-title').innerText = "Data Feed Error. Try again.";
    }
}

function selectToken(token) {
    closeSearchModal();
    document.getElementById('current-search-display').innerText = `${token.symbol} / USD (Perp)`;
    
    loadChart(token.symbol);
    generateAI(token);
}

// التشغيل الفوري
window.onload = function() {
    fetchHyperliquidMarkets();
};
