// World data: https://raw.githubusercontent.com/mbostock/topojson/master/examples/world-50m.json

// example: https://bl.ocks.org/d3noob/5193723

// spinning globe: https://bl.ocks.org/mbostock/4183330

// https://www.jasondavies.com/maps/rotate/

// spinning globe with interpolation: https://bl.ocks.org/jasondavies/4183701

// Basic Set-up
var width = 960,
height = 500,
scale = 250,
storedX = 0,
storedY = 0,
origin = {
  x: 0,
  y: -20
};
var map110Url = "https://d3js.org/world-110m.v1.json";
var meteoriteUrl = "https://raw.githubusercontent.com/FreeCodeCamp/ProjectReferenceData/master/meteorite-strike-data.json";

// SVG, Projection, and Path Setup
var svg = d3.select("#map").append("svg")
  .attr("width", width)
  .attr("height", height);

var projection = d3.geoOrthographic()
    .scale(scale)
    .translate([width / 2, height / 2])
    .rotate([origin.x, origin.y])
    .center([0, 0])
    .clipAngle(90);

var geoPath = d3.geoPath()
    .projection(projection);

var graticule = d3.geoGraticule();

// Draw the graticule lines
svg.append("path")
    .datum(graticule)
    .attr("class", "graticule")
    .attr("d", geoPath);

var g = svg.append("g");

// Fill in globe (water color)
g.append("circle")
    .attr("class", "graticule-outline")
    .attr("cx", width / 2)
    .attr("cy", height / 2)
    .attr("r", projection.scale());


// Get the Earth to Spin

var lambda = d3.scaleLinear()
//  .domain([-width, width])
    .domain([0, width])
    .range([-180, 180]);

var phi = d3.scaleLinear()
//  .domain([-height, height])
    .domain([0, height])
    .range([90, -90]);


function zoomed() {
  var transform = d3.event.transform;
  var r = {
    x: lambda(transform.x),
    y: phi(transform.y)
  };
  var k = Math.sqrt(100 / projection.scale()); // scale / projection.scale()?
  if (d3.event.sourceEvent.wheelDelta) {
    projection.scale(scale * transform.k)
    transform.x = storedX;
    transform.y = storedY;
  } else {
    projection.rotate([origin.x + r.x, origin.y + r.y]);
    storedX = transform.x;
    storedY = transform.y;
  }
  updatePaths(svg, graticule, geoPath);
};


function updatePaths(svg, graticule, geoPath) {
  svg.selectAll("path.graticule")
     .datum(graticule)
     .attr("d", geoPath);

  g.selectAll("path.country")
     .attr("d", geoPath);
};


// Tooltip and Meteor scales
/*
var tooltip = d3.select('#tooltip')
  .classed("tooltip", true);

var color = d3.scale.quantize()
  .range(["#2540A3", "#586436","#FCD32D", "#E95517", "#C61309"]);   // color range for meteorite mass size

var radiusScale = d3.scale.linear()
  .range([0, 12]);   // radius range for meteorite size
*/

// Load Map and Meteor Data

d3.json(map110Url, function(error, world){
  if (error) throw error;

  var countries = topojson.feature(world, world.objects.countries).features;

  var country = g.selectAll(".country")
      .data(countries)
    .enter().insert("path", ".graticule")
      .attr("class", "country")
      .attr("d", geoPath);

  d3.json(meteoriteUrl, function(error, data) {
    if (error) throw error;

    // Remove data points with no lon/lat coordinates
    var scrubbed = data.features.filter(function(val) {
      // filter out data with no features.geometry.coordinates values
    });
  });

});


// Zoom Behavior
svg.call(d3.zoom().on('zoom', zoomed));

/*
var zoom = d3.behavior.zoom()
    .scaleExtent([1, 10])
    .on("zoom", function() {
      g.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
    });

svg.call(zoom)
   .on("mousedown.zoom", null);
*/


/*
var drag = d3.behavior.drag()
            .on("dragstart", dragstarted)
            .on("drag", dragged)
            .on("dragend", dragended);

svg.call(drag);

var p_init, o_init;
function dragstarted() {
  p_init = projection.invert(d3.mouse(this));
  o_init = projection.rotate();
  context.clearRect(0, 0, width, height);
  d3.event.preventDefault();
  svg.insert("path")
     .attr("d", path);
}

function dragged() {
  var p_new = projection.invert(d3.mouse(this));
  o_init = projection.rotate();
  var o_new = [lambda(p_new[0]), phi(p_new[1])];
    //var o1 = eulerAngles(gpos0, gpos1, o0);
    projection.rotate(o_new);

  svg.selectAll("path").attr("d", path);
}

function dragended() {
  context.clearRect(0, 0, width, height);
  getOverlay(overlay);
  svg.selectAll(".point").remove();
}
*/

/*
var gpos0, o0;
//var p0, p1;

function dragstarted(){
    gpos0 = projection.invert(d3.mouse(this));
    o0 = projection.rotate();
  //p0 = d3.mouse(this);
    svg.insert("path")
             .datum({type: "Point", coordinates: gpos0})
             .attr("class", "point")
             .attr("d", path);
}

function dragged(){
    var gpos1 = projection.invert(d3.mouse(this));

    o0 = projection.rotate();
    //var o1 = eulerAngles(gpos0, gpos1, o0);
    //projection.rotate(o1);

  var o1 = [lambda(gpos0[0]), phi(gpos0[1])];
  projection.rotate(o1);
  //p0 = d3.mouse(this);
  //projection.rotate([lambda(p0[0]), phi(p0[1])]);

    svg.selectAll(".point")
            .datum({type: "Point", coordinates: gpos1});
  svg.selectAll("path").attr("d", path);

}

function dragended(){
    //p0 = d3.mouse(this);
  svg.selectAll(".point").remove();
}
*/

/*
svg.on("mousemove", function() {
  var p = d3.mouse(this);
  projection.rotate([lambda(p[0]), phi(p[1])]);
  svg.selectAll("path").attr("d", path);
});
*/

/*
var point_init;
svg.on("mousedown", function() {
      point_init = [d3.event.pageX, d3.event.pageY];
      context.clearRect(0, 0, width, height);
      d3.event.preventDefault();
})
   .on("mousemove", function() {
      if (point_init) {
        point_init = [d3.event.pageX, d3.event.pageY];
        projection.rotate([lambda(point_init[0]), phi(point_init[1])]);
        svg.selectAll("path").attr("d", path);
      }
   })
   .on("mouseup", function() {
      if (point_init) {
        context.clearRect(0, 0, width, height);
        getOverlay(overlay);
        point_init = null;
     }
});
*/
