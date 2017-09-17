// Good examples and theory of rotating globes:
// Spinning globe: https://bl.ocks.org/mbostock/4183330
// Spinning globe with interpolation: https://bl.ocks.org/jasondavies/4183701
// Article about rotating the world: https://www.jasondavies.com/maps/rotate/


// Basic Setup
var width = 960,
height = 500,
scale = 250,
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

// Add group for land, water, and graticules (lon/lat lines)
var g = svg.append("g").datum({
  x: width / 2,
  y: height / 2
});

g.append("circle")
    .attr("class", "graticule-outline")
    .attr("cx", width / 2)
    .attr("cy", height / 2)
    .attr("r", projection.scale())

// Draw the graticules (on top of land and water)
g.append("path")
    .datum(graticule)
    .attr("class", "graticule")
    .attr("d", geoPath);

// Zoom and rotation behavior for the Earth
var lambda = d3.scaleLinear()
    .domain([0, width])
    .range([-180, 180]);

var phi = d3.scaleLinear()
    .domain([0, height])
    .range([90, -90]);

function dragged(d) {
  var r = {
      x: lambda((d.x = d3.event.x)),
      y: phi((d.y = d3.event.y))
  };
  projection.rotate([origin.x + r.x, origin.y + r.y]);
  updatePaths(svg, graticule, geoPath);
};

function zoomed() {
  var transform = d3.event.transform;
  var k = Math.sqrt(100 / projection.scale());
  projection.scale(scale * transform.k)
  updatePaths(svg, graticule, geoPath);
};

function updatePaths(svg, graticule, geoPath) {
  svg.selectAll("path.graticule")
    .datum(graticule)
    .attr("d", geoPath);

  g.selectAll("path.country")
    .attr("d", geoPath);

  g.selectAll("circle.graticule-outline")
    .attr("r", projection.scale());

  g.selectAll("circle.meteorite")
    .attr("d", geoPath); // TODO: get meteorite strikes to rotate
};


// Tooltip and Meteor scales:
var tooltip = d3.select('#tooltip')
      .classed("tooltip", true);


// Load map and plot meteor data
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

    // data.features -> array of objects (type, geometry, properties)
    // data.features[0].geometry.coordinates -> [lon, lat]
    // data.properties -> .mass, .name

    // Create color and radius scales based on meteorite mass
    var massMax = d3.max(data.features, function(d) {
      return d.properties.mass;
    });
    var massMin = d3.min(data.features, function(d) {
      return d.properties.mass;
    });

    console.log("Max mass: ", massMax);
    console.log("Min mass: ", massMin);

    var colorScale = d3.scaleQuantize()
          .domain([massMin, massMax])
          .range(["#00CBE7", "#00DA3C", "#F4F328", "#FD8603", "#DF151A"]);  // color range for meteorite mass size

    var radiusScale = d3.scaleLog()
      .domain([massMin, massMax])
      .range([1, 12]);   // radius range for meteorite size


    g.selectAll(".meteorite")
        .data(data.features)
      .enter().append("circle")
        .classed("meteorite", true)
        .attr("r", function(d) {
          return radiusScale(d.properties.mass)
        })
        .attr("fill", function(d) {
          return colorScale(d.properties.mass);
        })
        .style("opacity", 0.7)
        // .style("border", function(d) {
        //   return colorScale(d.properties.mass);
        // })
        .attr("transform", function (d) {
            if(d.geometry.coordinates) {
              return 'translate(' +
                projection([d.geometry.coordinates[0],
                            d.geometry.coordinates[1]]) + ')';
            }
        })
        .attr("d", geoPath)
        /*.on("mouseover", function(d) {
          var dataPoint = "<div class='text-center'><strong>" +
                          d.properties.name + "</strong><br />" +
                           "Mass: "+ d.properties.mass + "<br />" +
                           "Year: " + d.properties.year.slice(0, 5) +
                          "</div>";
          tooltip.transition()
            .style('opacity', .9)
          tooltip.html(dataPoint)
            .style("left", (d3.event.pageX + 5) + "px")
            .style("top", (d3.event.pageY - 28) + "px")
          d3.select(this).style('opacity', 0.5)
        })
        .on("mouseout", function(d) {
          tooltip.transition()
            .style("opacity", 0);
          d3.select(this).style('opacity', 1);
        })
        */
  });

});


// Zoom, drag, and rotate behavior
svg.call(d3.zoom().on("zoom", zoomed));
g.call(d3.drag().on("drag", dragged));
