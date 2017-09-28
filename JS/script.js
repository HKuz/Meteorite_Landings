// Good examples and theory of rotating globes:
// Spinning globe: https://bl.ocks.org/mbostock/4183330
// Article about rotating the world: https://www.jasondavies.com/maps/rotate/

var mapUrl = "https://d3js.org/world-110m.v1.json";
var meteoriteUrl = "https://raw.githubusercontent.com/FreeCodeCamp/ProjectReferenceData/master/meteorite-strike-data.json";

var createWorld = function(mapUrl, meteoriteUrl) {
  // Basic Setup
  var width = 960,
  height = 500,
  scale = 250,
  origin = {
    x: -60,
    y: -20
  },
  opacity = 0.6;

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

  var circle = d3.geoCircle();

  // Add group to hold land, water, graticules (lon/lat lines), and meteorites
  var g = svg.append("g").datum({
    x: width / 2,
    y: height / 2
  });

  // Background circle to color the water
  g.append("circle")
      .attr("class", "graticule-outline")
      .attr("cx", width / 2)
      .attr("cy", height / 2)
      .attr("r", projection.scale())

  // Draw the graticules
  g.append("path")
      .datum(graticule)
      .attr("class", "graticule")
      .attr("d", geoPath);

  // Async calls to load map and plot meteorite data
  d3.json(mapUrl, function(error, world){
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

      // Create color and radius scales for meteorites based on mass
      var massMax = d3.max(data.features, function(d) {
        return d.properties.mass;
      });
      var massMin = d3.min(data.features, function(d) {
        return d.properties.mass;
      });

      // console.log("Max mass: ", massMax);
      // console.log("Min mass: ", massMin);

      var colorScale = d3.scaleQuantize()
        .domain([massMin, massMax])
        .range(["#EBA612", "#EB9112", "#EB6412", "#EB4A12", "#930900"]); // Source: http://www.colourlovers.com/palette/2313798/shades_of_fire

      var radiusScale = d3.scaleQuantize()
        .domain([massMin, massMax])
        .range([1, 1.5, 1.75, 2, 2.5]);

      // Setup tooltip
      var tooltip = d3.select("#tooltip")
        .classed("tooltip", true);

      var tScale = d3.scaleQuantize()
        .domain([massMin, massMax])
        .range([3, 4, 5, 7, 8]);

      // Function to generate the meteorite circles on Earth's surface
      //   This is necessary so fill color and tooltip mouseover events
      //   still have access to the data (vs. creating geoCircle with datum)
      var circlePath = function(d) {
        if (d.geometry && d.properties.mass) {
              var cc = circle
                        .center(d.geometry.coordinates)
                        .radius(radiusScale(d.properties.mass))();
            }
        return geoPath(cc);
      }

      // Draw meteorites on map
      var meteorites = g.selectAll("path.meteorite")
          .data(data.features)
        .enter().append("path")
          .attr("class", "meteorite")
          .attr("d", circlePath)
          .attr("fill", function(d) {
            if (d.properties.mass) {
              return colorScale(d.properties.mass);
            } else {
              return "transparent";
            }
          })
          .style("opacity", 0)
          .on("mouseover", function(d) {
            var dataPoint = "<div><strong>" + d.properties.name +
                            "</strong><br />" +
                            "Mass: "+ d.properties.mass + "<br />" +
                            "Year: " + d.properties.year.slice(0, 4) +
                            "</div>";
            tooltip.transition()
              .style("opacity", .9)
            tooltip.html(dataPoint)
              .style("left", (d3.event.pageX + 5) + "px")
              .style("top", (d3.event.pageY - 28) + "px")
          })
          .on("mouseout", function(d) {
            tooltip.transition()
              .style("opacity", 0);
          });

      // Add transition to draw the meteorites
      d3.selectAll(".meteorite").transition()
          .duration(1000)
          .ease(d3.easePolyOut)
          .delay(function(d, i) {
            return i * 10;
          })
          .style("opacity", opacity)
          .attrTween("d", function(d, i) {
            // massBasedRadius = d.properties.mass ? radiusScale(d.properties.mass) : 0;
            // rinterp = d3.interpolate(0, massBasedRadius);
            // var fn = function(t) {
            //   d.r = rinterp(t);
            //   return circlePath(d, d.r);
            // };
            // return fn;
          });

      // Define zoom and rotation behavior for the Earth
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
        updatePaths();
      };

      function zoomed() {
        var transform = d3.event.transform;
        var k = Math.sqrt(100 / projection.scale());
        projection.scale(scale * transform.k)
        updatePaths();
      };

      function updatePaths() {
        svg.selectAll("path.graticule")
          .datum(graticule)
          .attr("d", geoPath);

        g.selectAll("path.country")
          .attr("d", geoPath);

        g.selectAll("circle.graticule-outline")
          .attr("r", projection.scale());

        g.selectAll("path.meteorite")
          .attr("d", circlePath);
      };

      // Zoom, drag, and rotate behavior
      svg.call(d3.zoom().on("zoom", zoomed));
      g.call(d3.drag().on("drag", dragged));

    });  // End meteorite data .json call

  });  // End map data .json call

}  // End createWorld function

createWorld(mapUrl, meteoriteUrl);
