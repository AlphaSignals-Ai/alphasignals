// قاعدة بيانات العملات الاحترافية (بها الصور وتصنيفات الفيوتشر/سبوت)
const tokens = [
    { symbol: "BTCUSDT", name: "Bitcoin", price: 63120, type: "perps", icon: "https://cryptologos.cc/logos/bitcoin-btc-logo.png", exchange: "BINANCE" },
    { symbol: "ETHUSDT", name: "Ethereum", price: 3450, type: "perps", icon: "https://cryptologos.cc/logos/ethereum-eth-logo.png", exchange: "BINANCE" },
    { symbol: "SOLUSDT", name: "Solana", price: 165, type: "spot", icon: "https://cryptologos.cc/logos/solana-sol-logo.png", exchange: "BINANCE" },
    { symbol: "WLDUSDT", name: "Worldcoin", price: 0.4920, type: "perps", icon: "https://cryptologos.cc/logos/worldcoin-wld-logo.png", exchange: "BINANCE" },
    { symbol: "HYPEUSDT", name: "Hyperliquid", price: 62.50, type: "perps", icon: "https://cryptologos.cc/logos/hyperliquid-hype-logo.png", exchange: "BYBIT" }, // BYBIT كمثال
    { symbol: "DOGEUSDT", name: "Dogecoin", price: 0.12, type: "spot", icon: "https://cryptologos.cc/logos/dogecoin-doge-logo.png", exchange: "BINANCE" },
    { symbol: "AAPL", name: "Apple Inc.", price: 185.50, type: "stocks", icon: "🍏", exchange: "NASDAQ" } // كمثال للأسهم
];

let currentTab = 'all';

// التحكم في الروابط العلوية (Nav Links)
function handleNav(section) {
    if(section === 'home') {
        window.scrollTo({top: 0, behavior: 'smooth'});
    } else if(section === 'terminal') {
        document.getElementById('terminal-section').scrollIntoView({behavior: 'smooth', block: 'start'});
    } else {
        alert("🔒 This module requires Pro Access. Coming soon.");
    }
}

// فتح وإغلاق نافذة البحث الفاخرة
function openSearchModal() {
    document.getElementById('search-modal').style.display = 'flex';
    document.getElementById('modal-search-input').focus();
    renderTokens();
}

function closeSearchModal(event) {
    if(event) event.stopPropagation();
    document.getElementById('search-modal').style.display = 'none';
}

// تغيير خانات التبويب في البحث (All, Perps, Spot...)
function setTab(tabName, btnElement) {
    currentTab = tabName;
    const tabs = document.getElementsByClassName('tab-btn');
    for(let i=0; i<tabs.length; i++) {
        tabs[i].classList.remove('active');
    }
    btnElement.classList.add('active');
    renderTokens();
}

// رسم قائمة العملات في النافذة مع الفلترة
function renderTokens() {
    const input = document.getElementById('modal-search-input').value.toUpperCase();
    const listContainer = document.getElementById('modal-token-list');
    listContainer.innerHTML = '';

    const filtered = tokens.filter(t => {
        const matchesSearch = t.symbol.includes(input) || t.name.toUpperCase().includes(input);
        const matchesTab = currentTab === 'all' || t.type === currentTab;
        return matchesSearch && matchesTab;
    });

    if(filtered.length === 0) {
        listContainer.innerHTML = '<div style="padding: 20px; text-align: center; color: #8b9bb4;">No markets found</div>';
        return;
    }

    filtered.forEach(t => {
        const div = document.createElement('div');
        div.className = 'token-item';
        div.onclick = () => selectToken(t);

        // إذا كانت الأيقونة رابط صورة نضعها، وإذا كانت نص (إيموجي) نضعه مباشرة
        const iconHtml = t.icon.startsWith('http') 
            ? `<img src="${t.icon}" class="token-icon" onerror="this.src='data:image/svg+xml;utf8,<svg xmlns=\\'http://www.w3.org/2000/svg\\' fill=\\'none\\' viewBox=\\'0 0 24 24\\' stroke=\\'white\\'><path stroke-linecap=\\'round\\' stroke-linejoin=\\'round\\' stroke-width=\\'2\\' d=\\'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z\\'/></svg>'">` 
            : `<div class="token-icon" style="background:transparent; font-size:1.5rem;">${t.icon}</div>`;

        div.innerHTML = `
            <div class="token-left">
                ${iconHtml}
                <div class="token-info">
                    <span class="token-symbol">
                        ${t.symbol.replace("USDT", "")} 
                        <span class="token-type-badge">${t.type}</span>
                    </span>
                    <span class="token-name">${t.name}</span>
                </div>
            </div>
            <div class="token-price">$${t.price}</div>
        `;
        listContainer.appendChild(div);
    });
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
        allow_symbol_change: false, // نمنع البحث الداخلي لنجبره على استخدام النافذة الاحترافية الخاصة بنا
        studies: ["RSI@tv-basicstudies"]
    });
}

// دالة الذكاء الاصطناعي لحساب الأهداف
function generateAI(token) {
    const aiBox = document.getElementById('ai-signals');
    aiBox.style.display = 'block';
    
    document.getElementById('ai-title').innerText = `AlphaSignals AI: Analyzing ${token.name} (${token.symbol.replace("USDT", "")})...`;
    
    const isLong = Math.random() > 0.4;
    const bias = isLong ? "LONG ENTRY" : "SHORT ENTRY";
    const entry = token.price;
    const tp = isLong ? entry * 1.03 : entry * 0.97;
    const sl = isLong ? entry * 0.985 : entry * 1.015;

    const precision = entry < 1 ? 4 : 2;

    const biasEl = document.getElementById('ai-bias');
    biasEl.innerText = bias;
    biasEl.className = `ai-value ${isLong ? 'ai-green' : 'ai-red'}`;
    
    document.getElementById('ai-entry').innerText = `$${entry.toFixed(precision)}`;
    document.getElementById('ai-tp').innerText = `$${tp.toFixed(precision)}`;
    document.getElementById('ai-sl').innerText = `$${sl.toFixed(precision)}`;
}

// اختيار العملة من النافذة
function selectToken(token) {
    // إغلاق النافذة
    closeSearchModal();
    
    // تحديث زر البحث ليعرض العملة المختارة
    document.getElementById('current-search-display').innerText = `${token.symbol.replace("USDT", "")} / USDT`;
    
    const tvSymbol = `${token.exchange}:${token.symbol}`;
    
    loadChart(tvSymbol);
    generateAI(token);
}

// التحميل الافتراضي (البيتكوين)
window.onload = function() {
    if(window.TradingView) {
        selectToken(tokens[0]); 
    }
}
