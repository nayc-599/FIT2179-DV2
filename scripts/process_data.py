#!/usr/bin/env python3
"""
Convert wide-format ABS migration CSVs and World Bank remittances to long format,
plus derived datasets for Vega-Lite charts.
"""

from __future__ import annotations

import re
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data"

TOP_10 = [
    "China",
    "India",
    "UK, CIs & IOM",
    "New Zealand",
    "Malaysia",
    "Korea, South",
    "Indonesia",
    "USA",
    "Philippines",
    "Japan",
]

DISPLAY_NAMES = {
    "China": "China",
    "India": "India",
    "UK, CIs & IOM": "UK",
    "New Zealand": "New Zealand",
    "Malaysia": "Malaysia",
    "Korea, South": "Korea South",
    "Indonesia": "Indonesia",
    "USA": "USA",
    "Philippines": "Philippines",
    "Japan": "Japan",
}

STATE_FILES = {
    "NSW": "departures_nsw.csv",
    "VIC": "departures_vic.csv",
    "QLD": "departures_qld.csv",
    "SA": "departures_sa.csv",
    "WA": "depatures_wa.csv",
    "TAS": "departures_tas.csv",
    "NT": "departures_nt.csv",
    "ACT": "departures_act.csv",
}

# SACC-based continent assignment (approximate for ABS country list)
CONTINENT_MAP: dict[str, str] = {}
_ASIA = {
    "China", "India", "Japan", "Korea, South", "Korea, North", "Indonesia", "Malaysia",
    "Philippines", "Singapore", "Thailand", "Vietnam", "Taiwan", "Hong Kong", "Myanmar",
    "Cambodia", "Laos", "Nepal", "Pakistan", "Bangladesh", "Sri Lanka", "Afghanistan",
    "Mongolia", "Brunei", "Macau", "Maldives", "Bhutan", "East Timor", "Timor-Leste",
}
_EUROPE = {
    "UK, CIs & IOM", "Ireland", "Germany", "France", "Italy", "Netherlands", "Greece",
    "Poland", "Spain", "Portugal", "Sweden", "Norway", "Denmark", "Finland", "Switzerland",
    "Austria", "Belgium", "Croatia", "Serbia", "Romania", "Hungary", "Czechia",
    "Russia", "Ukraine", "Turkey", "Cyprus", "Malta",
}
_OCEANIA = {
    "New Zealand", "Fiji", "Samoa", "Tonga", "PNG", "Vanuatu", "Solomon Islands",
    "Cook Islands", "New Caledonia", "Kiribati", "Micronesia, F S", "Nauru",
}
_AMERICAS = {"USA", "Canada", "Brazil", "Chile", "Argentina", "Mexico", "Colombia", "Peru"}
_AFRICA = {
    "South Africa", "Zimbabwe", "Kenya", "Nigeria", "Egypt", "Ethiopia", "Ghana",
    "Mauritius", "Sudan", "Somalia",
}
_MIDDLE_EAST = {
    "Lebanon", "Israel", "Iran", "Iraq", "Jordan", "Syria", "UAE", "Saudi Arabia",
    "Kuwait", "Qatar", "Bahrain", "Oman", "Yemen",
}
for c in _ASIA:
    CONTINENT_MAP[c] = "Asia"
for c in _EUROPE:
    CONTINENT_MAP[c] = "Europe"
for c in _OCEANIA:
    CONTINENT_MAP[c] = "Oceania"
for c in _AMERICAS:
    CONTINENT_MAP[c] = "Americas"
for c in _AFRICA:
    CONTINENT_MAP[c] = "Africa"
for c in _MIDDLE_EAST:
    CONTINENT_MAP[c] = "Middle East"

CAPITALS = {
    "China": (39.9042, 116.4074),
    "India": (28.6139, 77.2090),
    "UK, CIs & IOM": (51.5074, -0.1278),
    "New Zealand": (-41.2865, 174.7762),
    "Malaysia": (3.1390, 101.6869),
    "Korea, South": (37.5665, 126.9780),
    "Indonesia": (-6.2088, 106.8456),
    "USA": (38.9072, -77.0369),
    "Philippines": (14.5995, 120.9842),
    "Japan": (35.6762, 139.6503),
}
AUSTRALIA = (-35.2809, 149.1300)


def clean_column(name: str) -> str:
    return re.sub(r"\([efgd]\)\s*$", "", str(name)).strip()


def clean_country(name: str) -> str:
    return re.sub(r"\([efgd]\)\s*$", "", str(name)).strip()


