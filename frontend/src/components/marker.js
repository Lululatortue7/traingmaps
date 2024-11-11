import { Marker, Tooltip } from 'react-leaflet';

export default function DestinationMarker({ coords, city, image, onClick, icon, permanent }) {
    return (
        <Marker
            position={coords}
            icon={icon}
            eventHandlers={{
                click: () => onClick(city),
            }}
        >
            <Tooltip
                className="custom-tooltip"
                direction="top"
                offset={[0, -20]}
                permanent={permanent} // Affiche le Tooltip de manière permanente si true
            >
                <div className="tooltip-content" style={{ cursor: 'pointer', textAlign: 'center' }}>
                    <h3 className="tooltip-title">{city}</h3>
                    {image && (
                        <img
                            src={image}
                            alt={`View of ${city}`}
                            className="tooltip-image"
                            style={{
                                width: '100px',
                                height: 'auto',
                                borderRadius: '5px',
                                marginTop: '5px',
                            }}
                        />
                    )}
                </div>
            </Tooltip>
        </Marker>
    );
}
