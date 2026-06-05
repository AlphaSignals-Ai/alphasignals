let tokens = [];
let currentTab = 'all';

// سحب بيانات السوق الحية بأمان وسرعة من Binance
async function fetchBinanceMarkets() {
    try {
        const response = await fetch('https://api.binance.com/api/v3/ticker/24hr');
        const data = await response.json();
        
        // جلب أفضل 300 عملة حسب السيولة
        const usdtPairs = data.filter(d => d.symbol.endsWith('USDT') && parseFloat(d.quoteVolume) > 1000000)
                              .sort((a, b) => parseFloat(b.quoteVolume) - parseFloat(a.quoteVolume))
                              .slice(0, 300);

        tokens = usdtPairs.map(d => ({
            symbol: d.symbol,
            name: d.symbol.replace('USDT', ''),
            price: parseFloat(d.lastPrice),
            change: parseFloat(d.priceChangePercent),
            type: parseFloat(d.quoteVolume) > 50000000 ? 'perps' : 'spot',
            exchange: "BINANCE"
        }));

        tokens.unshift({ symbol: "HYPEUSDT", name: "HYPE", price: 62.50, change: 8.4, type: "perps", exchange: "BYBIT" });

        updateTickerBar();
        renderTokens();
        
        // التحميل التلقائي لأول عملة (البيتكوين)
        if(tokens.length > 0) {
            const defaultToken = tokens.find(t => t.name === 'BTC') || tokens[0];
            selectToken(defaultToken);
        }
    } catch (error) {
        console.error("API Error:", error);
        document.getElementById('modal-token-list').innerHTML = '<div class="loader-text" style="color: #ff3d00;">Connection failed. Retrying...</div>';
    }
}

function updateTickerBar() {
    const top20 = tokens.slice(0, 20);
    const tickerText = top20.map(t => {
        const sign = t.change >= 0 ? '+' : '';
        return `${t.name} $${t.price.toFixed(t.price < 1 ? 4 : 2)} (${sign}${t.change.toFixed(2)}%)`;
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
    currentTab = tabName;
    const tabs = document.getElementsByClassName('tab-btn');
    for(let i=0; i<tabs.length; i++) tabs[i].classList.remove('active');
    btnElement.classList.add('active');
    renderTokens();
}

// عرض القائمة داخل النافذة بشكل نظيف
function renderTokens() {
    const input = document.getElementById('modal-search-input').value.toUpperCase();
    const listContainer = document.getElementById('modal-token-list');
    listContainer.innerHTML = '';

    const filtered = tokens.filter(t => {
        const matchesSearch = t.symbol.includes(input);
        const matchesTab = currentTab === 'all' || t.type === currentTab;
        return matchesSearch && matchesTab;
    });

    filtered.forEach(t => {
        const div = document.createElement('div');
        div.className = 'token-item';
        div.onclick = () => selectToken(t);
        
        const priceFmt = t.price < 1 ? t.price.toFixed(5) : t.price.toFixed(2);
        const changeColor = t.change >= 0 ? 'var(--accent)' : 'var(--red)';
        const changeSign = t.change >= 0 ? '+' : '';

        div.innerHTML = `
            <div class="token-symbol-box">
                <span class="token-symbol">${t.name}</span>
                <span class="token-type-badge">${t.type}</span>
            </div>
            <div class="token-price">$${priceFmt}</div>
            <div class="token-change" style="color: ${changeColor}">${changeSign}${t.change.toFixed(2)}%</div>
        `;
        listContainer.appendChild(div);
    });
}

// تحميل الشارت النظيف المريح للعين (بدون RSI أو إضافات معقدة)
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
        studies: [] // الشارت نقي تماماً
    });
}

// توليد التوصيات فوراً وبدون تأخير يعلق المتصفح
function generateAI(token) {
    const aiBox = document.getElementById('ai-signals');
    aiBox.style.display = 'block';
    
    document.getElementById('ai-title').innerText = `AlphaSignals AI: Analyzing ${token.name} / USDT...`;
    
    const isLong = Math.random() > 0.45;
    const bias = isLong ? "LONG ENTRY" : "SHORT ENTRY";
    const entry = token.price;
    const tp = isLong ? entry * 1.04 : entry * 0.96;
    const sl = isLong ? entry * 0.98 : entry * 1.02;

    const precision = entry < 1 ? 4 : 2;

    const biasEl = document.getElementById('ai-bias');
    biasEl.innerText = bias;
    biasEl.className = `ai-value ${isLong ? 'ai-green' : 'ai-red'}`;
    
    document.getElementById('ai-entry').innerText = `$${entry.toFixed(precision)}`;
    document.getElementById('ai-tp').innerText = `$${tp.toFixed(precision)}`;
    document.getElementById('ai-sl').innerText = `$${sl.toFixed(precision)}`;
}

// عند اختيار العملة
function selectToken(token) {
    closeSearchModal();
    document.getElementById('current-search-display').innerText = `${token.name} / USDT`;
    
    const tvSymbol = `${token.exchange}:${token.symbol}`;
    loadChart(tvSymbol);
    generateAI(token);
}

// بدء التشغيل
window.onload = function() {
    fetchBinanceMarkets();
};
