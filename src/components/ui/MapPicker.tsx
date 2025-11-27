"use client";

import { useState, useMemo, useEffect } from "react";
import { GoogleMap, useLoadScript, Marker } from "@react-google-maps/api";
import usePlacesAutocomplete, {
    getGeocode,
    getLatLng,
} from "use-places-autocomplete";
import { Search, MapPin } from "lucide-react";

interface Location {
    lat: number;
    lng: number;
    address?: string;
}

interface MapPickerProps {
    onLocationSelect: (location: Location) => void;
    initialLocation?: Location;
}

const libraries: ("places")[] = ["places"];

export default function MapPicker({ onLocationSelect, initialLocation }: MapPickerProps) {
    const { isLoaded } = useLoadScript({
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
        libraries,
    });

    if (!isLoaded) return <div className="h-[300px] w-full bg-[var(--color-card)] animate-pulse rounded-lg border border-[var(--color-border)] flex items-center justify-center text-[var(--color-muted)]">Harita yükleniyor...</div>;

    return <Map onLocationSelect={onLocationSelect} initialLocation={initialLocation} />;
}

function Map({ onLocationSelect, initialLocation }: MapPickerProps) {
    const center = useMemo(() => initialLocation || { lat: 41.0082, lng: 28.9784 }, [initialLocation]);
    const [selected, setSelected] = useState<Location | null>(initialLocation || null);
    const [mapRef, setMapRef] = useState<google.maps.Map | null>(null);

    const onMapClick = (e: google.maps.MapMouseEvent) => {
        if (e.latLng) {
            const lat = e.latLng.lat();
            const lng = e.latLng.lng();
            const newLoc = { lat, lng };
            setSelected(newLoc);
            onLocationSelect(newLoc);
        }
    };

    const handleSelectPlace = async (address: string, lat: number, lng: number) => {
        const newLoc = { lat, lng, address };
        setSelected(newLoc);
        onLocationSelect(newLoc);
        mapRef?.panTo({ lat, lng });
        mapRef?.setZoom(15);
    };

    return (
        <div className="flex flex-col gap-2">
            <PlacesAutocomplete onSelect={handleSelectPlace} />
            <div className="h-[300px] w-full rounded-lg overflow-hidden border border-[var(--color-border)] relative">
                <GoogleMap
                    zoom={13}
                    center={center}
                    mapContainerClassName="w-full h-full"
                    onClick={onMapClick}
                    onLoad={(map) => setMapRef(map)}
                    options={{
                        disableDefaultUI: false,
                        zoomControl: true,
                        streetViewControl: false,
                        mapTypeControl: false,
                        fullscreenControl: false,
                    }}
                >
                    {selected && <Marker position={selected} />}
                </GoogleMap>
            </div>
        </div>
    );
}

const PlacesAutocomplete = ({ onSelect }: { onSelect: (address: string, lat: number, lng: number) => void }) => {
    const {
        ready,
        value,
        setValue,
        suggestions: { status, data },
        clearSuggestions,
    } = usePlacesAutocomplete();

    const handleSelect = async (address: string) => {
        setValue(address, false);
        clearSuggestions();

        try {
            const results = await getGeocode({ address });
            const { lat, lng } = await getLatLng(results[0]);
            onSelect(address, lat, lng);
        } catch (error) {
            console.error("Error: ", error);
        }
    };

    return (
        <div className="relative w-full z-10">
            <div className="relative">
                <input
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    disabled={!ready}
                    className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg pl-10 pr-4 py-2 text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all text-sm"
                    placeholder="Mekan ara..."
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-muted)]" />
            </div>
            {status === "OK" && (
                <ul className="absolute top-full left-0 right-0 mt-1 bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg shadow-xl max-h-60 overflow-y-auto z-50">
                    {data.map(({ place_id, description }) => (
                        <li
                            key={place_id}
                            onClick={() => handleSelect(description)}
                            className="px-4 py-2 hover:bg-[var(--color-background)] cursor-pointer text-sm text-[var(--color-text)] flex items-center gap-2 border-b border-[var(--color-border)] last:border-0"
                        >
                            <MapPin className="h-4 w-4 text-[var(--color-primary)] shrink-0" />
                            <span className="truncate">{description}</span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};
