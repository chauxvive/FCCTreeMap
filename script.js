"use strict";

const gameSalesURL = "https://cdn.freecodecamp.org/testable-projects-fcc/data/tree_map/video-game-sales-data.json";
let gameData;
const tooltip = d3.select('#tooltip');
const legend = d3.select('#legend');

// Colors for the categories
const colors = [
    "#32964d", "#5cdd9f", "#016876", "#68c3ef", "#1e39ae", "#dabed9",
    "#7c225f", "#f372a8", "#b859e4", "#4f4256", "#7f7bc9", "#270fe2",
    "#a5e841", "#0b5313", "#b2d097", "#754819", "#f4a95c", "#fd5925"
];

Promise.all([
    fetch(gameSalesURL).then(res => res.json())
])
    .then(([games]) => {
        gameData = games;
        drawTree(); // Call drawTree first to process the data
    })
    .catch(error => console.error("Error fetching data:", error));

const canvas = d3.select('#canvas')
    .attr('width', 1000)
    .attr('height', 600);

const drawTree = () => {
    gameData.children.forEach(system => {
        system.children.forEach(game => {
            game.value = +game.value; // Convert string to number
        });
    });

    const categories = gameData.children.map(system => system.name);  // Create categories

    const colorScale = d3.scaleOrdinal()
        .domain(categories)
        .range(colors);

    let hierarchy = d3.hierarchy(gameData, (node) => node.children)
        .sum((node) => node.value)
        .sort((a, b) => b.value - a.value);

    let createMap = d3.treemap()
        .size([1000, 600])
        .padding(1);

    createMap(hierarchy);

    let leaves = hierarchy.leaves();

    canvas.selectAll('rect')
        .data(leaves)
        .enter()
        .append('rect')
        .attr('class', 'tile')
        .attr('x', (d) => d.x0)
        .attr('y', (d) => d.y0)
        .attr('width', (d) => d.x1 - d.x0)
        .attr('height', (d) => d.y1 - d.y0)
        .attr("fill", (d) => colorScale(d.data.category))
        .attr("data-name", (d) => d.data.name)
        .attr("data-category", (d) => d.data.category)
        .attr("data-value", (d) => d.data.value)
        .attr('stroke', 'black');

    canvas.selectAll("text")
        .data(leaves)
        .enter()
        .append("text")
        .attr("x", (d) => d.x0 + 5)
        .attr("y", (d) => d.y0 + 20)
        .text((d) => d.data.name)
        .attr("font-size", "10px")
        .attr("fill", "white")
        .attr("pointer-events", "none")
        .style("overflow", "hidden")
        .each(function (d) {
            const rectWidth = d.x1 - d.x0;
            let text = d.data.name;
            let textLength = this.getComputedTextLength();
            while (text.length > 0 && textLength > rectWidth - 10) {
                text = text.slice(0, -1);
                d3.select(this).text(text + "…");
                textLength = this.getComputedTextLength();
            }
        });

    canvas.selectAll("rect")
        .on("mouseover", (event, d) => {
            tooltip.style("visibility", "visible")
                .html(`<strong>${d.data.name}</strong><br>System: ${d.data.category}<br>Sales: ${d.data.value}M`)
                .style("left", event.pageX + 10 + "px")
                .style("top", event.pageY - 20 + "px")
                .attr("data-value", d.data.value);
        })
        .on("mousemove", (event) => {
            tooltip.style("left", event.pageX + 10 + "px")
                .style("top", event.pageY - 20 + "px");
        })
        .on("mouseout", () => {
            tooltip.style("visibility", "hidden");
        });

    // After tree is drawn, now draw the legend
    drawLegend(categories, colorScale); 
};

const drawLegend = (categories, colorScale) => {
    const legendWidth = 500;
    const legendHeight = categories.length * 25 + 20; // Space for each category
    const legendItemHeight = 20;
    const legendItemPadding = 5;

    // Select the legend container and set its dimensions
    legend
        .attr("width", legendWidth)
        .attr("height", legendHeight);

    // Create a group for each legend item (category)
    const legendItems = legend.selectAll(".legend-item")
        .data(categories)
        .enter()
        .append("g")
        .attr("class", "legend-item")
        .attr("transform", (d, i) => `translate(10, ${i * (legendItemHeight + legendItemPadding)})`);

    // Append a colored rectangle for each category
    legendItems.append("rect")
        .attr("class", "legend-item")
        .attr("width", 20) // Width of the rectangle
        .attr("height", 20) // Height of the rectangle
        .attr("fill", (d) => colorScale(d)) // Use colorScale to match the treemap colors
        .attr("stroke", "black");

    // Append a text label for each category
    legendItems.append("text")
        .attr("x", 30) // Position text next to the rectangle
        .attr("y", 15) // Vertically center the text
        .text((d) => d) // The system name
        .attr("font-size", "14px")
        .attr("fill", "black");
};
