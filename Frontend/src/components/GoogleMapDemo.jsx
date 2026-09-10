import { APIProvider, Map } from "@vis.gl/react-google-maps"

const initialPosition = {
    lat: -25.4284,
    lng: -49.2733,
};

export default function GoogleMapDemo() {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
        return <p>Chave Google Maps não configurada</p>;
    }

    return (
        <APIProvider apiKey={apiKey}>
            <Map
                defaultCenter={initialPosition}
                defaultZoom={13}
                gestureHandling="greedy"
                style={{ width: "100%", height: "420px" }}
            />
        </APIProvider>
    );
}