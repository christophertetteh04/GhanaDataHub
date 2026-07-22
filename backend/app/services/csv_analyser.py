import csv
import io
import logging
import math
import statistics
from datetime import datetime
from typing import Optional


logger = logging.getLogger("csv_analyser")


def analyse_csv_locally(content_bytes: bytes) -> dict:
    """Parse the CSV and compute statistics for every column."""
    reader = csv.reader(io.StringIO(content_bytes.decode("utf-8", errors="ignore")))
    rows = list(reader)
    if len(rows) < 2:
        return {"error": "File has fewer than 2 rows"}

    headers = rows[0]
    data_rows = rows[1:]
    total_rows = len(data_rows)
    total_cells = total_rows * len(headers)
    column_profiles = []

    for col_idx, col_name in enumerate(headers):
        values = [row[col_idx] if col_idx < len(row) else "" for row in data_rows]
        non_empty = [v for v in values if v.strip() != ""]
        null_count = total_rows - len(non_empty)
        null_rate = round(null_count / total_rows * 100, 1) if total_rows > 0 else 0
        unique_values = set(v.strip() for v in non_empty)
        unique_count = len(unique_values)

        numeric_values = []
        for value in non_empty:
            try:
                numeric_values.append(float(value.replace(",", "").replace("%", "").strip()))
            except ValueError:
                pass

        is_numeric = len(numeric_values) / len(non_empty) > 0.7 if non_empty else False

        profile = {
            "name": col_name,
            "type": "numeric" if is_numeric else "categorical" if unique_count < 20 else "text",
            "null_count": null_count,
            "null_rate_pct": null_rate,
            "unique_count": unique_count,
        }

        if is_numeric and numeric_values:
            profile.update(
                {
                    "min": round(min(numeric_values), 4),
                    "max": round(max(numeric_values), 4),
                    "mean": round(statistics.mean(numeric_values), 4),
                    "median": round(statistics.median(numeric_values), 4),
                    "std_dev": round(statistics.stdev(numeric_values), 4)
                    if len(numeric_values) > 1
                    else 0,
                }
            )

            mean = statistics.mean(numeric_values)
            std = statistics.stdev(numeric_values) if len(numeric_values) > 1 else 0
            if std > 0:
                anomalies = [v for v in numeric_values if abs(v - mean) > 3 * std]
                profile["anomaly_count"] = len(anomalies)
                profile["has_anomalies"] = len(anomalies) > 0

        column_profiles.append(profile)

    numeric_cols = [(i, p) for i, p in enumerate(column_profiles) if p["type"] == "numeric"]
    correlations = []
    if len(numeric_cols) >= 2:
        for i in range(len(numeric_cols)):
            for j in range(i + 1, len(numeric_cols)):
                col_i_idx, col_i = numeric_cols[i]
                col_j_idx, col_j = numeric_cols[j]
                vals_i = []
                vals_j = []
                for row in data_rows:
                    try:
                        vi = float(row[col_i_idx].replace(",", "").replace("%", ""))
                        vj = float(row[col_j_idx].replace(",", "").replace("%", ""))
                        vals_i.append(vi)
                        vals_j.append(vj)
                    except (ValueError, IndexError):
                        pass

                if len(vals_i) > 2:
                    n = len(vals_i)
                    mean_i = sum(vals_i) / n
                    mean_j = sum(vals_j) / n
                    num = sum((vals_i[k] - mean_i) * (vals_j[k] - mean_j) for k in range(n))
                    den = math.sqrt(
                        sum((vals_i[k] - mean_i) ** 2 for k in range(n))
                        * sum((vals_j[k] - mean_j) ** 2 for k in range(n))
                    )
                    if den > 0:
                        r = round(num / den, 3)
                        if abs(r) > 0.6:
                            correlations.append(
                                {
                                    "col_a": col_i["name"],
                                    "col_b": col_j["name"],
                                    "r": r,
                                    "strength": "strong" if abs(r) > 0.8 else "moderate",
                                    "direction": "positive" if r > 0 else "negative",
                                }
                            )

    return {
        "total_rows": total_rows,
        "total_columns": len(headers),
        "total_cells": total_cells,
        "completeness_pct": round(
            (total_cells - sum(p["null_count"] for p in column_profiles)) / (total_cells or 1) * 100,
            1,
        ),
        "column_profiles": column_profiles,
        "correlations": correlations,
        "has_anomalies": any(p.get("has_anomalies") for p in column_profiles),
    }


def generate_ai_summary(local_stats: dict, dataset_title: str, first_rows_text: str) -> Optional[str]:
    """Send column stats and first 20 rows to Gemini for a plain-language summary."""
    from app.core.config import settings

    if not settings.GEMINI_API_KEY:
        return None

    try:
        import requests

        prompt = f"""You are a data analyst assistant for GhanaDataHub, a Ghana data portal.
Analyse this dataset and write a plain-language summary for non-technical users.

Dataset title: {dataset_title}
Total rows: {local_stats['total_rows']}
Total columns: {local_stats['total_columns']}
Completeness: {local_stats['completeness_pct']}%

Column profiles:
{local_stats['column_profiles']}

First 20 rows of data:
{first_rows_text}

Write a summary with exactly these sections:
1. WHAT THIS DATASET IS (2-3 sentences explaining what the data contains
   and what it is useful for)
2. KEY FINDINGS (3-4 bullet points of the most interesting observations
   from the data - specific numbers, patterns, or comparisons)
3. DATA QUALITY (1-2 sentences on completeness and any concerns)
4. WHO WOULD USE THIS (1-2 sentences on the ideal audience)

Write in clear, simple English suitable for a government officer,
journalist, or researcher who is not a data scientist.
Do not use technical jargon. Be specific and cite actual numbers
from the data where possible."""

        response = requests.post(
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent",
            headers={
                "Content-Type": "application/json",
                "x-goog-api-key": settings.GEMINI_API_KEY,
            },
            json={
                "contents": [
                    {
                        "parts": [
                            {
                                "text": prompt,
                            }
                        ]
                    }
                ],
                "generationConfig": {
                    "maxOutputTokens": 800,
                },
            },
            timeout=30,
        )
        response.raise_for_status()
        data = response.json()
        return data["candidates"][0]["content"]["parts"][0]["text"]
    except Exception as exc:
        logger.warning("AI summary failed: %s", exc)
        return None


def analyse_csv(content_bytes: bytes, dataset_title: str) -> dict:
    """Run the full analysis. Returns a dict to store as analysis_data."""
    local_stats = analyse_csv_locally(content_bytes)
    if "error" in local_stats:
        return local_stats

    reader = csv.reader(io.StringIO(content_bytes.decode("utf-8", errors="ignore")))
    rows = list(reader)[:21]
    first_rows_text = "\n".join(",".join(row) for row in rows)

    ai_summary = generate_ai_summary(local_stats, dataset_title, first_rows_text)

    return {
        **local_stats,
        "ai_summary": ai_summary,
        "analysed_at": datetime.utcnow().isoformat(),
    }
