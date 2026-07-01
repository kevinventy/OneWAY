import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { WebView } from 'react-native-webview';

/** Zone de signature tactile (canvas dans une WebView). */
export interface SignaturePadHandle {
  clear(): void;
  capture(): void; // déclenche onCapture(dataUrl | null)
}

const HTML = `<!DOCTYPE html><html><head>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no"/>
<style>html,body{margin:0;height:100%;background:#fff;overflow:hidden}
#c{touch-action:none;display:block;width:100%;height:100%;background:#fff}</style></head>
<body><canvas id="c"></canvas><script>
var c=document.getElementById('c'),x=c.getContext('2d'),d=false,empty=true;
function fit(){c.width=c.clientWidth;c.height=c.clientHeight;x.lineWidth=2.5;x.lineCap='round';x.lineJoin='round';x.strokeStyle='#0b1220';}
fit();window.addEventListener('resize',fit);
function pos(e){var r=c.getBoundingClientRect();var t=e.touches?e.touches[0]:e;return{x:t.clientX-r.left,y:t.clientY-r.top};}
function down(e){d=true;empty=false;var p=pos(e);x.beginPath();x.moveTo(p.x,p.y);e.preventDefault();}
function move(e){if(!d)return;var p=pos(e);x.lineTo(p.x,p.y);x.stroke();e.preventDefault();}
function up(){d=false;}
c.addEventListener('touchstart',down);c.addEventListener('touchmove',move);c.addEventListener('touchend',up);
c.addEventListener('mousedown',down);c.addEventListener('mousemove',move);c.addEventListener('mouseup',up);
window.__clear=function(){x.clearRect(0,0,c.width,c.height);empty=true;};
window.__get=function(){window.ReactNativeWebView.postMessage(empty?'EMPTY':c.toDataURL('image/png'));};
</script></body></html>`;

export const SignaturePad = forwardRef<SignaturePadHandle, { onCapture: (dataUrl: string | null) => void; style?: StyleProp<ViewStyle> }>(
  ({ onCapture, style }, ref) => {
    const web = useRef<WebView>(null);
    useImperativeHandle(ref, () => ({
      clear: () => web.current?.injectJavaScript('window.__clear&&window.__clear();true;'),
      capture: () => web.current?.injectJavaScript('window.__get&&window.__get();true;'),
    }));
    return (
      <WebView
        ref={web}
        source={{ html: HTML }}
        originWhitelist={['*']}
        scrollEnabled={false}
        style={style}
        onMessage={(e) => {
          const d = e.nativeEvent.data;
          onCapture(d === 'EMPTY' ? null : d);
        }}
      />
    );
  },
);
SignaturePad.displayName = 'SignaturePad';
