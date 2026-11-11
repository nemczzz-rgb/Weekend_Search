"""Inspect the six public Moscow GTFS component exports without copying their content."""

from __future__ import annotations

import argparse
import csv
import io
import json
import zipfile
from collections import Counter
from datetime import date
from pathlib import Path


COMPONENTS = {60662: "stops", 60663: "agency", 60664: "routes", 60665: "trips", 60666: "calendar"}


def read_json_export(folder: Path, dataset_id: int):
    with zipfile.ZipFile(folder / f"{dataset_id}JSON.zip") as archive:
        with archive.open(archive.namelist()[0]) as stream:
            return json.load(stream)


def active_services(calendar, target: date):
    ymd = target.strftime("%Y%m%d")
    weekday = target.strftime("%A").lower()
    return {str(row["service_id"]) for row in calendar
            if str(row["start_date"]) <= ymd <= str(row["end_date"])
            and int(row[weekday]) == 1}


def inspect(folder: Path):
    data = {name: read_json_export(folder, dataset_id) for dataset_id, name in COMPONENTS.items()}
    stops = {str(row["stop_id"]) for row in data["stops"]}
    agencies = {str(row["agency_code"]) for row in data["agency"]}
    routes = {str(row["route_id"]) for row in data["routes"]}
    services = {str(row["service_id"]) for row in data["calendar"]}
    trips = {str(row["trip_id"]) for row in data["trips"]}
    report = {
        "counts": {name: len(rows) for name, rows in data.items()},
        "route_types": dict(Counter(str(row["route_type"]) for row in data["routes"])),
        "unknown_agency_on_routes": sum(str(row["agency_code"]) not in agencies for row in data["routes"]),
        "unknown_route_on_trips": sum(str(row["route_id"]) not in routes for row in data["trips"]),
        "unknown_service_on_trips": sum(str(row["service_id"]) not in services for row in data["trips"]),
        "stops_without_point": sum(not row.get("geoData") for row in data["stops"]),
    }
    for target in (date(2026, 11, 9), date(2026, 11, 14), date(2026, 11, 15)):
        active = active_services(data["calendar"], target)
        report[f"active_trips_{target}"] = sum(str(row["service_id"]) in active for row in data["trips"])

    path = folder / "60661CSV.zip"
    with zipfile.ZipFile(path) as archive:
        entry = archive.infolist()[0]
        report["stop_times_uncompressed_bytes"] = entry.file_size
        with archive.open(entry) as binary:
            with io.TextIOWrapper(binary, encoding="utf-8-sig", newline="") as text:
                reader = csv.reader(text, delimiter=";")
                english = next(reader)
                next(reader)  # The second line repeats field names in Russian.
                report["stop_times_columns"] = english[:6]
                row_count = 0
                unknown_trips = 0
                unknown_stops = 0
                malformed = 0
                stop_count_by_trip = Counter()
                for row in reader:
                    row_count += 1
                    if len(row) < 10:
                        malformed += 1
                        continue
                    trip_id = row[2]
                    if trip_id not in trips:
                        unknown_trips += 1
                    if row[5] not in stops:
                        unknown_stops += 1
                    stop_count_by_trip[trip_id] += 1
                report["stop_times_rows"] = row_count
                report["malformed_stop_times_rows"] = malformed
                report["unknown_trip_stop_times_rows"] = unknown_trips
                report["unknown_stop_stop_times_rows"] = unknown_stops
                report["trips_with_fewer_than_two_stops"] = sum(stop_count_by_trip[trip_id] < 2 for trip_id in trips)
                report["trips_without_stop_times"] = sum(trip_id not in stop_count_by_trip for trip_id in trips)
    return report


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("folder", type=Path, help="Ignored local folder containing 60661CSV.zip and five JSON zips")
    print(json.dumps(inspect(parser.parse_args().folder), ensure_ascii=False, indent=2))
