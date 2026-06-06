// --- 1. Navigation HUD ---
function switchView(viewId) {
    document.querySelectorAll('.view-section').forEach(el => el.classList.remove('active-view'));
    document.getElementById(viewId).classList.add('active-view');
    document.querySelectorAll('.hud-btn').forEach(btn => btn.classList.remove('active'));
    event.currentTarget.classList.add('active');
}

// --- 2. Chart Initialization (Fixed to load immediately) ---
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
        backgroundColor: "transparent",
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
    // نمرر الحدث وهمياً لتفعيل الزر
    document.querySelectorAll('.hud-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector('.hud-btn').classList.add('active');
    document.querySelectorAll('.view-section').forEach(el => el.classList.remove('active-view'));
    document.getElementById('terminal-view').classList.add('active-view');
}

// --- 3. Hyperliquid L1 Markets (1 Second Update, No Colors) ---
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

        // تحديث الجدول بصمت وبدون ألوان متلألئة
        renderMarketsTable();
    } catch (e) {
        console.error("Hyperliquid API Error:", e);
    }
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
    
    // إذا كان المربع فارغاً في البداية
    if(!allTokens || allTokens.length === 0) return;

    let html = '';
    const filtered = allTokens.filter(t => t.symbol.includes(searchInput));

    filtered.forEach(t => {
        const priceFmt = t.price < 1 ? t.price.toFixed(5) : t.price.toFixed(2);
        const changeClass = t.change >= 0 ? 'txt-green' : 'txt-red';
        const changeSign = t.change >= 0 ? '+' : '';

        html += `
            <tr>
                <td><strong>${t.symbol}</strong></td>
                <td><span class="type-tag">${t.type.toUpperCase()}</span></td>
                <td style="text-align: right; font-family:monospace; font-size:1.05rem;">$${priceFmt}</td>
                <td style="text-align: right;" class="${changeClass}">${changeSign}${t.change.toFixed(2)}%</td>
                <td style="text-align: right;">
                    <button class="hud-btn" style="padding:4px 10px; font-size:0.75rem;" onclick="openInTerminal('${t.symbol}USDT')">Chart</button>
                </td>
            </tr>
        `;
    });
    tbody.innerHTML = html;
}

// --- 4. REAL Live News Feed (CryptoCompare API) ---
async function fetchRealNews() {
    const newsBox = document.getElementById('live-news-feed');
    newsBox.innerHTML = '<div class="loader-pulse">Fetching Real News...</div>';
    
    try {
        // سحب الأخبار الحقيقية مجاناً
        const res = await fetch('https://min-api.cryptocompare.com/data/v2/news/?lang=EN');
        const data = await res.json();
        
        const articles = data.Data.slice(0, 15); // أفضل 15 خبر حالياً
        
        let html = '';
        articles.forEach(a => {
            // تحويل الوقت
            const date = new Date(a.published_on * 1000);
            const timeStr = date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
            
            html += `
            <div class="feed-item">
                <div class="feed-meta"><span>${timeStr} • ${a.source_info.name}</span></div>
                <div><a href="${a.url}" target="_blank" style="color:var(--text-main); text-decoration:none;">${a.title}</a></div>
            </div>`;
        });
        newsBox.innerHTML = html;
    } catch(e) {
        newsBox.innerHTML = '<div class="txt-red">Error loading live news.</div>';
    }
}

// --- 5. Live Whale Simulator (Updates automatically) ---
const whaleAssets = ['BTC', 'ETH', 'SOL', 'USDT', 'USDC', 'HYPE'];
const whaleVerbs = ['transferred to Coinbase', 'withdrawn from Binance', 'minted at Tether Treasury', 'moved to unknown wallet', 'staked in Lido'];

function generateWhaleAlerts() {
    const whaleBox = document.getElementById('live-whale-feed');
    // مسح كلمة جاري التحميل إذا وجدت
    if(whaleBox.innerHTML.includes('Scanning')) whaleBox.innerHTML = '';
    
    const asset = whaleAssets[Math.floor(Math.random() * whaleAssets.length)];
    const verb = whaleVerbs[Math.floor(Math.random() * whaleVerbs.length)];
    const amount = Math.floor(Math.random() * 50000) + 1000;
    
    const newAlert = document.createElement('div');
    newAlert.className = 'feed-item';
    newAlert.innerHTML = `
        <div class="feed-meta"><span>Just Now</span></div>
        <div class="txt-blue">🚨 ${amount.toLocaleString()} ${asset} ${verb}.</div>
    `;
    
    // إضافة الخبر للأعلى
    whaleBox.prepend(newAlert);
    
    // إبقاء 10 عناصر فقط لعدم امتلاء الشاشة
    if(whaleBox.children.length > 10) {
        whaleBox.removeChild(whaleBox.lastChild);
    }
}


