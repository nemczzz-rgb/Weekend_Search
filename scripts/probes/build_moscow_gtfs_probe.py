"""Build a date-limited, ground-transit GTFS probe from official Moscow exports.

This is diagnostic input for TASK-003, not a production import. It excludes
agencies without the mandatory GTFS agency_url and rows lacking references.
"""

from __future__ import annotations

import argparse
import csv
import io
import json
import zipfile
from collections import Counter
from datetime import date
from pathlib import Path

from inspect_moscow_gtfs import active_services, read_json_export


def write_rows(archive, name, fields, rows):
    with archive.open(name, "w") as binary:
        with io.TextIOWrapper(binary, encoding="utf-8", newline="") as text:
            writer = csv.DictWriter(text, fieldnames=fields, extrasaction="ignore")
            writer.writeheader()
            for row in rows:
                writer.writerow(row)


def build(folder: Path, target: date, output: Path):
    agencies = read_json_export(folder, 60663)
    stops = read_json_export(folder, 60662)
    routes = read_json_export(folder, 60664)
    trips = read_json_export(folder, 60665)
    calendar = read_json_export(folder, 60666)

    valid_agencies = {str(row["agency_code"]) for row in agencies if row.get("agency_url")}
    valid_routes = {str(row["route_id"]) for row in routes
                    if str(row["agency_code"]) in valid_agencies}
    active = active_services(calendar, target)
    selected_trips = {str(row["trip_id"]) for row in trips
                      if str(row["route_id"]) in valid_routes and str(row["service_id"]) in active}
    selected_services = {str(row["service_id"]) for row in trips
                         if str(row["trip_id"]) in selected_trips}
    valid_stops = {str(row["stop_id"]) for row in stops if row.get("geoData")}

    output.parent.mkdir(parents=True, exist_ok=True)
    stop_times_count = 0
    stop_counts = Counter()
    with zipfile.ZipFile(output, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=6) as result:
        write_rows(result, "agency.txt", ["agency_id", "agency_name", "agency_url", "agency_timezone"],
                   ({"agency_id": row["agency_code"], "agency_name": row["agency_name"],
                     "agency_url": row["agency_url"], "agency_timezone": row["agency_timezone"]}
                    for row in agencies if str(row["agency_code"]) in valid_agencies))
        write_rows(result, "routes.txt", ["route_id", "agency_id", "route_short_name", "route_long_name", "route_type"],
                   ({"route_id": row["route_id"], "agency_id": row["agency_code"],
                     "route_short_name": row["route_short_name"], "route_long_name": row["route_long_name"],
                     "route_type": row["route_type"]}
                    for row in routes if str(row["route_id"]) in valid_routes))
        write_rows(result, "calendar.txt", ["service_id", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday", "start_date", "end_date"],
                   (row for row in calendar if str(row["service_id"]) in selected_services))
        write_rows(result, "trips.txt", ["route_id", "service_id", "trip_id", "direction_id"],
                   (row for row in trips if str(row["trip_id"]) in selected_trips))
        write_rows(result, "stops.txt", ["stop_id", "stop_name", "stop_lat", "stop_lon"],
                   ({"stop_id": row["stop_id"], "stop_name": row["stop_name"],
                     "stop_lat": row["geoData"][0]["coordinates"][1],
                     "stop_lon": row["geoData"][0]["coordinates"][0]}
                    for row in stops if str(row["stop_id"]) in valid_stops))
        with zipfile.ZipFile(folder / "60661CSV.zip") as source:
            with source.open(source.namelist()[0]) as binary:
                with io.TextIOWrapper(binary, encoding="utf-8-sig", newline="") as text:
                    reader = csv.reader(text, delimiter=";")
                    next(reader)
                    next(reader)
                    with result.open("stop_times.txt", "w") as target_binary:
                        with io.TextIOWrapper(target_binary, encoding="utf-8", newline="") as target_text:
                            writer = csv.writer(target_text)
                            writer.writerow(("trip_id", "arrival_time", "departure_time", "stop_id", "stop_sequence"))
                            for row in reader:
                                if row[2] in selected_trips and row[5] in valid_stops:
                                    writer.writerow((row[2], row[3], row[4], row[5], row[9]))
                                    stop_times_count += 1
                                    stop_counts[row[2]] += 1
    return {"date": str(target), "agencies": len(valid_agencies), "routes": len(valid_routes),
            "services": len(selected_services), "trips": len(selected_trips),
            "stop_times": stop_times_count, "trips_with_fewer_than_two_stops":
            sum(stop_counts[trip_id] < 2 for trip_id in selected_trips),
            "output_bytes": output.stat().st_size}


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("folder", type=Path)
    parser.add_argument("output", type=Path)
    parser.add_argument("--date", type=date.fromisoformat, default=date(2026, 11, 14))
    args = parser.parse_args()
    print(json.dumps(build(args.folder, args.date, args.output), ensure_ascii=False, indent=2))
