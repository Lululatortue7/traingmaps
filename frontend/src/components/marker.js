import { MapContainer, TileLayer, Marker, Popup, Tooltip } from 'react-leaflet';

export default function DestinationMarker({coords, city, permanent, image, onClick, icon}) {
    return (
        <Marker
            position={coords}
            icon={icon}
            eventHandlers={{
              click: () => onClick(city), // Ouvre le modal au clic,
            }}
          >
            <Tooltip permanent={permanent}>
              <div>
                <h3>{city}</h3>
                {image && <img src={image} alt={`View of ${city}`} style={{ width: '200px', height: 'auto', borderRadius: '10px' }} />}
              </div>
            </Tooltip>
          </Marker>
    )
}