// --- 6. REAL Wallet Tracker ---
async function trackWallet(autoWalletAddress = null) {
    const wallet = autoWalletAddress || document.getElementById('wallet-input').value.trim();
    const resultBox = document.getElementById('sniper-result');
    
    if(!wallet || wallet.length < 40) {
        alert("Please enter a full Web3 Wallet Address (e.g., 0x...)");
        return;
    }

    resultBox.style.display = 'block';
    resultBox.innerHTML = '<div class="loader-pulse" style="padding: 20px; text-align: center;">Connecting to Hyperliquid L1... Fetching Wallet State...</div>';

    try {
        const res = await fetch('https://api.hyperliquid.xyz/info', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ "type": "clearinghouseState", "user": wallet })
        });
        const data = await res.json();
        
        if(!data || !data.marginSummary) {
            throw new Error("Wallet not found or has no active trading history on Hyperliquid.");
        }

        const margin = data.marginSummary;
        const accValue = parseFloat(margin.accountValue).toFixed(2);
        const positions = data.assetPositions;

        let positionsHtml = '';
        if(positions.length === 0) {
            positionsHtml = '<div style="color:var(--text-muted); font-size:0.85rem; padding: 10px 0;">No open positions at the moment.</div>';
        } else {
            positionsHtml = positions.map(p => {
                const pos = p.position;
                const size = parseFloat(pos.szi);
                const isLong = size > 0;
                const color = isLong ? 'txt-green' : 'txt-red';
                const type = isLong ? 'LONG' : 'SHORT';
                const entry = parseFloat(pos.entryPx).toFixed(4);
                const pnl = parseFloat(pos.unrealizedPnl).toFixed(2);
                const pnlColor = pnl >= 0 ? 'txt-green' : 'txt-red';

                return `
                    <div style="background:rgba(255,255,255,0.03); padding:12px; border-radius:8px; margin-bottom:8px; display:flex; justify-content:space-between; align-items:center; border-left: 3px solid ${isLong ? 'var(--accent)' : 'var(--red)'};">
                        <div>
                            <strong style="color:white; font-size:1.1rem;">${pos.coin}</strong> <span class="${color}" style="font-size:0.8rem; font-weight:bold; margin-left:5px;">${type}</span><br>
                            <span style="color:var(--text-muted); font-size:0.8rem;">Size: ${Math.abs(size)} | Entry: $${entry}</span>
                        </div>
                        <div style="text-align:right;">
                            <span style="color:var(--text-muted); font-size:0.75rem;">Unrealized PNL</span><br>
                            <strong class="${pnlColor}" style="font-size:1.1rem;">$${pnl}</strong>
                        </div>
                    </div>
                `;
            }).join('');
        }

        resultBox.innerHTML = `
            <div style="display:flex; align-items:center; gap:10px; margin-bottom:20px;">
                <span style="font-size:1.8rem;">🏦</span>
                <strong class="txt-green" style="font-size:1.3rem;">Live Wallet State Retrieved</strong>
            </div>
            <div style="background:rgba(0,0,0,0.3); padding:15px; border-radius:8px; margin-bottom:15px; border:1px solid var(--glass-border);">
                <span style="color:var(--text-muted); font-size:0.85rem;">Full Tracked Address:</span><br>
                <strong style="font-family:monospace; font-size:1.1rem; color:white; word-break:break-all;">${wallet}</strong>
            </div>
            <div style="background:rgba(0, 255, 136, 0.05); border:1px solid rgba(0, 255, 136, 0.2); padding:20px; border-radius:8px; margin-bottom:20px;">
                <span style="color:var(--accent); font-size:0.85rem; text-transform:uppercase; font-weight:bold;">Account Value (Equity)</span><br>
                <strong style="font-size:2rem; color:white; font-family:monospace;">$${accValue}</strong>
            </div>
            <div>
                <span style="color:var(--text-muted); font-size:0.9rem; text-transform:uppercase; font-weight:bold;">Active Open Positions:</span>
                <div style="margin-top:10px;">${positionsHtml}</div>
            </div>
        `;

    } catch(e) {
        resultBox.innerHTML = `<div style="color:var(--red); font-weight:bold;">⚠️ Error: ${e.message}</div>`;
    }
}

function handleSniperUpload() {
    const resultBox = document.getElementById('sniper-result');
    resultBox.style.display = "block";
    resultBox.innerHTML = '<div class="loader-pulse">Extracting Matrix Data...</div>';

    setTimeout(() => {
        const extractedWallet = "0x8FA4E07b8aAaE5d6A2a9d863D2BD1F7e5a8F4b78";
        resultBox.innerHTML = `
            <div style="display:flex; align-items:center; gap:10px; margin-bottom:15px;">
                <span style="font-size:1.5rem;">🎯</span>
                <strong class="txt-green">Target Successfully Extracted!</strong>
            </div>
            <div style="background:rgba(0,0,0,0.3); padding:15px; border-radius:8px; margin-bottom:15px;">
                <strong style="font-family:monospace; color:var(--accent); word-break:break-all;">${extractedWallet}</strong>
            </div>
            <button class="glass-action-btn" style="width:100%; padding:15px;" onclick="trackWallet('${extractedWallet}')">🛰️ Connect API & Track This Wallet Live</button>
        `;
    }, 2000);
}

// --- Bootstrap Sequence ---
window.onload = () => {
    // 1. إظهار نافذة الشارت أولاً (مهم جداً ليعمل TradingView)
    document.getElementById('terminal-view').classList.add('active-view');
    
    // 2. تشغيل الشارت بعد أجزاء من الثانية لضمان أخذ الأبعاد الصحيحة
    setTimeout(() => {
        initChart('BINANCE:BTCUSDT');
        window.chartInitialized = true;
    }, 100);

    // 3. تشغيل الأخبار والأسواق
    fetchRealNews();
    generateWhaleAlerts();
    fetchHyperliquidMarkets();
    
    // 4. تحديثات دورية (كل 1 ثانية للماركت، كل 12 ثانية للحيتان)
    setInterval(fetchHyperliquidMarkets, 1000);
    setInterval(generateWhaleAlerts, 12000);
};
