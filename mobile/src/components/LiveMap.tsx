import React, { useMemo, useRef } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { colors, radius } from '@/theme';

export interface MapPoint {
  lat: number;
  lng: number;
  label?: string;
}

/**
 * Carte interactive temps réel (Leaflet dans une WebView).
 * Couches : Plan (OpenStreetMap), Satellite (Esri World Imagery ≈ Google Earth),
 * Relief (OpenTopoMap) — sélecteur en haut à droite. Aucune clé API requise.
 * Le marqueur véhicule se déplace en direct via injectJavaScript.
 */
export function LiveMap({
  from,
  to,
  current,
  height = 260,
}: {
  from?: MapPoint;
  to?: MapPoint;
  current?: MapPoint | null;
  height?: number;
}) {
  const ref = useRef<WebView>(null);

  const html = useMemo(() => buildHtml({ from, to, current }), [from?.lat, from?.lng, to?.lat, to?.lng]);

  // Déplace le véhicule en direct quand la position change (sans recharger la carte).
  const lastKey = `${current?.lat},${current?.lng}`;
  React.useEffect(() => {
    if (current && ref.current) {
      ref.current.injectJavaScript(`window.moveVehicle && window.moveVehicle(${current.lat},${current.lng}); true;`);
    }
  }, [lastKey]);

  return (
    <View style={[styles.wrap, { height }]}>
      <WebView
        ref={ref}
        originWhitelist={['*']}
        source={{ html }}
        style={styles.web}
        startInLoadingState
        renderLoading={() => (
          <View style={styles.loading}>
            <ActivityIndicator color={colors.brand600} />
          </View>
        )}
        javaScriptEnabled
        domStorageEnabled
        scrollEnabled={false}
      />
    </View>
  );
}

function buildHtml({ from, to, current }: { from?: MapPoint; to?: MapPoint; current?: MapPoint | null }): string {
  const data = JSON.stringify({ from: from ?? null, to: to ?? null, current: current ?? null });
  return `<!DOCTYPE html><html><head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"/>
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<style>html,body,#map{height:100%;width:100%;margin:0;padding:0;background:#eaf1fb}
.leaflet-control-layers{border-radius:10px;font-family:system-ui,sans-serif;font-size:12px}
.lbl{background:#fff;border-radius:6px;padding:1px 6px;font:600 11px system-ui;border:1px solid #e2e8f0}</style>
</head><body><div id="map"></div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
var D = ${data};
var map = L.map('map',{zoomControl:true,attributionControl:false});
var osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19});
var sat = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',{maxZoom:19});
var topo = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',{maxZoom:17});
osm.addTo(map);
L.control.layers({'Plan (OSM)':osm,'Satellite':sat,'Relief':topo},null,{position:'topright',collapsed:false}).addTo(map);
function dot(color){return L.divIcon({className:'',html:'<div style="background:'+color+';width:16px;height:16px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:2px solid #fff;box-shadow:0 1px 3px rgba(0,0,0,.4)"></div>',iconSize:[16,16],iconAnchor:[8,16]});}
function vehIcon(){return L.divIcon({className:'',html:'<div style="background:#f07d1a;width:16px;height:16px;border-radius:50%;border:3px solid #fff;box-shadow:0 0 0 5px rgba(240,125,26,.35)"></div>',iconSize:[16,16],iconAnchor:[8,8]});}
var bounds=[];
if(D.from){L.marker([D.from.lat,D.from.lng],{icon:dot('#16a34a')}).addTo(map).bindTooltip(D.from.label||'Départ',{permanent:false,className:'lbl'});bounds.push([D.from.lat,D.from.lng]);}
if(D.to){L.marker([D.to.lat,D.to.lng],{icon:dot('#e11d48')}).addTo(map).bindTooltip(D.to.label||'Arrivée',{permanent:false,className:'lbl'});bounds.push([D.to.lat,D.to.lng]);}
if(D.from&&D.to){L.polyline([[D.from.lat,D.from.lng],[D.to.lat,D.to.lng]],{color:'#2a44a0',weight:4,dashArray:'8 8',opacity:.8}).addTo(map);}
var veh=null;
if(D.current){veh=L.marker([D.current.lat,D.current.lng],{icon:vehIcon()}).addTo(map);bounds.push([D.current.lat,D.current.lng]);}
if(bounds.length>1){map.fitBounds(bounds,{padding:[36,36],maxZoom:10});}
else if(bounds.length===1){map.setView(bounds[0],11);}
else{map.setView([-18.9,46.7],5);}
window.moveVehicle=function(lat,lng){if(!veh){veh=L.marker([lat,lng],{icon:vehIcon()}).addTo(map);}else{veh.setLatLng([lat,lng]);}};
</script></body></html>`;
}

const styles = StyleSheet.create({
  wrap: { borderRadius: radius.lg, overflow: 'hidden', borderWidth: 1, borderColor: colors.border, backgroundColor: '#eaf1fb' },
  web: { flex: 1, backgroundColor: 'transparent' },
  loading: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
});