def read_wide_departures(path: Path) -> tuple[pd.DataFrame, list[str]]:
    df = pd.read_csv(path, dtype=str)
    cols = list(df.columns)
    df = df.rename(columns={cols[0]: "sacc_code", cols[1]: "country"})
    df["sacc_code"] = df["sacc_code"].str.strip()
    df["country"] = df["country"].apply(clean_country)

    year_cols = [clean_column(c) for c in df.columns[2:]]
    df.columns = ["sacc_code", "country", *year_cols]

    skip_countries = {
        "",
        "Total Australian-born",
        "Total overseas-born",
        "Total",
        "Inadequately Described",
        "Australia",
    }
    df = df[~df["country"].isin(skip_countries)]
    df = df[df["sacc_code"].notna() & (df["sacc_code"] != "") & (df["sacc_code"] != "nan")]
    df = df[~df["sacc_code"].isin({"0000", "1101"})]

    for y in year_cols:
        df[y] = (
            df[y]
            .astype(str)
            .str.replace(",", "", regex=False)
            .str.replace('"', "", regex=False)
        )
        df[y] = pd.to_numeric(df[y], errors="coerce").fillna(0).astype(int)

    df = df[df[year_cols].sum(axis=1) > 0]
    return df, year_cols


def to_long(df: pd.DataFrame, year_cols: list[str], value_name: str) -> pd.DataFrame:
    long_df = df.melt(
        id_vars=["sacc_code", "country"],
        value_vars=year_cols,
        var_name="year",
        value_name=value_name,
    )
    long_df["display_country"] = long_df["country"].map(DISPLAY_NAMES).fillna(long_df["country"])
    return long_df


def continent_from_sacc(sacc: str) -> str:
    """Map ABS SACC chapter codes to six continents."""
    try:
        code = int(float(sacc))
    except (ValueError, TypeError):
        return "Other"
    if 1100 <= code < 2000:
        return "Oceania"
    if 2000 <= code < 3000:
        return "Europe"
    if 3000 <= code < 4000:
        return "Middle East"
    if 4000 <= code < 5000:
        return "Africa"
    if 5000 <= code < 6000:
        return "Asia"
    if 6000 <= code < 7000:
        return "Asia"
    if 7000 <= code < 8000:
        return "Asia"
    if 8000 <= code < 9000:
        return "Americas"
    if 9000 <= code < 9300:
        return "Africa"
    if 9300 <= code < 9400:
        return "Africa"
    return "Other"


def assign_continent(country: str, sacc: str = "") -> str:
    if country in CONTINENT_MAP:
        return CONTINENT_MAP[country]
    if sacc:
        c = continent_from_sacc(sacc)
        if c != "Other":
            return c
    return "Other"


def read_remittances() -> pd.DataFrame:
    xls_path = DATA / "remittances.csv.xls"
    csv_path = DATA / "remittances.csv"
    if csv_path.exists():
        raw = pd.read_csv(csv_path)
    elif xls_path.exists():
        raw = pd.read_excel(xls_path, engine="xlrd")
    else:
        raise FileNotFoundError("Expected data/remittances.csv or data/remittances.csv.xls")

    # Save a plain CSV copy for reference if only the Excel export exists
    if xls_path.exists() and not csv_path.exists():
        raw.to_csv(csv_path, index=False)

    aus = raw[raw["Country Name"] == "Australia"].iloc[0]
    year_cols = [str(y) for y in range(2004, 2025)]
    rows = []
    for y in year_cols:
        if y not in aus.index:
            continue
        val = aus[y]
        if pd.isna(val):
            continue
        fy = f"{y}-{str(int(y) + 1)[-2:]}"
        rows.append({"year": fy, "remittances_usd": float(val)})
    return pd.DataFrame(rows)


