import React, { useRef, useEffect, useState } from 'react';
import mapboxgl from '!mapbox-gl'; // eslint-disable-line import/no-webpack-loader-syntax

mapboxgl.accessToken = 'pk.eyJ1Ijoic2VvdGFybyIsImEiOiJjazA2ZjV2ODkzbmhnM2JwMGYycmc5OTVjIn0.5k-2FWYVmr5FH7E4Uk6V0g';

const marker = new mapboxgl.Marker();

function App() {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [center, setCenter] = useState({ lng: 140.0, lat: 36.0 });
  const [zoom, setZoom] = useState(9);
  const [profile, setProfile] = useState('walking');
  const [duration, setDuration] = useState(60);


  useEffect(() => {
    if (map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/seotaro/ckvc0jbao15i214qq4vdrcwau',
      center: center,
      zoom: zoom
    });

    map.current.on('load', () => {
      marker
        .setLngLat(center)
        .addTo(map.current);

      (async () => {
        const data = await getIsochrone(profile, duration, center);

        map.current.addSource('isochrone', {
          type: 'geojson',
          data: data,
        });

        map.current.addLayer(
          {
            id: 'isoLayer',
            type: 'fill',
            source: 'isochrone',
            layout: {},
            paint: {
              'fill-color': '#2020ff',
              'fill-opacity': 0.5
            }
          },
          'poi-label'
        );

      })();


    });

    map.current.on('moveend', () => {
      setCenter(map.current.getCenter());
      setZoom(map.current.getZoom());
    });
  });

  useEffect(() => {
    if (!map.current) return;

    marker.setLngLat(center);
  }, [center]);

  useEffect(() => {
    if (!map.current) return;

    const source = map.current.getSource('isochrone');
    if (!source) return;

    (async () => {
      const data = await getIsochrone(profile, duration, center);
      source.setData(data);
    })();

  }, [profile, duration, center]);

  return (
    <div>
      <div ref={mapContainer} className="map-container" />
      <Sidebar center={center} zoom={zoom} />
    </div>
  );
}

const Sidebar = (props) => {
  const { center, zoom } = props;

  return (
    <div className="sidebar">
      Longitude: {center.lng} | Latitude: {center.lat} | Zoom: {zoom}
    </div>
  );
}

const getIsochrone = (profile, duration, center) => {
  return fetch(
    `https://api.mapbox.com/isochrone/v1/mapbox/${profile}/${center.lng},${center.lat}?contours_minutes=${duration}&polygons=true&access_token=${mapboxgl.accessToken}`,
    { method: 'GET' }
  )
    .then((query) => {
      return query.json();
    })
}

export default App;
