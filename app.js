let tokens = [];

// جلب جميع البيانات الحية من Binance (سعر ونسبة تغير)
async function fetchBinanceMarkets() {
    try {
        const response = await fetch('https://api.binance.com/api/v3/ticker/24hr');
        const data = await response.json();
        
        // استخراج أزواج USDT القوية (أكثر من 300 عملة)
        const usdtPairs = data.filter(d => d.symbol.endsWith('USDT') && parseFloat(d.quoteVolume) > 1000000)
                              .sort((a, b) => parseFloat(b.quoteVolume) - parseFloat(a.quoteVolume))
                              .slice(0, 300);

        tokens = usdtPairs.map(d => ({
            symbol: d.symbol,
            name: d.symbol.replace('USDT', ''),
            price: parseFloat(d.lastPrice),
            change: parseFloat(d.priceChangePercent),
            exchange: "BINANCE"
        }));

        // إضافة عملة HYPE يدوياً لضمان وجودها
        tokens.unshift({ symbol: "HYPEUSDT", name: "HYPE", price: 62.50, change: 8.4, exchange: "BYBIT" });

        updateTickerBar();
        renderTokens();
        
        // تحميل البيتكوين افتراضياً
        if(tokens.length > 0) selectToken(tokens.find(t => t.name === 'BTC') || tokens[0], true);

    } catch (error) {
        console.error("API Fetch Error:", error);
        document.getElementById('modal-token-list').innerHTML = '<div class="loader-text" style="color: #ff3d00;">Connection failed. Retrying...</div>';
    }
}

// تحديث شريط الأخبار المتحرك بالأعلى
function updateTickerBar() {
    const top20 = tokens.slice(0, 20);
    const tickerText = top20.map(t => {
        const sign = t.change >= 0 ? '+' : '';
        return `${t.name} $${t.price.toFixed(t.price < 1 ? 4 : 2)} (${sign}${t.change.toFixed(2)}%)`;
    }).join('  •  ');
    document.getElementById('live-ticker-track').innerText = tickerText;
}

// التنقل بين الروابط
function handleNav(section) {
    if(section === 'home') window.scrollTo({top: 0, behavior: 'smooth'});
    else if(section === 'terminal') document.getElementById('terminal-section').scrollIntoView({behavior: 'smooth', block: 'start'});
    else alert("🔒 This section is under maintenance.");
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

function renderTokens() {
    const input = document.getElementById('modal-search-input').value.toUpperCase();
    const listContainer = document.getElementById('modal-token-list');
    listContainer.innerHTML = '';

    const filtered = tokens.filter(t => t.symbol.includes(input));

    filtered.forEach(t => {
        const div = document.createElement('div');
        div.className = 'token-item';
        div.onclick = () => selectToken(t, false);
        
        const priceFmt = t.price < 1 ? t.price.toFixed(5) : t.price.toFixed(2);
        const changeColor = t.change >= 0 ? 'var(--accent)' : 'var(--red)';
        const changeSign = t.change >= 0 ? '+' : '';

        div.innerHTML = `
            <div class="token-symbol-box">
                <span class="token-symbol">${t.name}</span>
            </div>
            <div class="token-price">$${priceFmt}</div>
            <div class="token-change" style="color: ${changeColor}">${changeSign}${t.change.toFixed(2)}%</div>
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
        // إزالة RSI كما طلبت
        studies: [] 
    });
}

// دالة الذكاء الاصطناعي مع ليزر المسح ومسار التوقع (AI Projection)
function simulateAnalysis(token, isInitialLoad) {
    const scanner = document.getElementById('ai-scanner');
    const scanningText = document.getElementById('ai-scanning-text');
    const predictionPath = document.getElementById('prediction-path');
    const orderBar = document.getElementById('sleek-order-bar');
    const liveDot = document.getElementById('live-dot');
    
    // إخفاء الأشرطة وبدء عملية المسح
    orderBar.style.display = 'none';
    predictionPath.style.display = 'none';
    liveDot.style.display = 'none';
    
    if(!isInitialLoad) {
        scanner.style.display = 'block';
        scanningText.style.display = 'block';
    }

    // محاكاة وقت التحليل الفني (1.8 ثانية)
    setTimeout(() => {
        scanner.style.display = 'none';
        scanningText.style.display = 'none';
        
        // حساب التوقعات
        const isLong = Math.random() > 0.45;
        const entry = token.price;
        const tp = isLong ? entry * 1.04 : entry * 0.96;
        const sl = isLong ? entry * 0.98 : entry * 1.02;
        const precision = entry < 1 ? 4 : 2;

        // تحديث شريط التداول السلس (Sleek Order Bar)
        const biasBadge = document.getElementById('slim-bias');
        const execBtn = document.getElementById('slim-exec-btn');
        
        biasBadge.innerText = isLong ? "LONG ENTRY" : "SHORT ENTRY";
        biasBadge.className = isLong ? "slim-bias-badge long" : "slim-bias-badge short";
        execBtn.innerText = isLong ? "Execute LONG Order" : "Execute SHORT Order";
        execBtn.className = isLong ? "slim-execute-btn" : "slim-execute-btn short";

        document.getElementById('slim-entry').innerText = `$${entry.toFixed(precision)}`;
        document.getElementById('slim-tp').innerText = `$${tp.toFixed(precision)}`;
        document.getElementById('slim-tp').className = isLong ? "text-green" : "text-red";
        document.getElementById('slim-sl').innerText = `$${sl.toFixed(precision)}`;
        document.getElementById('slim-sl').className = isLong ? "text-red" : "text-green";

        // رسم مسار التوقع المستقبلي المضيء على الحافة (الخدعة البصرية للشموع الوهمية)
        const svgPath = document.getElementById('svg-proj-line');
        if (isLong) {
            svgPath.setAttribute('d', 'M0,50 Q40,50 100,10'); // مسار صاعد
            svgPath.setAttribute('stroke', '#00e676');
        } else {
            svgPath.setAttribute('d', 'M0,50 Q40,50 100,90'); // مسار هابط
            svgPath.setAttribute('stroke', '#ff3d00');
        }

        orderBar.style.display = 'flex';
        predictionPath.style.display = 'flex';
        liveDot.style.display = 'inline-block';

    }, isInitialLoad ? 0 : 1800); 
}

function selectToken(token, isInitialLoad) {
    closeSearchModal();
    document.getElementById('current-search-display').innerText = `${token.name} / USDT`;
    
    const tvSymbol = `${token.exchange}:${token.symbol}`;
    loadChart(tvSymbol);
    simulateAnalysis(token, isInitialLoad);
}

// التشغيل الافتراضي عند فتح الموقع
window.onload = function() {
    fetchBinanceMarkets();
};
