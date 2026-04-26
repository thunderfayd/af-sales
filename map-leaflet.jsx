// map-leaflet.jsx — Real Leaflet map with CartoDB Dark Matter (no labels) tiles,
// AF gold pins, marker clustering, long-press to drop notes, "me" dot, route line.
//
// Depends on Leaflet 1.9.4 + leaflet.markercluster being loaded by index.

const { useState: useStateML, useEffect: useEffectML, useRef: useRefML, useMemo: useMemoML } = React;

// Manitowoc County rough bounds
const COUNTY_BOUNDS = [[44.00, -87.95], [44.30, -87.45]];

// "Drayk's location" — downtown Manitowoc apartment-ish, mocked
const ME_LOCATION = [44.0890, -87.6580];

// AF gold pin SVG factory — returns Leaflet divIcon
function afPinIcon(L, { color, ring, pulse, selected, label }) {
  const size = selected ? 44 : 36;
  const inner = selected ? 14 : 12;
  const ringOpacity = selected ? 0.9 : 0.55;
  const html = `
    <div class="af-pin ${pulse ? 'pulse' : ''} ${selected ? 'selected' : ''}" style="--c:${color};--r:${ring};">
      <div class="af-pin-ring"></div>
      <div class="af-pin-dot"></div>
      ${label ? `<div class="af-pin-label">${label}</div>` : ''}
    </div>
  `;
  return L.divIcon({
    html, className: 'af-pin-wrap',
    iconSize: [size, size], iconAnchor: [size/2, size/2]
  });
}

function clusterIcon(L, count) {
  const html = `<div class="af-cluster"><span>${count}</span></div>`;
  return L.divIcon({
    html, className: 'af-cluster-wrap',
    iconSize: [40, 40], iconAnchor: [20, 20]
  });
}

function meIcon(L) {
  return L.divIcon({
    html: `<div class="af-me"><div class="af-me-pulse"></div><div class="af-me-dot"></div></div>`,
    className: 'af-me-wrap',
    iconSize: [22, 22], iconAnchor: [11, 11]
  });
}

function noteIcon(L) {
  return L.divIcon({
    html: `<div class="af-note">★</div>`,
    className: 'af-note-wrap',
    iconSize: [22, 22], iconAnchor: [11, 11]
  });
}

