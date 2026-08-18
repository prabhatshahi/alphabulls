export const NSE_SECTOR_MAPPINGS: Record<string, string[]> = {
  'Nifty Bank': [
    'HDFCBANK.NS', 'ICICIBANK.NS', 'SBIN.NS', 'KOTAKBANK.NS', 'AXISBANK.NS', 
    'BANKBARODA.NS', 'PNB.NS', 'FEDERALBNK.NS', 'INDUSINDBK.NS', 'AUBANK.NS', 
    'IDFCFIRSTB.NS', 'BANDHANBNK.NS'
  ],
  'Private Bank': [
    'HDFCBANK.NS', 'ICICIBANK.NS', 'KOTAKBANK.NS', 'AXISBANK.NS', 'INDUSINDBK.NS', 
    'FEDERALBNK.NS', 'AUBANK.NS', 'IDFCFIRSTB.NS', 'BANDHANBNK.NS'
  ],
  'PSU Bank': [
    'SBIN.NS', 'BANKBARODA.NS', 'PNB.NS', 'CANBK.NS', 'BANKINDIA.NS', 
    'UNIONBANK.NS', 'INDIANB.NS', 'CENTRALBK.NS', 'UCOBANK.NS', 'IOB.NS'
  ],
  'Nifty Financial Services': [
    'HDFCBANK.NS', 'ICICIBANK.NS', 'SBIN.NS', 'KOTAKBANK.NS', 'AXISBANK.NS', 
    'BAJFINANCE.NS', 'BAJAJFINSV.NS', 'CHOLAFIN.NS', 'MUTHOOTFIN.NS', 'SHRIRAMFIN.NS', 
    'PFC.NS', 'RECLTD.NS', 'HDFCLIFE.NS', 'SBILIFE.NS', 'ICICIPRULI.NS', 'M&MFIN.NS'
  ],
  'IT': [
    'TCS.NS', 'INFY.NS', 'HCLTECH.NS', 'WIPRO.NS', 'TECHM.NS', 'LTM.NS', 
    'PERSISTENT.NS', 'COFORGE.NS', 'LTTS.NS', 'OFSS.NS', 'BSOFT.NS', 'MPHASIS.NS', 
    'CYIENT.NS', 'TATAELXSI.NS'
  ],
  'Nifty Auto': [
    'MARUTI.NS', 'M&M.NS', 'TMPV.NS', 'TATAMOTORS.NS', 'BAJAJ-AUTO.NS', 
    'HEROMOTOCO.NS', 'TVSMOTOR.NS', 'EICHERMOT.NS', 'ASHOKLEY.NS', 'BHARATFORG.NS', 
    'BALKRISIND.NS', 'APOLLOTYRE.NS', 'MRF.NS', 'MOTHERSON.NS', 'EXIDEIND.NS', 'BOSCHLTD.NS'
  ],
  'Nifty Pharma': [
    'SUNPHARMA.NS', 'CIPLA.NS', 'DRREDDY.NS', 'DIVISLAB.NS', 'LUPIN.NS', 
    'TORNTPHARM.NS', 'ZYDUSLIFE.NS', 'ALKEM.NS', 'BIOCON.NS', 'AUROPHARMA.NS', 
    'GRANULES.NS', 'GLENMARK.NS', 'LAURUSLABS.NS', 'IPCALAB.NS', 'MANKIND.NS'
  ],
  'Healthcare': [
    'APOLLOHOSP.NS', 'MAXHEALTH.NS', 'SYNGENE.NS', 'LALPATHLAB.NS', 'METROPOLIS.NS', 
    'FORTIS.NS', 'ASTERDM.NS', 'RAINBOW.NS', 'KIMS.NS', 'MEDANTA.NS', 'SUNPHARMA.NS', 'CIPLA.NS'
  ],
  'FMCG': [
    'ITC.NS', 'HINDUNILVR.NS', 'BRITANNIA.NS', 'NESTLEIND.NS', 'GODREJCP.NS', 
    'DABUR.NS', 'MARICO.NS', 'VBL.NS', 'TATACONSUM.NS', 'COLPAL.NS', 'UNITDSPR.NS', 'UBL.NS', 'PATANJALI.NS'
  ],
  'Consumer Durables': [
    'TITAN.NS', 'DIXON.NS', 'HAVELLS.NS', 'VOLTAS.NS', 'CROMPTON.NS', 
    'POLYCAB.NS', 'WHIRLPOOL.NS', 'AMBER.NS', 'BLUESTARCO.NS', 'KAJARIACER.NS'
  ],
  'Metal': [
    'TATASTEEL.NS', 'JSWSTEEL.NS', 'HINDALCO.NS', 'VEDL.NS', 'JINDALSTEL.NS', 
    'SAIL.NS', 'NMDC.NS', 'NATIONALUM.NS', 'APLAPOLLO.NS', 'HINDZINC.NS', 'JSL.NS'
  ],
  'Energy': [
    'RELIANCE.NS', 'ONGC.NS', 'NTPC.NS', 'POWERGRID.NS', 'BPCL.NS', 'IOC.NS', 
    'HINDPETRO.NS', 'GAIL.NS', 'COALINDIA.NS', 'TATAPOWER.NS', 'ADANIGREEN.NS', 'ADANIENSOL.NS', 'NHPC.NS', 'SJVN.NS', 'SUZLON.NS'
  ],
  'Oil & Gas': [
    'RELIANCE.NS', 'ONGC.NS', 'BPCL.NS', 'IOC.NS', 'HINDPETRO.NS', 
    'GAIL.NS', 'PETRONET.NS', 'IGL.NS', 'MGL.NS', 'OIL.NS', 'GUJENERGY.NS', 'ATGL.NS'
  ],
  'Infra': [
    'LT.NS', 'HAL.NS', 'BEL.NS', 'SIEMENS.NS', 'ABB.NS', 'CUMMINSIND.NS', 
    'BHEL.NS', 'DLF.NS', 'GODREJPROP.NS', 'OBEROIRLTY.NS', 'CONCOR.NS', 'CGPOWER.NS', 'IRB.NS', 'KEC.NS'
  ],
  'Nifty Infrastructure': [
    'LT.NS', 'NTPC.NS', 'POWERGRID.NS', 'BHARTIARTL.NS', 'ULTRACEMCO.NS', 
    'DLF.NS', 'GRASIM.NS', 'TATAPOWER.NS', 'ADANIPORTS.NS', 'CONCOR.NS', 'IRB.NS', 'GMRINFRA.NS'
  ],
  'Realty': [
    'DLF.NS', 'GODREJPROP.NS', 'OBEROIRLTY.NS', 'MACROTECH.NS', 'PHOENIXLTD.NS', 
    'PRESTIGE.NS', 'SOBHA.NS', 'BRIGADE.NS', 'SUNTECK.NS'
  ],
  'Defence': [
    'HAL.NS', 'BEL.NS', 'BDL.NS', 'MAZDOCK.NS', 'GRSE.NS', 'COCHINSHIP.NS', 
    'SOLARINDS.NS', 'DATAPATTNS.NS', 'PARAS.NS'
  ],
  'PSE': [
    'ONGC.NS', 'NTPC.NS', 'POWERGRID.NS', 'BPCL.NS', 'IOC.NS', 'COALINDIA.NS', 
    'SBIN.NS', 'BANKBARODA.NS', 'PNB.NS', 'PFC.NS', 'RECLTD.NS', 'HAL.NS', 'BEL.NS', 'BHEL.NS', 'NMDC.NS', 'SAIL.NS', 'GAIL.NS'
  ],
  'Commodities': [
    'TATASTEEL.NS', 'JSWSTEEL.NS', 'HINDALCO.NS', 'VEDL.NS', 'AMBUJACEM.NS', 
    'ACC.NS', 'ULTRACEMCO.NS', 'PIDILITIND.NS', 'UPL.NS', 'GRASIM.NS', 'SHREECEM.NS', 'DEEPAKNTR.NS'
  ],
  'Consumption': [
    'TITAN.NS', 'ITC.NS', 'HINDUNILVR.NS', 'MARUTI.NS', 'M&M.NS', 'ASIANPAINT.NS', 
    'BERGEPAINT.NS', 'TRENT.NS', 'ABFRL.NS', 'DMART.NS', 'DEVYANI.NS', 'JUBLFOOD.NS'
  ],
  'Service Sector': [
    'TCS.NS', 'INFY.NS', 'HDFCBANK.NS', 'ICICIBANK.NS', 'BHARTIARTL.NS', 
    'INDIGO.NS', 'ZOMATO.NS', 'NAUKRI.NS', 'POLICYBZR.NS', 'DELHIVERY.NS', 'CONCOR.NS'
  ],
  'Nifty Chemicals': [
    'PIDILITIND.NS', 'SRF.NS', 'DEEPAKNTR.NS', 'TATACHEM.NS', 'FLUOROCHEM.NS', 
    'NAVINFLUOR.NS', 'ATUL.NS', 'AARTIIND.NS', 'SOLARINDS.NS', 'PIIND.NS', 'UPL.NS', 'LINDEINDIA.NS'
  ],
  'Nifty Media': [
    'SUNTV.NS', 'ZEEL.NS', 'PVRINOX.NS', 'TV18BRDCST.NS', 'NETWORK18.NS', 
    'SAREGAMA.NS', 'NAZARA.NS', 'TIPSMUSIC.NS'
  ],
  'Nifty Cement': [
    'ULTRACEMCO.NS', 'AMBUJACEM.NS', 'ACC.NS', 'SHREECEM.NS', 'DALBHARAT.NS', 
    'JKCEMENT.NS', 'RAMCOCEM.NS', 'BIRLACORPN.NS', 'HEIDELBERG.NS'
  ],
  'Nifty 50': [
    'RELIANCE.NS', 'TCS.NS', 'HDFCBANK.NS', 'ICICIBANK.NS', 'INFY.NS', 
    'BHARTIARTL.NS', 'ITC.NS', 'SBIN.NS', 'LT.NS', 'HINDUNILVR.NS', 'MARUTI.NS', 
    'M&M.NS', 'SUNPHARMA.NS', 'HCLTECH.NS', 'TATAMOTORS.NS', 'NTPC.NS', 'POWERGRID.NS', 
    'ONGC.NS', 'TITAN.NS', 'COALINDIA.NS', 'ADANIENT.NS', 'ADANIPORTS.NS', 'KOTAKBANK.NS', 'AXISBANK.NS', 'BAJFINANCE.NS'
  ],
  'Nifty Next 50': [
    'BEL.NS', 'HAL.NS', 'TRENT.NS', 'VBL.NS', 'REC.NS', 'PFC.NS', 'DLF.NS', 
    'CHOLAFIN.NS', 'IOC.NS', 'GAIL.NS', 'SIEMENS.NS', 'ABB.NS', 'GODREJCP.NS', 
    'BANKBARODA.NS', 'PNB.NS', 'SHREECEM.NS', 'PIDILITIND.NS', 'HAVELLS.NS', 'COFORGE.NS', 'PERSISTENT.NS'
  ],
  'Nifty Midcap': [
    'PERSISTENT.NS', 'COFORGE.NS', 'LTTS.NS', 'AUROPHARMA.NS', 'LUPIN.NS', 
    'MAXHEALTH.NS', 'POLYCAB.NS', 'DIXON.NS', 'VOLTAS.NS', 'BHEL.NS', 'BHARATFORG.NS', 
    'CUMMINSIND.NS', 'AUBANK.NS', 'FEDERALBNK.NS', 'IDFCFIRSTB.NS'
  ]
};

