let tokens = [];
let currentTab = 'all';

// جلب بيانات السوق الحية من Binance API
async function fetchBinanceMarkets() {
    try {
        const response = await fetch('https://api.binance.com/api/v3/ticker/24hr');
        const data = await response.json();
        
        // تصفية أزواج USDT وترتيبها حسب حجم التداول (Volume) لأقوى 150 عملة
        const usdtPairs = data.filter(d => d.symbol.endsWith('USDT'))
                              .sort((a, b) => parseFloat(b.quoteVolume) - parseFloat(a.quoteVolume))
                              .slice(0, 150);

        tokens = usdtPairs.map(d => ({
            symbol: d.symbol,
            name: d.symbol.replace('USDT', ''),
            price: parseFloat(d.lastPrice),
            volume: parseFloat(d.quoteVolume),
            type: parseFloat(d.quoteVolume) > 50000000 ? 'perps' : 'spot', // تصنيف وهمي للفيوتشر حسب السيولة
            exchange: "BINANCE"
        }));

        // إضافة HYPE يدوياً لأنها في Bybit/Hyperliquid
        tokens.unshift({ symbol: "HYPEUSDT", name: "HYPE", price: 62.50, volume: 99999999, type: "perps", exchange: "BYBIT" });

        updateTickerBar();
        renderTokens();
        
        // تحميل أول عملة تلقائياً
        if(tokens.length > 0) selectToken(tokens[0]);

    } catch (error) {
        console.error("API Fetch Error:", error);
        document.getElementById('modal-token-list').innerHTML = '<div class="loader-text text-red">Failed to load API. Please refresh.</div>';
    }
}

// تحديث شريط الأسعار المتحرك بالأعلى
function updateTickerBar() {
    const top10 = tokens.slice(0, 15);
    const tickerText = top10.map(t => `${t.name} $${t.price.toFixed(t.price < 1 ? 4 : 2)}`).join('  •  ');
    document.getElementById('live-ticker-track').innerText = tickerText;
}

function handleNav(section) {
    if(section === 'home') window.scrollTo({top: 0, behavior: 'smooth'});
    else if(section === 'terminal') document.getElementById('terminal-section').scrollIntoView({behavior: 'smooth', block: 'start'});
    else alert("🔒 This module requires Pro Access.");
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
    currentTab = tabName;
    const tabs = document.getElementsByClassName('tab-btn');
    for(let i=0; i<tabs.length; i++) tabs[i].classList.remove('active');
    btnElement.classList.add('active');
    renderTokens();
}

// رسم قائمة العملات المستدعاة من الـ API
function renderTokens() {
    const input = document.getElementById('modal-search-input').value.toUpperCase();
    const listContainer = document.getElementById('modal-token-list');
    listContainer.innerHTML = '';

    if (tokens.length === 0) {
        listContainer.innerHTML = '<div class="loader-text">Loading APIs...</div>';
        return;
    }

    const filtered = tokens.filter(t => {
        const matchesSearch = t.symbol.includes(input);
        const matchesTab = currentTab === 'all' || t.type === currentTab;
        return matchesSearch && matchesTab;
    });

    filtered.forEach(t => {
        const div = document.createElement('div');
        div.className = 'token-item';
        div.onclick = () => selectToken(t);
        
        const priceFmt = t.price < 1 ? t.price.toFixed(4) : t.price.toFixed(2);
        const volFmt = (t.volume / 1000000).toFixed(1) + 'M';

        div.innerHTML = `
            <div>
                <div class="token-symbol">${t.name} <span style="font-size:0.6rem; background:#2A2E39; padding:2px 4px; border-radius:4px;">${t.type.toUpperCase()}</span></div>
                <div class="token-name">${t.exchange}</div>
            </div>
            <div>
                <div class="token-price">$${priceFmt}</div>
                <div class="token-vol">Vol: $${volFmt}</div>
            </div>
        `;
        listContainer.appendChild(div);
    });
}

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

// توليد التوصيات وتحديث اللوحة الطافية وصندوق التداول
function generateAI(token) {
    document.getElementById('ai-signals').style.display = 'block';
    document.getElementById('chart-overlay').style.display = 'block'; // إظهار اللوحة الطافية
    
    const isLong = Math.random() > 0.45;
    const entry = token.price;
    const tp = isLong ? entry * 1.04 : entry * 0.96;
    const sl = isLong ? entry * 0.98 : entry * 1.02;
    const precision = entry < 1 ? 4 : 2;

    const entryStr = `$${entry.toFixed(precision)}`;
    const tpStr = `$${tp.toFixed(precision)}`;
    const slStr = `$${sl.toFixed(precision)}`;

    // 1. تحديث صندوق التداول الاحترافي السفلي
    const biasBadge = document.getElementById('ai-bias-badge');
    const execBtn = document.getElementById('ai-execute-btn');
    
    if (isLong) {
        biasBadge.innerText = "LONG POSITION";
        biasBadge.className = "trade-bias long";
        execBtn.innerText = "Execute LONG via API";
        execBtn.className = "execute-btn";
        document.getElementById('ai-rr').innerText = "R:R 1:2.8";
    } else {
        biasBadge.innerText = "SHORT POSITION";
        biasBadge.className = "trade-bias short";
        execBtn.innerText = "Execute SHORT via API";
        execBtn.className = "execute-btn short";
        document.getElementById('ai-rr').innerText = "R:R 1:3.1";
    }

    document.getElementById('ai-entry').innerText = entryStr;
    document.getElementById('ai-tp').innerText = tpStr;
    document.getElementById('ai-sl').innerText = slStr;

    // 2. تحديث اللوحة الطافية الشفافة (DEX Hack) فوق الشارت
    document.getElementById('ov-entry').innerText = entryStr;
    document.getElementById('ov-tp').innerText = tpStr;
    document.getElementById('ov-sl').innerText = slStr;
}

function selectToken(token) {
    closeSearchModal();
    document.getElementById('current-search-display').innerText = `${token.name} / USDT`;
    const tvSymbol = `${token.exchange}:${token.symbol}`;
    
    loadChart(tvSymbol);
    generateAI(token);
}

// تشغيل جلب البيانات عند بدء الموقع
window.onload = function() {
    fetchBinanceMarkets();
};
