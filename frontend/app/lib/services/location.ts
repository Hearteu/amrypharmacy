import { Location } from "../types/inventory/location";

export async function fetchLocations() {

    const response = await fetch("http://127.0.0.1:8000/pharmacy/locations/");

    if (!response.ok) {
        throw new Error("Failed to fetch data");
    }

    const data: Location[] = await response.json();

    const filteredLocationData = data.filter((location) =>
        [1, 2, 3].includes(location.location_id)
    );

    return filteredLocationData;
}