function MapLeaflet({ leads, onSelect, selected, t, setTweak, statusFilter, minStars, typeFilter }) {
  const containerRef = useRefML(null);
  const mapRef = useRefML(null);
  const clusterRef = useRefML(null);
  const markersRef = useRefML(new Map());
  const meMarkerRef = useRefML(null);
  const routeLineRef = useRefML(null);
  const notesLayerRef = useRefML(null);
  const longPressTimerRef = useRefML(null);
  const longPressStartRef = useRefML(null);
  const [notes, setNotes] = useStateML([]);

  // Init map once
  useEffectML(() => {
    if (!containerRef.current || mapRef.current) return;
    const L = window.L;

    const map = L.map(containerRef.current, {
      zoomControl: false,
      attributionControl: false,
      preferCanvas: false,
      zoomSnap: 0.25,
      wheelPxPerZoomLevel: 80,
    }).fitBounds(COUNTY_BOUNDS, { padding: [10, 10] });

    // CartoDB Dark Matter NO LABELS — minimal aesthetic
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png', {
      maxZoom: 19, minZoom: 9,
      subdomains: 'abcd',
      attribution: ''
    }).addTo(map);

    // Gold tint overlay over the basemap
    const tint = L.DomUtil.create('div', 'af-map-tint');
    map.getPanes().tilePane.appendChild(tint);

    // Cluster group
    const cluster = L.markerClusterGroup({
      iconCreateFunction: (c) => clusterIcon(L, c.getChildCount()),
      maxClusterRadius: 38,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      animate: true,
    });
    map.addLayer(cluster);

    // Notes layer
    const notesLayer = L.layerGroup().addTo(map);

    // "Me" marker
    const me = L.marker(ME_LOCATION, { icon: meIcon(L), interactive: false, zIndexOffset: 1000 }).addTo(map);

    mapRef.current = map;
    clusterRef.current = cluster;
    notesLayerRef.current = notesLayer;
    meMarkerRef.current = me;

    // Recenter listener (fired by FAB outside this component)
    const onRecenter = () => map.flyToBounds(COUNTY_BOUNDS, { padding: [10, 10], duration: 0.6 });
    window.addEventListener('af-recenter', onRecenter);

    return () => {
      window.removeEventListener('af-recenter', onRecenter);
      map.remove(); mapRef.current = null;
    };
  }, []);

  // Sync filtered leads → markers
  useEffectML(() => {
    const map = mapRef.current; const cluster = clusterRef.current;
    if (!map || !cluster) return;
    const L = window.L;

    cluster.clearLayers();
    markersRef.current.clear();

    const filtered = leads.filter(l =>
      statusFilter.includes(l.status) &&
      l.stars >= minStars &&
      (typeFilter.length === 0 || typeFilter.includes(l.type))
    );

    const markers = [];
    for (const lead of filtered) {
      if (lead.lat == null || lead.lng == null) continue;
      const status = window.AF_STATUS[lead.status];
      const isPulse = lead.status === 'uncontacted' && lead.stars === 5 && lead.priority;
      const isSel = selected && selected.id === lead.id;
      const m = L.marker([lead.lat, lead.lng], {
        icon: afPinIcon(L, {
          color: status.color,
          ring: 'rgba(212,168,71,0.6)',
          pulse: isPulse,
          selected: isSel,
        }),
        riseOnHover: true,
      });
      m.bindTooltip(lead.name, {
        direction: 'top', offset: [0, -18],
        className: 'af-tip', opacity: 1,
      });
      m.on('click', () => onSelect(lead));
      markers.push(m);
      markersRef.current.set(lead.id, m);
    }
    cluster.addLayers(markers);
  }, [leads, statusFilter, minStars, typeFilter, selected]);

  // Route line from me → selected
  useEffectML(() => {
    const map = mapRef.current; if (!map) return;
    const L = window.L;
    if (routeLineRef.current) { map.removeLayer(routeLineRef.current); routeLineRef.current = null; }
    if (!selected || selected.lat == null) return;

    const line = L.polyline([ME_LOCATION, [selected.lat, selected.lng]], {
      color: '#D4A847',
      weight: 2.5,
      opacity: 0.9,
      dashArray: '6 6',
      className: 'af-route-line',
    }).addTo(map);
    routeLineRef.current = line;

    // Pan to fit both points
    const b = L.latLngBounds([ME_LOCATION, [selected.lat, selected.lng]]);
    map.flyToBounds(b, { padding: [60, 60], duration: 0.6, maxZoom: 15 });
  }, [selected]);

  // Long-press to drop a note
  useEffectML(() => {
    const map = mapRef.current; if (!map) return;
    const onDown = (e) => {
      longPressStartRef.current = e.latlng;
      longPressTimerRef.current = setTimeout(() => {
        const L = window.L;
        const ll = longPressStartRef.current;
        if (!ll) return;
        const m = L.marker(ll, { icon: noteIcon(L) });
        const id = `n${Date.now()}`;
        const text = prompt('Drop a note here:');
        if (text) {
          m.bindTooltip(text, { direction: 'top', offset: [0, -10], className: 'af-tip-note', permanent: false });
          notesLayerRef.current.addLayer(m);
          setNotes(prev => [...prev, { id, latlng: ll, text }]);
        }
      }, 550);
    };
    const onUpOrMove = () => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
    };
    map.on('mousedown', onDown);
    map.on('mouseup', onUpOrMove);
    map.on('mousemove', onUpOrMove);
    map.on('movestart', onUpOrMove);
    return () => {
      map.off('mousedown', onDown);
      map.off('mouseup', onUpOrMove);
      map.off('mousemove', onUpOrMove);
      map.off('movestart', onUpOrMove);
    };
  }, []);

  return (
    <div ref={containerRef} className="af-leaflet" style={{ position: 'absolute', inset: 0 }} />
  );
}

window.MapLeaflet = MapLeaflet;
window.ME_LOCATION = ME_LOCATION;
