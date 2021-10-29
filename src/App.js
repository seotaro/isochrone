import React, { useRef, useEffect, useState } from 'react';
import { makeStyles } from "@material-ui/core/styles";
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormControl from '@mui/material/FormControl';
import Slider from '@mui/material/Slider';

import mapboxgl from '!mapbox-gl'; // eslint-disable-line import/no-webpack-loader-syntax

mapboxgl.accessToken = 'pk.eyJ1Ijoic2VvdGFybyIsImEiOiJjazA2ZjV2ODkzbmhnM2JwMGYycmc5OTVjIn0.5k-2FWYVmr5FH7E4Uk6V0g';

const marker = new mapboxgl.Marker();

const DEFAULT_DURATION = 30;

function App() {
  const classes = useStyles();

  const mapContainer = useRef(null);
  const map = useRef(null);
  const [center, setCenter] = useState({ lng: 140.0, lat: 36.0 });
  const [zoom, setZoom] = useState(12);
  const [profile, setProfile] = useState('walking');
  const [duration, setDuration] = useState(DEFAULT_DURATION);
  const [isLoading, setLoading] = useState(false);


  useEffect(() => {
    if (map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/seotaro/ckvc0jbao15i214qq4vdrcwau',
      center: center,
      zoom: zoom,
      hash: true,
    });

    map.current.on('load', () => {
      setLoading(true);

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

        setLoading(false);
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

    setLoading(true);

    // 一旦、クリアする。
    source.setData({
      type: 'FeatureCollection',
      features: []
    });

    (async () => {
      const data = await getIsochrone(profile, duration, center);
      source.setData(data);

      setLoading(false);
    })();

  }, [profile, duration, center]);

  const onChangeProfile = (event) => {
    setProfile(event.target.value);
  }
  const onChangeDuration = (event, value) => {
    setDuration(value);
  }

  return (
    <div>
      <Progress isLoading={isLoading} />
      <div ref={mapContainer} className={classes.mapContainer} />
      <Sidebar
        profile={profile}
        onChangeProfile={onChangeProfile}
        onChangeDuration={onChangeDuration}
      />
    </div>
  );
}
export default App;


const Progress = (props) => {
  const classes = useStyles();
  const { isLoading } = props;

  return (
    <Box className={classes.loading} sx={{ display: 'flex' }} >
      {isLoading ? <CircularProgress /> : null}
    </Box >
  );
}

const Sidebar = (props) => {
  const classes = useStyles();

  const { profile, onChangeProfile, onChangeDuration } = props;

  function valueLabelFormat(value) {
    let label = `${value}`;
    if (value < 60) {
      label = `${value} min`
    } else {
      label = `${value / 60} h`
    }
    return label;
  }

  return (
    <div className={classes.sidebar}>
      <Typography variant="h4" component="div" gutterBottom>
        Mapbox Ishochrone sample
      </Typography>
      <FormControl component="fieldset">
        <RadioGroup
          row
          aria-label="profile"
          defaultValue="walking"
          name="radio-buttons-group"
          value={profile}
          onChange={onChangeProfile}
        >
          <FormControlLabel value="walking" control={<Radio />} label="walking" />
          <FormControlLabel value="cycling" control={<Radio />} label="cycling" />
          <FormControlLabel value="driving" control={<Radio />} label="driving" />
        </RadioGroup>
      </FormControl>

      <Slider
        aria-label="duration"
        defaultValue={DEFAULT_DURATION}
        valueLabelFormat={valueLabelFormat}
        valueLabelDisplay="auto"
        min={1}
        max={60}
        onChangeCommitted={onChangeDuration}
      />
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









const useStyles = makeStyles(() => ({
  mapContainer: {
    height: '100vh'
  },
  sidebar: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    color: '#000',
    padding: 12,
    zIndex: 1,
    position: 'absolute',
    top: 0,
    left: 0,
    margin: 12,
    borderRadius: 4,
  },
  loading: {
    zIndex: 10,
    position: 'absolute',
    top: '50%',
    left: '50%',
  },
}));
