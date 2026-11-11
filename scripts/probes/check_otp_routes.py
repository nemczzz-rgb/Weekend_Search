"""Request real walking and ground-transit routes from a local OTP probe server."""

from __future__ import annotations

import json
import urllib.request


ENDPOINT = "http://127.0.0.1:8801/otp/gtfs/v1"
ORIGIN = (55.75250, 37.62315)  # Teatralnaya / Red Square area
DESTINATION = (55.72953, 37.60308)  # Gorky Park area
TIME = "2026-11-14T12:00:00+03:00"


def request(transit: bool, include_geometry: bool = False) -> dict:
    modes = ("direct: [WALK], transitOnly: true, transit: {transit: [{mode: BUS}, {mode: TRAM}]}"
             if transit else "direct: [WALK], directOnly: true")
    query = """{
      planConnection(
        origin: {location: {coordinate: {latitude: %s, longitude: %s}}}
        destination: {location: {coordinate: {latitude: %s, longitude: %s}}}
        dateTime: {earliestDeparture: \"%s\"}
        modes: {%s}
      ) {
        edges { node { start end legs { mode distance duration legGeometry { points } route { shortName } } } }
      }
    }""" % (*ORIGIN, *DESTINATION, TIME, modes)
    payload = json.dumps({"query": query}).encode("utf-8")
    call = urllib.request.Request(ENDPOINT, payload, {"Content-Type": "application/json"})
    with urllib.request.urlopen(call, timeout=60) as response:
        result = json.load(response)
    if result.get("errors"):
        raise RuntimeError(result["errors"])
    routes = []
    for edge in result["data"]["planConnection"]["edges"]:
        node = edge["node"]
        legs = node["legs"]
        item = {
            "start": node["start"], "end": node["end"],
            "modes": [leg["mode"] for leg in legs],
            "routes": [leg["route"]["shortName"] for leg in legs if leg.get("route")],
            "distance_m": round(sum(leg["distance"] for leg in legs)),
            "geometry_present": all(bool(leg.get("legGeometry", {}).get("points")) for leg in legs),
        }
        if include_geometry:
            item["legs"] = [{"mode": leg["mode"], "route": leg["route"]["shortName"] if leg.get("route") else None,
                             "points": leg.get("legGeometry", {}).get("points")} for leg in legs]
        routes.append(item)
    return {"mode_request": "ground_transit_and_walk" if transit else "walk", "count": len(routes), "itineraries": routes[:3]}


if __name__ == "__main__":
    print(json.dumps([request(False), request(True)], ensure_ascii=True, indent=2))
