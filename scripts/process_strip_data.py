import csv, re

# ── Continent mapping by SACC code ──────────────────────────────────────────
def get_continent_sacc(sacc_code):
    try:
        code = int(sacc_code)
    except:
        return None
    if 1100 <= code <= 1699: return 'Oceania'
    if 2100 <= code <= 3399: return 'Europe'
    if 4100 <= code <= 4111: return 'Africa'   # North Africa
    if 4200 <= code <= 4217: return 'Middle East'
    if 5100 <= code <= 6299: return 'Asia'
    if 7100 <= code <= 7299: return 'Asia'
    if 8100 <= code <= 8499: return 'Americas'
    if 9100 <= code <= 9299: return 'Africa'
    return None

# ── ISO3 to continent ────────────────────────────────────────────────────────
iso3_continent = {
    'CHN':'Asia','IND':'Asia','IDN':'Asia','JPN':'Asia','KOR':'Asia','MYS':'Asia',
    'PHL':'Asia','VNM':'Asia','THA':'Asia','NPL':'Asia','PAK':'Asia','LKA':'Asia',
    'BGD':'Asia','MMR':'Asia','KHM':'Asia','LAO':'Asia','BRN':'Asia','SGP':'Asia',
    'TLS':'Asia','MNG':'Asia','PRK':'Asia','KAZ':'Asia','UZB':'Asia','TJK':'Asia',
    'KGZ':'Asia','TKM':'Asia','ARM':'Asia','AZE':'Asia','GEO':'Asia','AFG':'Asia',
    'GBR':'Europe','DEU':'Europe','FRA':'Europe','ITA':'Europe','ESP':'Europe',
    'NLD':'Europe','BEL':'Europe','CHE':'Europe','AUT':'Europe','PRT':'Europe',
    'GRC':'Europe','POL':'Europe','SWE':'Europe','NOR':'Europe','DNK':'Europe',
    'FIN':'Europe','IRL':'Europe','CZE':'Europe','HUN':'Europe','ROU':'Europe',
    'BGR':'Europe','HRV':'Europe','SVK':'Europe','SVN':'Europe','LTU':'Europe',
    'LVA':'Europe','EST':'Europe','BLR':'Europe','UKR':'Europe','RUS':'Europe',
    'MDA':'Europe','SRB':'Europe','MNE':'Europe','BIH':'Europe','ALB':'Europe',
    'MKD':'Europe','CYP':'Europe','MLT':'Europe','LUX':'Europe','ISL':'Europe',
    'NZL':'Oceania','FJI':'Oceania','PNG':'Oceania','SLB':'Oceania','VUT':'Oceania',
    'WSM':'Oceania','TON':'Oceania','KIR':'Oceania','FSM':'Oceania','PLW':'Oceania',
    'MHL':'Oceania','NRU':'Oceania','TUV':'Oceania',
    'USA':'Americas','CAN':'Americas','MEX':'Americas','BRA':'Americas','ARG':'Americas',
    'CHL':'Americas','COL':'Americas','PER':'Americas','VEN':'Americas','ECU':'Americas',
    'BOL':'Americas','PRY':'Americas','URY':'Americas','GUY':'Americas','SUR':'Americas',
    'GTM':'Americas','CRI':'Americas','PAN':'Americas','HND':'Americas','SLV':'Americas',
    'NIC':'Americas','BLZ':'Americas','JAM':'Americas','TTO':'Americas','CUB':'Americas',
    'DOM':'Americas','HTI':'Americas','BRB':'Americas','GRD':'Americas','KNA':'Americas',
    'LCA':'Americas','VCT':'Americas','ATG':'Americas',
    'ZAF':'Africa','NGA':'Africa','KEN':'Africa','ETH':'Africa','GHA':'Africa',
    'TZA':'Africa','UGA':'Africa','MOZ':'Africa','ZMB':'Africa','ZWE':'Africa',
    'SEN':'Africa','MDG':'Africa','CMR':'Africa','CIV':'Africa','AGO':'Africa',
    'SDN':'Africa','EGY':'Africa','DZA':'Africa','MAR':'Africa','TUN':'Africa',
    'LBY':'Africa','MUS':'Africa','RWA':'Africa','MWI':'Africa','MLI':'Africa',
    'BFA':'Africa','NER':'Africa','TCD':'Africa','SLE':'Africa','GIN':'Africa',
    'BEN':'Africa','ERI':'Africa','SOM':'Africa','DJI':'Africa','COM':'Africa',
    'SSD':'Africa','BDI':'Africa','LSO':'Africa','BWA':'Africa','NAM':'Africa',
    'GAB':'Africa','COG':'Africa','COD':'Africa','CAF':'Africa','GNQ':'Africa',
    'STP':'Africa','CPV':'Africa','GMB':'Africa','GNB':'Africa','LBR':'Africa',
    'TGO':'Africa','SYC':'Africa',
    'SAU':'Middle East','ARE':'Middle East','IRN':'Middle East','IRQ':'Middle East',
    'ISR':'Middle East','JOR':'Middle East','KWT':'Middle East','LBN':'Middle East',
    'OMN':'Middle East','QAT':'Middle East','SYR':'Middle East','TUR':'Middle East',
    'YEM':'Middle East','BHR':'Middle East',
}

