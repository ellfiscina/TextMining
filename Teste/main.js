var margin = {top: 20, right: 0, bottom: 0, left: 0};
var width = 1200;
var height = 650;

var x = d3.scaleLinear()
          .domain([0, width])
          .range([0, width]);

var y = d3.scaleLinear()
          .domain([0, height - margin.top - margin.bottom])
          .range([0, height - margin.top - margin.bottom]);
            //[positivo, negativo, alegria, tristeza, nojo,
            // antecipação, medo, surpresa, confiança, raiva]
var emotion = ["#f1a9a0", "#95a5a6", "#fef160", "#1f3a93", "#bf55ec",
               "#f89406", "#26a65b", "#81cfe0", "#87d37c", "#f22613"]
var color = d3.scaleOrdinal()
              .range(emotion);

var fader = function(color) { return d3.interpolateRgb(color, "#fff")(0.2); };

var treeLayout, transitioning;

var svg, grandparent;

draw(data);

function draw(data){
    if (svg){
        svg.selectAll("*").remove();
    }
    else{
        svg = d3.select('#treemap')
                .append('svg')
                .attr("width", width - margin.left - margin.right)
                .attr("height", height - margin.bottom - margin.top)
                .style("margin-left", -margin.left + "px")
                .style("margin.right", -margin.right + "px");



        grandparent = svg.append("g")
                         .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
                         .style("shape-rendering", "crispEdges")
                         .attr("class", "grandparent");

        /*grandparent.append("rect")
                   .attr("y", -margin.top)
                   .attr("width", width)
                   .attr("height", margin.top);

        grandparent.append("text")
                   .attr("x", 6)
                   .attr("y", 6 - margin.top)
                   .attr("dy", ".75em");*/

        treeLayout = d3.treemap()
                       .size([width, height])
                       .paddingInner(1);
    }

    var treeRoot = d3.hierarchy(data)
                     .eachBefore(
                        d => d.id = (d.parent ? d.parent.id + "." : "") + d.data.name
                     )
                     .sum(d => d.value);

    initialize(treeRoot);
    accumulate(treeRoot);
    // layout(treeRoot);
    treeLayout(treeRoot);
    display(treeRoot);
};

function initialize(root){
    root.x = root.y = 0;
    root.x1 = width;
    root.y1 = height;
    root.depth = 0;
}

function accumulate(d){
    if (d._children = d.children){
        d.value = d.children.reduce((p, v) => p + accumulate(v), 0);
    }
    return d.value
}

function layout(d){
    if(d._children){
        treeLayout.nodes({_children: d._children});
        treeLayout(d);
        d._children.forEach(function(c){
            c.x0 = d.x0 + c.x0 * d.x1;
            c.y0 = d.y0 + c.y0 * d.y1;
            c.x1 *= d.x1;
            c.y1 *= d.y1;
            c.parent = d;
            layout(c);
        });
    }
}

function display(data){
    grandparent.datum(data.parent);

    var g1 = svg.insert("g", ".grandparent")
                .datum(data)
                .attr("class", "depth");

    var g = g1.selectAll("g")
              .data(data._children)
              .enter()
              .append("g");

    g.filter(d => d._children)
     .classed("children", true);

    var children = g.selectAll(".child")
                    .data(d => d._children || [d])
                    .enter()
                    .append("g");

    children.append("rect")
            .attr("class", "child")
            .call(rect)
            .append("title")
            .text(d => d.data.name + " (" + d.value + ")");

    /*children.append("text")
            .attr("class", "ctext")
            .text(d => d.data.name)
            .call(text2);*/
    g.append("rect")
     .attr("class", "parent")
     .call(rect)

    var t = g.append("text")
             .attr("class", "ptext")
             .attr("dy", ".75em");

    t.append("tspan")
     .text(d => d.data.name);
    t.append("tspan")
     .attr("dy", "1.0em")
     .text(d => d.value);
    t.call(text);

    g.selectAll("rect.parent")
     .style("fill", d => color(d.data.name))
     .style("opacity", ".8");
}

function rect(rect){
    rect.attr('x', d => d.x0)
        .attr('y', d => d.y0)
        .attr('width', d => d.x1 - d.x0)
        .attr('height', d => d.y1 - d.y0);
}

function text2(text) {
    text.attr("x", d => d.x0 + d.x1 - 6)
        .attr("y", d => d.y0 + d.y1 - 6);
}

function text(text){
    text.selectAll("tspan")
        .attr("x", d => d.x0 + 6);
    text.attr("x", d => d.x0 + 6)
        .attr("y", d => d.y0 + 10);
}

function name(data){
    return d.parent
        ? name(d.parent) + " /" + d.data.name + " (" + d.value + ")"
        : d.data.name + " (" + d.value + ")";
}
