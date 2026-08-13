"use client";

import { SVGMap } from "react-svg-map";
import World from "@svg-maps/world";

type Props = {
  visited: Set<string>;
  selected?: string | null;
  onCountryClick: (countryCode: string) => void;
};

export default function TravelMap({ visited, selected, onCountryClick }: Props) {
  return (
    <SVGMap
      map={World}
      onLocationClick={(event: React.MouseEvent<SVGElement>) => {
        const target = event.currentTarget as SVGElement;
        const id = target.getAttribute("id");
        if (id) onCountryClick(id.toUpperCase());
      }}
      locationClassName={(location) => {
        const id = location.id.toUpperCase();
        return [
          "svg-map__location",
          visited.has(id) ? "visited" : "",
          selected === id ? "current" : ""
        ].filter(Boolean).join(" ");
      }}
    />
  );
}