import { API_URL } from "../api-config";
import { Location } from "../types/location";

export async function fetchLocations() {

    const response = await fetch(`${API_URL}/locations/`);

    if (!response.ok) {
        throw new Error("Failed to fetch data");
    }

    const data: Location[] = await response.json();

    const filteredLocationData = data.filter((location) =>
        [1, 2, 3].includes(location.location_id)
    );

    return filteredLocationData;
}

export async function fetchUserLocations() {

    const response = await fetch(`${API_URL}/locations/`);

    if (!response.ok) {
        throw new Error("Failed to fetch data");
    }

    const data: Location[] = await response.json();

    const filteredLocationData = data.filter((location) =>
        [2, 8].includes(location.location_id)
    );

    return filteredLocationData;
}