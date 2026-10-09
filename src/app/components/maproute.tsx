"use client";

import {
  GoogleMap,
  DirectionsRenderer,
  useJsApiLoader,
} from "@react-google-maps/api";

import { useEffect, useState } from "react";

type Props = {
  origin: string;
  destination: string;
};

const containerStyle = {
  width: "100%",
  height: "400px",
  borderRadius: "24px",
};

const center = {
  lat: -23.55052,
  lng: -46.633308,
};

export default function MapRoute({
  origin,
  destination,
}: Props) {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey:
      process.env
        .NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
  });

  const [directions, setDirections] =
    useState<google.maps.DirectionsResult | null>(
      null
    );

  useEffect(() => {
    if (!isLoaded || !origin || !destination) return;

    const directionsService =
      new google.maps.DirectionsService();

    directionsService.route(
      {
        origin,
        destination,
        travelMode:
          google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (
          status === google.maps.DirectionsStatus.OK &&
          result
        ) {
          setDirections(result);
        }
      }
    );
  }, [isLoaded, origin, destination]);

  if (!isLoaded) {
    return (
      <div className="h-[400px] rounded-3xl bg-zinc-100 flex items-center justify-center">
        Carregando mapa...
      </div>
    );
  }

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={center}
      zoom={12}
      options={{
        streetViewControl: false,
        mapTypeControl: false,
      }}
    >
      {directions && (
        <DirectionsRenderer
          directions={directions}
          options={{
            suppressMarkers: false,
            polylineOptions: {
              strokeColor: "#10b981",
              strokeWeight: 6,
            },
          }}
        />
      )}
    </GoogleMap>
  );
}