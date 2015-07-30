var invariant = require('turf-invariant');

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
module.exports = function(point, polygon) {
  invariant.featureOf(point, 'Point', 'inside');
  var polys = polygon.geometry.coordinates;
  var pt = [point.geometry.coordinates[0], point.geometry.coordinates[1]];
  // normalize to multipolygon
  if (polygon.geometry.type === 'Polygon') polys = [polys];

  var insidePoly = false;
  var i = 0;
  while (i < polys.length && !insidePoly) {
    // check if it is in the outer ring first
    if(inRing(pt, polys[i][0])) {
      var inHole = false;
      var k = 1;
      // check for the point in any of the holes
      while(k < polys[i].length && !inHole) {
        if(inRing(pt, polys[i][k])) {
          inHole = true;
        }
        k++;
      }
      if(!inHole) insidePoly = true;
    }
    i++;
  }
  return insidePoly;
};

// pt is [x,y] and ring is [[x,y], [x,y],..]
function inRing (pt, ring) {
  var isInside = false;
  for (var i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    var xi = ring[i][0], yi = ring[i][1];
    var xj = ring[j][0], yj = ring[j][1];
    var maxx = xi, minx = xj, maxy = yi, miny = yj;
    if (xi < xj) { maxx = xj; minx = xi; }
    if (yi < yj) { maxy = yj; miny = yi; }
    if (yi === yj && yi === pt[1] && maxx >= pt[0] && minx <= pt[0]) {
      // if we're on a horizontal segment, return true.
      return true;
    }
    if (maxy < pt[1] || miny > pt[1]) {
      // if we're not in the same y-range as the segment move on.
      continue
    }
    // find the x-coordinate where the line y=pt[1] intersects this segment
    var intersect = (xj - xi) * (pt[1] - yi) / (yj - yi) + xi
    if (pt[0] === intersect) {
      // if we're on the segment, return true
      return true
    }
    if (pt[0] < intersect) {
      // if we're to the left of the segment, flip isInside
      isInside = !isInside;
      if (yi === pt[1]) {
        // if this we intersected the leading endpoint, skip the next segment 
        // so that we don't double count the intersection.
        i++;
      }
    }
  }
  // represents the parity of edges crossed by the ray (pt[0],pt[1]) -> (infinity, pt[1])
  return isInside;
}
