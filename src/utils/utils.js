import proj4 from 'proj4';

export function isUtmCrs(crs) {
  return (32601 <= crs && crs <= 32660) || (32701 <= crs && crs <= 32760);
}

export function utmToWgs(bbox, crs) {
  // also changes long,lat to lat,long
  var coords = bbox.map(coord => {
    return parseFloat(coord);
  });
  const utm = getUtmProjection(crs);
  var wgs84 = new proj4.Proj('WGS84');
  var point1 = proj4.transform(utm, wgs84, [coords[0], coords[1]]);
  var point2 = proj4.transform(utm, wgs84, [coords[2], coords[3]]);
  return [point1.y, point1.x, point2.y, point2.x].join(',');
}

export function wgsToUtm(lat, lng, crs) {
  const utm = getUtmProjection(crs);
  const wgs84 = new proj4.Proj('WGS84');
  return proj4.transform(wgs84, utm, [parseFloat(lng), parseFloat(lat)]);
}

function getUtmProjection(crs) {
  crs = crs.toString();
  if (crs.startsWith('326')) {
    return new proj4.Proj(
      '+proj=utm +zone=' + crs.substring(3, 5) + '+north +ellps=WGS84 +datum=WGS84 +units=m +no_defs',
    );
  } else {
    return new proj4.Proj(
      '+proj=utm +zone=' + crs.substring(3, 5) + '+south +ellps=WGS84 +datum=WGS84 +units=m +no_defs',
    );
  }
}

export function getWmsRequestUrl(task, preset, mapLayer) {
  let url = `${mapLayer.url}&service=WMS&request=GetMap&version=1.3.0`;
  if (!url.includes('format=')) {
    url += '&format=image/png';
  }
  if (!url.includes('transparent=')) {
    url += '&transparent=yes';
  }
  url += `&width=${task.window.width}&height=${task.window.height}`;
  url += `&crs=EPSG:${task.crs}`;
  url += `&layers=${preset.name}`;
  url += `&time=${task.datetime}/${task.datetime}`;
  url += `&bbox=${task.bbox.join(',')}`;
  return url;
}

export function hexToRGBA(hex, alpha = 0.0) {
  const r = parseInt(hex.slice(1, 3), 16),
    g = parseInt(hex.slice(3, 5), 16),
    b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
