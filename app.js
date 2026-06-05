
function filterTokens(){
 const input=document.getElementById('search');
 const dd=document.getElementById('dropdown');
 dd.style.display=input.value.length?'block':'none';
}
window.onload=function(){
 if(window.TradingView){
 new TradingView.widget({
 container_id:'tv-home-chart',
 autosize:true,
 symbol:'BINANCE:BTCUSDT',
 interval:'60',
 theme:'dark',
 style:'1'
 });
 }
}
