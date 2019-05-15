"use strict";

/*
1. Load in the dataEveryYear.csv file instead of the data.csv file.
2. Change the code so that the scatter plot only plots data for the year 2000
3. Make another 500 by 500 SVG and append it to the body tag
4. Add a function to the onmouseover in plotData that fills out the second SVG
5. This function should plot a line graph of time (x-axis) vs life expectancy (y-axis) for the country which the user is hovering over
   Hint: there are already functions defined to make a scatter plot of fertility rate vs life expectancy. You can rewrite some of these functions to be more generalized so that you can reuse them to plot the line graph

*/

(function() {
  let data = "no data";
  let allYearsData = "no data";
  let svgPlotContainer = ""; // keep SVG reference in global scope
  let svgSubPlotContainer = "";

  let selectedCountry = "AUS";

  // load data and make scatter plot after window loads
  window.onload = function() {
    svgPlotContainer = d3
      .select("body")
      .append("svg")
      .attr("width", 800)
      .attr("height", 600);

    // d3.csv is basically fetch but it can be be passed a csv file as a parameter
    d3.csv("./data/dataEveryYear.csv")
      .then(data => drawDropdown(data))
      .then(data => makeLinePlot(data));
  };

  function selectCountry() {
    // clear viz
    d3.select("svg").html("");

    // get the year from the dropdown
    selectedCountry = d3.select(this).property("value");

    // redraw scatter plot
    makeLinePlot(data);
  }

  function drawDropdown(data) {
    let selectMenu = d3
      .select("body")
      .append("select")
      .on("change", selectCountry);

    const countries = data
      .map(({ location }) => location)
      .filter((value, index, self) => self.indexOf(value) === index)
      .sort((a, b) => a.localeCompare(b));

    selectMenu
      .selectAll("option")
      .data(countries)
      .enter()
      .append("option")
      .attr("value", d => d)
      .text(d => d);

    return data;
  }

  // make scatter plot with trend line
  function makeLinePlot(csvData) {
    data = csvData; // assign data as global variable
    allYearsData = csvData;

    // get arrays of fertility rate data and life Expectancy data
    let time_data = data.map(row => parseFloat(row["time"]));
    let pop_data = data.map(row => parseFloat(row["pop_mlns"]));

    // find data limits
    let axesLimits = findMinMax(time_data, pop_data);

    // draw axes and return scaling + mapping functions
    let mapFunctions = drawAxes(
      axesLimits,
      "time",
      "pop_mlns",
      svgPlotContainer,
      { min: 100, max: 900 },
      { min: 100, max: 500 }
    );

    // plot data as points and add tooltip functionality
    plotData(mapFunctions);

    // draw title and axes labels
    makeLabels();
  }

  // make title and axes labels
  function makeLabels() {
    svgPlotContainer
      .append("text")
      .attr("x", 320)
      .attr("y", 40)
      .style("font-size", "14pt")
      .text("Population Over Time");

    svgPlotContainer
      .append("text")
      .attr("x", 440)
      .attr("y", 550)
      .style("font-size", "10pt")
      .text("Year");

    svgPlotContainer
      .append("text")
      .attr("transform", "translate(45, 350)rotate(-90)")
      .style("font-size", "10pt")
      .text("Population (millions)");
  }

  // plot all the data points on the SVG
  // and add tooltip functionality
  function plotData(map) {
    // mapping functions
    let xMap = map.x;
    let yMap = map.y;

    // make tooltip
    let div = d3
      .select("body")
      .append("div")
      .attr("class", "tooltip")
      .style("opacity", 0);

    svgSubPlotContainer = div
      .append("svg")
      .attr("width", 200)
      .attr("height", 200);

    var line = d3
      .line()
      .x(xMap)
      .y(yMap);

    svgPlotContainer
      .data([data.filter(({ location }) => location === selectedCountry)])
      .append("path")
      .attr("stroke", "steelblue")
      .style("stroke-width", 3)
      .attr("d", line)
      .style("cursor", "pointer")
      .on("mouseover", d => {
        div
          .transition()
          .duration(200)
          .style("opacity", 0.9);
        div
          .html(
            `<div><b>Life Expectancy vs. Fertility Rate</b></div><br/><div>Country: ${selectedCountry}</div>`
          )
          .style("left", d3.event.pageX + 20 + "px")
          .style("top", d3.event.pageY - 58 + "px");

        svgSubPlotContainer = div
          .append("svg")
          .attr("width", 250)
          .attr("height", 250);
        svgSubPlotContainer.append(makeSubPlotLine());
      })
      .on("mouseout", d => {
        div
          .transition()
          .duration(200)
          .style("opacity", 0);
      });
  }

  function makeSubPlotLine() {
    svgSubPlotContainer.html("");

    let fertilityData = allYearsData.map(row => row["fertility_rate"]);
    let lifeExpectancyData = allYearsData.map(row => row["life_expectancy"]);

    let minMax = findMinMax(fertilityData, lifeExpectancyData);

    let funcs = drawAxes(
      minMax,
      "fertility_rate",
      "life_expectancy",
      svgSubPlotContainer,
      { min: 40, max: 200 }, //width 160
      { min: 20, max: 180 }, // height 160
      true
    );

    return plotLineGraph(funcs);
  }

  function plotLineGraph(funcs) {
    let countryData = allYearsData.filter(
      ({ location }) => location === selectedCountry
    );

    svgSubPlotContainer
      .selectAll(".dot")
      .data(countryData)
      .enter()
      .append("circle")
      .attr("cx", funcs.x)
      .attr("cy", funcs.y)
      .attr("r", 1.5)
      .attr("fill", "steelblue")
      .style("opacity", 1);

    svgSubPlotContainer
      .append("text")
      .attr("x", 90)
      .attr("y", 215)
      .style("font-size", "8pt")
      .text("Fertility Rate");

    svgSubPlotContainer
      .append("text")
      .attr("transform", "translate(10, 130)rotate(-90)")
      .style("font-size", "8pt")
      .text("Life Expectancy");

    return svgSubPlotContainer;
  }

  // draw the axes and ticks
  function drawAxes(limits, x, y, svg, rangeX, rangeY, fewTicks) {
    // return x value from a row of data
    let xValue = function(d) {
      return +d[x];
    };

    // function to scale x value
    let xScale = d3
      .scaleLinear()
      .domain([limits.xMin, limits.xMax]) // give domain buffer room
      .range([rangeX.min, rangeX.max]);

    // xMap returns a scaled x value from a row of data
    let xMap = function(d) {
      return xScale(xValue(d));
    };

    // plot x-axis at bottom of SVG
    let xAxis = d3
      .axisBottom()
      .ticks(fewTicks ? 2 : 10)
      .scale(xScale)
      .tickFormat(d3.format("d"));
    svg
      .append("g")
      .attr("transform", "translate(0, " + rangeY.max + ")")
      .call(xAxis);

    // return y value from a row of data
    let yValue = function(d) {
      return +d[y];
    };

    // function to scale y
    let yScale = d3
      .scaleLinear()
      .domain([limits.yMax, limits.yMin]) // give domain buffer
      .range([rangeY.min, rangeY.max]);

    // yMap returns a scaled y value from a row of data
    let yMap = function(d) {
      return yScale(yValue(d));
    };

    // plot y-axis at the left of SVG
    let yAxis = d3
      .axisLeft()
      .ticks(fewTicks ? 4 : 10)
      .scale(yScale);
    svg
      .append("g")
      .attr("transform", "translate(" + rangeX.min + ", 0)")
      .call(yAxis);

    // return mapping and scaling functions
    return {
      x: xMap,
      y: yMap,
      xScale: xScale,
      yScale: yScale
    };
  }

  // find min and max for arrays of x and y
  function findMinMax(x, y) {
    // get min/max x values
    let xMin = d3.min(x);
    let xMax = d3.max(x);

    // get min/max y values
    let yMin = d3.min(y);
    let yMax = d3.max(y);

    // return formatted min/max data as an object
    return {
      xMin: xMin,
      xMax: xMax,
      yMin: yMin,
      yMax: yMax
    };
  }
})();
