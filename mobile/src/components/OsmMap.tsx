import React, { useEffect, useMemo, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import type { LatLng } from '@/data/roads';
import { colors, radius } from '@/theme';

export interface MapPoint {
  lat: number;
  lng: number;
  label?: string;
}

/**
 * Carte OpenStreetMap (tuiles réelles) via Leaflet dans une WebView :
 * itinéraire (polyligne), points de chargement/livraison et position GPS du
 * véhicule mise à jour en direct. Qualité cartographique supérieure à la carte
 * SVG (nécessite une connexion pour les tuiles OSM).
 */
export function OsmMap({
  from,
  to,
  current,
  route,
  height = 240,
  kmRemaining,
}: {
  from?: MapPoint;
  to?: MapPoint;
  current?: MapPoint | null;
  route?: LatLng[];
  height?: number;
  kmRemaining?: number;
}) {
  const webRef = useRef<WebView>(null);

  const html = useMemo(
    () => buildHtml({ from, to, route: route ?? [], current: current ?? null }),
    // Recharge seulement quand l'itinéraire / extrémités changent (pas à chaque tick GPS).
    [from?.lat, from?.lng, to?.lat, to?.lng, JSON.stringify(route ?? [])],
  );

  // Déplace le marqueur véhicule sans recharger la carte. On réessaie tant que
  // la carte n'est pas prête (chargement Leaflet asynchrone) pour ne jamais
  // « rater » une position GPS.
  useEffect(() => {
    if (current == null || !webRef.current) return;
    const js = `(function(){var la=${current.lat},ln=${current.lng};function go(){if(window.__setVehicle){window.__setVehicle(la,ln);}else{setTimeout(go,300);}}go();})();true;`;
    webRef.current.injectJavaScript(js);
  }, [current?.lat, current?.lng]);

  return (
    <View style={[styles.wrap, { height }]}>
      <WebView
        ref={webRef}
        source={{ html }}
        originWhitelist={['*']}
        javaScriptEnabled
        domStorageEnabled
        startInLoadingState
        androidLayerType="hardware"
        style={styles.web}
        // Laisse la page défiler quand le geste commence hors de la carte.
        nestedScrollEnabled
      />
      {kmRemaining != null && (
        <View style={styles.kmBadge} pointerEvents="none">
          <Text style={styles.kmLabel}>Km restants</Text>
          <Text style={styles.kmValue}>{Math.max(0, Math.round(kmRemaining))} km</Text>
        </View>
      )}
    </View>
  );
}

function buildHtml({ from, to, route, current }: { from?: MapPoint; to?: MapPoint; route: LatLng[]; current: MapPoint | null }) {
  const routeJson = JSON.stringify(route.map(([lat, lng]) => [lat, lng]));
  const fromJson = from ? JSON.stringify([from.lat, from.lng]) : 'null';
  const toJson = to ? JSON.stringify([to.lat, to.lng]) : 'null';
  const curJson = current ? JSON.stringify([current.lat, current.lng]) : 'null';
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"/>
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<style>html,body,#map{height:100%;width:100%;margin:0;padding:0;background:#dbe7f0}
.leaflet-control-attribution{font-size:9px;background:rgba(255,255,255,.7)}</style>
</head>
<body>
<div id="map"></div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
  var ROUTE=${routeJson}, FROM=${fromJson}, TO=${toJson}, CUR=${curJson};
  var map=L.map('map',{zoomControl:true,attributionControl:true});
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© OpenStreetMap'}).addTo(map);
  if(ROUTE.length>1){
    L.polyline(ROUTE,{color:'#ffffff',weight:8,opacity:.75}).addTo(map);
    L.polyline(ROUTE,{color:'#2a44a0',weight:5,opacity:.95}).addTo(map);
  }
  function dot(latlng,fill){return L.circleMarker(latlng,{radius:8,color:'#ffffff',weight:2,fillColor:fill,fillOpacity:1});}
  if(FROM){dot(FROM,'#16a34a').addTo(map).bindPopup('Chargement');}
  if(TO){dot(TO,'#dc2626').addTo(map).bindPopup('Livraison');}
  var veh=null, vehHalo=null, vehInit=false;
  window.__setVehicle=function(lat,lng){
    var ll=[lat,lng];
    if(!veh){
      vehHalo=L.circleMarker(ll,{radius:14,color:'#f07d1a',weight:0,fillColor:'#f07d1a',fillOpacity:.2}).addTo(map);
      veh=L.circleMarker(ll,{radius:8,color:'#ffffff',weight:2,fillColor:'#f07d1a',fillOpacity:1}).addTo(map).bindPopup('Véhicule');
    } else { veh.setLatLng(ll); vehHalo.setLatLng(ll); }
    // Suit le véhicule à chaque mise à jour GPS (pas au tout premier point).
    if(vehInit){ map.panTo(ll,{animate:true,duration:0.6}); }
    vehInit=true;
  };
  var pts=ROUTE.slice(); if(FROM)pts.push(FROM); if(TO)pts.push(TO); if(CUR)pts.push(CUR);
  if(pts.length>0){ try{ map.fitBounds(L.latLngBounds(pts).pad(0.18)); }catch(e){ map.setView(pts[0],7);} }
  else { map.setView([-18.8792,47.5079],6); }
  if(CUR){ window.__setVehicle(CUR[0],CUR[1]); }
</script>
</body>
</html>`;
}

const styles = StyleSheet.create({
  wrap: { backgroundColor: '#dbe7f0', borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  web: { flex: 1, backgroundColor: 'transparent' },
  kmBadge: { position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(255,255,255,0.92)', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, alignItems: 'flex-end' },
  kmLabel: { fontSize: 9, color: colors.inkMuted, fontWeight: '600' },
  kmValue: { fontSize: 15, fontWeight: '800', color: colors.brand700 },
});
