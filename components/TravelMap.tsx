"use client";

import World from "@svg-maps/world";

type Props = {
  visited: Set<string>;
  selected?: string | null;
  onCountryClick: (countryCode: string) => void;
};

export default function TravelMap({
  visited,
  selected,
  onCountryClick,
}: Props) {
  return (
    <svg
      viewBox={World.viewBox}
      xmlns="http://www.w3.org/2000/svg"
      className="travel-map"
      role="img"
      aria-label="World map"
    >
      {World.locations.map((location) => {
        const id = location.id.toUpperCase();
        const isVisited = visited.has(id);
        const isSelected = selected === id;

        return (
          <path
            key={location.id}
            d={location.path}
            className={[
              "svg-map__location",
              isVisited ? "visited" : "",
              isSelected ? "current" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            onClick={() => onCountryClick(id)}
            role="button"
            tabIndex={0}
            aria-label={location.name}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onCountryClick(id);
              }
            }}
          />
        );
      })}
    </svg>
  );
}