export const NSE_SECTOR_ICONS: Record<string, string> = {
  'Nifty 50': '🏛️',
  'Nifty Next 50': '🚀',
  'Nifty Bank': '🏦',
  'Private Bank': '🏛️',
  'PSU Bank': '🏢',
  'Nifty Financial Services': '💳',
  'Nifty Auto': '🚗',
  'IT': '💻',
  'Nifty Pharma': '💊',
  'Healthcare': '🩺',
  'FMCG': '🛒',
  'Consumer Durables': '📺',
  'Metal': '⚒️',
  'Energy': '⚡',
  'Oil & Gas': '🛢️',
  'Infra': '🏗️',
  'Nifty Infrastructure': '🌉',
  'Realty': '🏢',
  'Defence': '🛡️',
  'PSE': '🏛️',
  'Commodities': '🌾',
  'Consumption': '🛍️',
  'Service Sector': '🌐',
  'Nifty Chemicals': '🧪',
  'Nifty Media': '📺',
  'Nifty Cement': '🧱',
  'Nifty Midcap': '📈'
};

export const NSE_SECTOR_CODES: Record<string, string> = {
  'Nifty 50': 'NIFTY50',
  'Nifty Next 50': 'NIFTYNEXT50',
  'Nifty Bank': 'BANKNIFTY',
  'Private Bank': 'PRIVBANK',
  'PSU Bank': 'PSUBANK',
  'Nifty Financial Services': 'FINNIFTY',
  'Nifty Auto': 'AUTO',
  'IT': 'IT',
  'Nifty Pharma': 'PHARMA',
  'Healthcare': 'HEALTH',
  'FMCG': 'FMCG',
  'Consumer Durables': 'DURABLES',
  'Metal': 'METAL',
  'Energy': 'ENERGY',
  'Oil & Gas': 'OILGAS',
  'Infra': 'INFRA',
  'Nifty Infrastructure': 'NIFTYINFRA',
  'Realty': 'REALTY',
  'Defence': 'DEFENCE',
  'PSE': 'PSE',
  'Commodities': 'COMMODITIES',
  'Consumption': 'CONSUMPTION',
  'Service Sector': 'SERVICES',
  'Nifty Chemicals': 'CHEMICALS',
  'Nifty Media': 'MEDIA',
  'Nifty Cement': 'CEMENT',
  'Nifty Midcap': 'MIDCAP'
};

export function getSectorForSymbol(sym: string): string {
  const cleanSym = sym.replace('.NS', '').toUpperCase();
  for (const [secName, symbols] of Object.entries(NSE_SECTOR_MAPPINGS)) {
    if (symbols.some(s => s.replace('.NS', '').toUpperCase() === cleanSym)) {
      return secName;
    }
  }
  return 'Other NSE Capital Market';
}