def main() -> None:
    DATA.mkdir(parents=True, exist_ok=True)

    dep_wide, years = read_wide_departures(DATA / "departures_australia.csv")
    arr_wide, _ = read_wide_departures(DATA / "arrivals_australia.csv")

    dep_long = to_long(dep_wide, years, "departures")
    arr_long = to_long(arr_wide, years, "arrivals")
    dep_long.to_csv(DATA / "departures_long.csv", index=False)
    arr_long.to_csv(DATA / "arrivals_long.csv", index=False)

    rem = read_remittances()
    rem.to_csv(DATA / "remittances_long.csv", index=False)

    # Chart 1: totals per year
    totals = (
        dep_long.groupby("year", as_index=False)["departures"]
        .sum()
        .merge(rem, on="year", how="inner")
    )
    totals.to_csv(DATA / "chart1_totals.csv", index=False)

    # Chart 2: top 10 bar totals
    top10_dep = dep_long[dep_long["country"].isin(TOP_10)].copy()
    top10_totals = (
        top10_dep.groupby(["country", "display_country"], as_index=False)["departures"]
        .sum()
        .sort_values("departures", ascending=False)
    )
    top10_totals.to_csv(DATA / "chart2_top10_totals.csv", index=False)

    # Chart 3: waffle by continent
    dep_wide["continent"] = dep_wide.apply(
        lambda r: assign_continent(r["country"], r["sacc_code"]), axis=1
    )
    dep_wide.loc[dep_wide["continent"] == "Other", "continent"] = "Asia"

    cont_totals = dep_wide.groupby("continent")[years].sum().sum(axis=1).reset_index()
    cont_totals.columns = ["continent", "departures"]
    cont_totals = cont_totals[cont_totals["continent"] != "Other"]
    cont_totals["pct"] = cont_totals["departures"] / cont_totals["departures"].sum() * 100
    waffle_cells = []
    for _, row in cont_totals.iterrows():
        n = max(1, round(row["pct"]))
        for i in range(n):
            waffle_cells.append(
                {"cell": len(waffle_cells), "continent": row["continent"], "pct": row["pct"]}
            )
    # Pad to 100 cells
    while len(waffle_cells) < 100:
        waffle_cells.append(
            {"cell": len(waffle_cells), "continent": cont_totals.iloc[-1]["continent"], "pct": 0}
        )
    waffle_cells = waffle_cells[:100]
    for i, c in enumerate(waffle_cells):
        c["row"] = i // 10
        c["col"] = i % 10
    pd.DataFrame(waffle_cells).to_csv(DATA / "chart3_waffle.csv", index=False)
    cont_totals.to_csv(DATA / "chart3_continent_totals.csv", index=False)

    # Chart 4 & 5: bump and heatmap (top 10)
    recent_years = [y for y in years if y >= "2014-15"]
    bump = top10_dep[top10_dep["year"].isin(recent_years)].copy()
    ranks = []
    for yr in recent_years:
        yr_data = bump[bump["year"] == yr].sort_values("departures", ascending=False)
        for rank, (_, row) in enumerate(yr_data.iterrows(), start=1):
            ranks.append(
                {
                    "year": yr,
                    "country": row["country"],
                    "display_country": row["display_country"],
                    "departures": row["departures"],
                    "rank": rank,
                }
            )
    pd.DataFrame(ranks).to_csv(DATA / "chart4_bump.csv", index=False)
    top10_dep.to_csv(DATA / "chart5_heatmap.csv", index=False)

    # Chart 6: net migration 2024-25
    latest = "2024-25"
    dep_y = dep_long[dep_long["year"] == latest]
    arr_y = arr_long[arr_long["year"] == latest]
    net = dep_y.merge(
        arr_y[["country", "arrivals"]], on="country", how="inner"
    )
    net["net"] = net["arrivals"] - net["departures"]
    net = net[net["country"].isin(TOP_10)].copy()
    net["display_country"] = net["country"].map(DISPLAY_NAMES)
    net = net.reindex(net["net"].abs().sort_values(ascending=False).index)
    net.to_csv(DATA / "chart6_net_migration.csv", index=False)

    # Chart 7 & 8: state data
    state_rows = []
    for state, fname in STATE_FILES.items():
        path = DATA / fname
        if not path.exists():
            continue
        sw, syears = read_wide_departures(path)
        for y in syears:
            state_rows.append({"state": state, "year": y, "departures": int(sw[y].sum())})
    state_df = pd.DataFrame(state_rows)
    state_df.to_csv(DATA / "chart8_state_timeseries.csv", index=False)
    state_names = {
        "NSW": "New South Wales",
        "VIC": "Victoria",
        "QLD": "Queensland",
        "SA": "South Australia",
        "WA": "Western Australia",
        "TAS": "Tasmania",
        "NT": "Northern Territory",
        "ACT": "Australian Capital Territory",
    }
    state_coords = {
        "ACT": (149.13, -35.47),
        "NSW": (146.50, -32.00),
        "NT": (133.00, -19.50),
        "QLD": (144.50, -22.00),
        "SA": (135.50, -30.00),
        "TAS": (146.50, -42.00),
        "VIC": (144.50, -37.00),
        "WA": (121.00, -25.50),
    }
    choropleth = state_df.groupby("state", as_index=False)["departures"].sum()
    choropleth["state_name"] = choropleth["state"].map(state_names)
    choropleth["longitude"] = choropleth["state"].map(lambda s: state_coords[s][0])
    choropleth["latitude"] = choropleth["state"].map(lambda s: state_coords[s][1])
    choropleth.to_csv(DATA / "chart7_choropleth.csv", index=False)

    # Chart 9: flow map
    flow = top10_totals.copy()
    flow["lat"] = flow["country"].map(lambda c: CAPITALS[c][0])
    flow["lon"] = flow["country"].map(lambda c: CAPITALS[c][1])
    flow["dest_lat"] = AUSTRALIA[0]
    flow["dest_lon"] = AUSTRALIA[1]
    flow["continent"] = flow["country"].map(CONTINENT_MAP)
    flow.to_csv(DATA / "chart9_flow.csv", index=False)

    # Chart 10: bubble (proportional remittances)
    total_rem = rem["remittances_usd"].sum()
    total_dep_all = top10_totals["departures"].sum()
    bubble = top10_totals.merge(
        net[["country", "net"]], on="country", how="left"
    )
    bubble["remittances_share"] = (
        bubble["departures"] / total_dep_all * total_rem
    )
    bubble["continent"] = bubble["country"].map(CONTINENT_MAP)
    bubble.to_csv(DATA / "chart10_bubble.csv", index=False)

    print("Wrote processed CSVs to", DATA)


if __name__ == "__main__":
    main()
