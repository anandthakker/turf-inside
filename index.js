var invariant = require('turf-invariant');
var normalize = require('turf-normalize');
var flatten = require('turf-flatten');

// http://en.wikipedia.org/wiki/Even%E2%80%93odd_rule
// modified from: https://github.com/substack/point-in-polygon/blob/master/index.js
// which was modified from http://www.ecse.rpi.edu/Homepages/wrf/Research/Short_Notes/pnpoly.html

/**
 * Takes a {@link Point} and a {@link Polygon} or {@link MultiPolygon} and determines if the point resides inside the polygon. The polygon can
 * be convex or concave. The function accounts for holes.
 *
 * @module turf/inside
 * @category joins
 * @param {Feature<Point>} point input point
 * @param {Feature<(Polygon|MultiPolygon)>} polygon input polygon or multipolygon
 * @return {Boolean} `true` if the Point is inside the Polygon; `false` if the Point is not inside the Polygon
 * @example
 * var pt1 = {
 *   "type": "Feature",
 *   "properties": {
 *     "marker-color": "#f00"
 *   },
 *   "geometry": {
 *     "type": "Point",
 *     "coordinates": [-111.467285, 40.75766]
 *   }
 * };
 * var pt2 = {
 *   "type": "Feature",
 *   "properties": {
 *     "marker-color": "#0f0"
 *   },
 *   "geometry": {
 *     "type": "Point",
 *     "coordinates": [-111.873779, 40.647303]
 *   }
 * };
 * var poly = {
 *   "type": "Feature",
 *   "properties": {},
 *   "geometry": {
 *     "type": "Polygon",
 *     "coordinates": [[
 *       [-112.074279, 40.52215],
 *       [-112.074279, 40.853293],
 *       [-111.610107, 40.853293],
 *       [-111.610107, 40.52215],
 *       [-112.074279, 40.52215]
 *     ]]
 *   }
 * };
 *
 * var features = {
 *   "type": "FeatureCollection",
 *   "features": [pt1, pt2, poly]
 * };
 *
 * //=features
 *
 * var isInside1 = turf.inside(pt1, poly);
 * //=isInside1
 *
 * var isInside2 = turf.inside(pt2, poly);
 * //=isInside2
 */
module.exports = function(point, surface) {
  invariant.featureOf(point, 'Point', 'inside');

  if(surface.geometry.type === 'Point') return pointInPoint(point, surface);
  if(surface.geometry.type === 'Polygon') return pointInPolygon(point, surface);
  
  var fc = normalize(flatten(surface));

  var isInside = false;
  for(var i = 0; i < fc.features.length; i++) {
    if(fc.features[i].geometry.type === 'Point') {

    } else if(fc.features[i].geometry.type === 'LineString') {
      
    } else if(fc.features[i].geometry.type === 'Polygon') {
      if(pointInPolygon(point, fc.features[i])) {
        isInside = true;
        break;
      }
    }
  }
  return isInside;
};

function pointInPolygon (point, polygon) {
  var poly = polygon.geometry.coordinates;
  var pt = [point.geometry.coordinates[0], point.geometry.coordinates[1]];
  // normalize to multipolygon

  var insidePoly = false;
    // check if it is in the outer ring first
  if(inRing(pt, poly[0])) {
    var inHole = false;
    var k = 1;
    // check for the point in any of the holes
    while(k < poly.length && !inHole) {
      if(inRing(pt, poly[k])) {
        inHole = true;
        break;
      }
      k++;
    }
    if(!inHole) insidePoly = true;
  }

  return insidePoly;
}

function pointInPoint(pt1, pt2) {
  if(pt1.geometry.coordinates[0] === pt2.geometry.coordinates[0] &&
    pt1.geometry.coordinates[1] === pt2.geometry.coordinates[1]) {
    return true;
  } else {
    return false;
  }
}

// pt is [x,y] and ring is [[x,y], [x,y],..]
function inRing (pt, ring) {
  var isInside = false;
  for (var i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    var xi = ring[i][0], yi = ring[i][1];
    var xj = ring[j][0], yj = ring[j][1];
    var intersect = ((yi > pt[1]) !== (yj > pt[1])) &&
        (pt[0] < (xj - xi) * (pt[1] - yi) / (yj - yi) + xi);
    if (intersect) isInside = !isInside;
  }
  return isInside;
}