years = ['2004-05','2005-06','2006-07','2007-08','2008-09','2009-10',
         '2010-11','2011-12','2012-13','2013-14','2014-15','2015-16',
         '2016-17','2017-18','2018-19','2019-20','2020-21','2021-22',
         '2022-23','2023-24','2024-25(f)']

# ── 1. Departures strip plot ─────────────────────────────────────────────────
print("Processing departures...")
dep_rows = []
with open('data/departures_australia.csv', encoding='utf-8-sig') as f:
    reader = csv.reader(f)
    header = next(reader)
    for row in reader:
        if len(row) < 2: continue
        sacc = row[0].strip()
        country = row[1].strip()
        if sacc in ['1101','1102','1199']: continue
        if 'nec' in country.lower(): continue
        country = re.sub(r'\([a-z]\)', '', country).strip()
        continent = get_continent_sacc(sacc)
        if not continent: continue
        total = 0
        for i in range(len(years)):
            try:
                val = row[i+2].replace(',','').strip()
                total += int(float(val)) if val else 0
            except:
                pass
        if total > 0:
            dep_rows.append({'display_country': country, 'continent': continent, 'value': total})

dep_rows.sort(key=lambda x: -x['value'])
with open('data/chart_strip_departures_all.csv', 'w', newline='') as f:
    writer = csv.DictWriter(f, fieldnames=['display_country','continent','value'])
    writer.writeheader()
    writer.writerows(dep_rows)
print(f"  Saved {len(dep_rows)} countries to data/chart_strip_departures_all.csv")

# ── 2. Remittances strip plot ────────────────────────────────────────────────
print("Processing remittances...")
rem_rows = []
with open('data/remittances.csv') as f:
    reader = csv.DictReader(f)
    for row in reader:
        code = row['Country Code'].strip()
        continent = iso3_continent.get(code)
        if not continent: continue
        # Use latest available year
        val = ''
        for yr in ['2023','2022','2021']:
            val = row.get(yr,'').strip()
            if val: break
        if not val: continue
        try:
            rem_rows.append({
                'display_country': row['Country Name'].strip(),
                'continent': continent,
                'value': round(float(val))
            })
        except:
            pass

rem_rows.sort(key=lambda x: -x['value'])
with open('data/chart_strip_remittances_all.csv', 'w', newline='') as f:
    writer = csv.DictWriter(f, fieldnames=['display_country','continent','value'])
    writer.writeheader()
    writer.writerows(rem_rows)
print(f"  Saved {len(rem_rows)} countries to data/chart_strip_remittances_all.csv")

print("\nDone! Update your chart13 and chart14 specs to use:")
print("  data/chart_strip_departures_all.csv")
print("  data/chart_strip_remittances_all.csv")