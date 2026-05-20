# Who Comes, Who Goes: Australia's Migration Story

FIT2179 Data Visualisation 2 assignment — single-page Vega-Lite visualisation hosted on GitHub Pages.

## Project structure

```
├── index.html                 # Main page (layout, narrative, vega-embed)
├── specs/
│   ├── chart1_dual_axis.json
│   ├── chart2_bar_top10.json
│   ├── chart3_waffle.json
│   ├── chart4_bump.json
│   ├── chart5_heatmap.json
│   ├── chart6_diverging.json
│   ├── chart7_choropleth.json
│   ├── chart8_small_multiples.json
│   ├── chart9_flow_map.json
│   └── chart10_bubble.json
├── scripts/
│   └── process_data.py        # Wide → long CSV conversion and derived datasets
├── data/
│   ├── departures_australia.csv   # Raw ABS (wide)
│   ├── arrivals_australia.csv
│   ├── departures_*.csv           # Per state/territory
│   ├── remittances.csv.xls        # World Bank (or remittances.csv)
│   ├── *_long.csv                 # Generated long-format files
│   ├── chart*.csv                 # Chart-specific derived data
│   ├── australian-states.json
│   └── world-countries-110m.json
└── README.md
```

## How to run

### 1. Process data

```bash
python3 scripts/process_data.py
```

Requires `pandas` and `xlrd` (for `remittances.csv.xls`):

```bash
pip install pandas xlrd openpyxl
```

The script reads wide-format ABS CSVs and World Bank remittances from `data/remittances.csv` or `data/remittances.csv.xls`, then writes cleaned long-format and chart-ready CSVs into `data/`.

### 2. View locally

Serve the project root (required for Vega to load JSON/CSV via relative URLs):

```bash
python3 -m http.server 8000
```

Open [http://localhost:8000](http://localhost:8000).

### 3. GitHub Pages

Push to a GitHub repository, enable Pages from the `main` branch (root folder), and open your `*.github.io` URL.

## Data sources

| File | Source |
|------|--------|
| `departures_australia.csv`, `arrivals_australia.csv`, `departures_*.csv` | [ABS Overseas Migration 2024–25](https://www.abs.gov.au/statistics/people/population/overseas-migration/latest-release) |
| `remittances.csv.xls` | [World Bank — Personal remittances, received (BX.TRF.PWKR.CD.DT)](https://data.worldbank.org/indicator/BX.TRF.PWKR.CD.DT?locations=AU) |
| `australian-states.json` | [tonywr71/GeoJson-Data](https://github.com/tonywr71/GeoJson-Data) |
| `world-countries-110m.json` | [world-atlas](https://github.com/topojson/world-atlas) |

## Top 10 countries (consistent across charts)

China, India, UK, New Zealand, Malaysia, Korea South, Indonesia, USA, Philippines, Japan

(ABS names: `UK, CIs & IOM`, `Korea, South`, etc.)

## Technical notes

- Vega-Lite v5 via jsDelivr CDN; specs use `"width": "container"` and relative `data/` paths.
- ABS financial years (e.g. `2004-05`) are aligned to World Bank calendar years (`2004` → `2004-05`).
- Chart 10 remittances are Australia's national total allocated by each country's share of top-10 departures (approximation; see chart subtitle).

## Author

[Your Name] — 2026

AI acknowledgement: ChatGPT/Claude used for code generation and grammar checking.
