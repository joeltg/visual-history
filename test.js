var treeData = {
    "name":"New Tab... ",
    "url":"https://www.google.com/_/chrom... ",
    "image_url":null,
    "icon_url":"https://www.google.com/favicon.ico",
    "img_color":[136,172,241],
    "current":false,
    "children":[
        {"name":"Hacker News... ",
            "url":"https://news.ycombinator.com/... ",
            "image_url":null,
            "icon_url":"https://news.ycombinator.com/favicon.ico",
            "img_color":[252,100,4],
            "current":false,
            "children":[
                {"name":"Raspberry Pi Zero: the $5 comp... ",
                    "url":"https://news.ycombinator.com/i... ",
                    "image_url":null,
                    "icon_url":"https://news.ycombinator.com/favicon.ico",
                    "img_color":[252,100,4],
                    "current":false,
                    "children":[]
                },
                {
                    "name":"KnightOS – an open-source oper... ",
                    "url":"https://news.ycombinator.com/i... ",
                    "image_url":null,
                    "icon_url":"https://news.ycombinator.com/favicon.ico",
                    "img_color":[252,100,4],
                    "current":false,
                    "children":[]
                },{
                    "name":"How to Make a Pencil from Scra... ",
                    "url":"https://news.ycombinator.com/i... ",
                    "image_url":null,
                    "icon_url":"https://news.ycombinator.com/favicon.ico",
                    "img_color":[252,100,4],
                    "current":false,
                    "children":[
                        {"name":"Cracked, inSecure and Generall... ",
                            "url":"http://gse-compliance.blogspot... ",
                            "image_url":null,
                            "current":false,
                            "children":[]
                        },{
                            "name":"Quote by Carl Sagan: “If you wish to make an apple pie from scratch, ...”",
                            "url":"http://www.goodreads.com/quotes/32952-if-you-wish-to-make-an-apple-pie-from-scratch",
                            "image_url":null,
                            "current":true,
                            "children":[
                                {
                                    "name":"How to Make a Pencil from Scra... ",
                                    "url":"https://news.ycombinator.com/i... ",
                                    "image_url":null,
                                    "icon_url":"https://news.ycombinator.com/favicon.ico",
                                    "img_color":[252,100,4],
                                    "current":false,
                                    "children":[
                                        {"name":"Cracked, inSecure and Generall... ",
                                            "url":"http://gse-compliance.blogspot... ",
                                            "image_url":null,
                                            "current":false,
                                            "children":[]
                                        },{
                                            "name":"Quote by Carl Sagan: “If you wish to make an apple pie from scratch, ...”",
                                            "url":"http://www.goodreads.com/quotes/32952-if-you-wish-to-make-an-apple-pie-from-scratch",
                                            "image_url":null,
                                            "current":false,
                                            "children":[]
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                }
            ]
        }
    ]
};

var default_image = 'tab.png';

var body = document.getElementsByTagName("body")[0];
var style = body.currentStyle || window.getComputedStyle(body);
var margin = parseInt(style.margin.substr(0, style.margin.length - 2));
var width = parseInt(style.width.substr(0, style.width.length - 2)) - margin;
var height = parseInt(style.height.substr(0, style.height.length - 2)) - margin;

var d = document.createElement("div");
d.setAttribute("id", "histree");
d.style.padding = 0;
d.style.margin = 0;
d.style.position = 'absolute';
d.style.top = 0;
d.style.bottom = 0;
d.style.left = 0;
d.style.right = 0;
body.insertBefore(d, body.firstChild);

document.documentElement.onkeydown = function(e) {
    if (e.keyCode == 37) {
        // left
        left();
    }
    else if (e.keyCode == 38) {
        // up
        up();
    }
    else if (e.keyCode == 39) {
        // right
        right();
    }
    else if (e.keyCode == 40) {
        // down
        down();
    }
};

// ************** Generate the tree diagram	 *****************

var i = 0,
    duration = 5,
    root;

var tree, svg, currentNode;

function createTree(treeData, depth_of_current, max_depth) {
    root = treeData;
    root.x0 = 0;
    root.y0 = height / 2.0;
    //root.y0 = 0;

    document.getElementById("histree").style.zIndex = 1000;
    document.getElementById("histree").style.visibility = "visible";
    height = Math.max(height, 350 * max_depth);
    tree = d3.layout.tree().size([width, height]);
    svg = d3.select("#histree").append("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("class", "animated fadeIn")
        .append("g")
        .attr("transform", "translate(0, 50)");

    var defs = svg.append("defs");

    var filter = defs.append("filter")
        .attr("id", "f1")
        .attr("x", "0")
        .attr("y", "0")
        .attr("width", "500%")
        .attr("height", "500%");

    filter.append("feOffset")
        .attr("result", "offOut")
        .attr("in", "SourceAlpha")
        .attr("dx", "0")
        .attr("dy", "0");

    filter.append("feGaussianBlur")
        .attr("result", "blurOut")
        .attr("in", "offOut")
        .attr("stdDeviation", "3");

    filter.append("feBlend")
        .attr("in", "SourceGraphic")
        .attr("in2", "blurOut")
        .attr("mode", "normal");

    currentNode = findCurrent(root);
    update(root);
}

function findCurrent(node) {
    if (node.current) return node;
    if (node.children) for (var i = 0; i < node.children.length; i++) {
        var current = findCurrent(node.children[i]);
        if (current != false) return current;
    }
    return false;
}

function update(source) {
    // Compute the new tree layout.
    var nodes = tree.nodes(root).reverse(),
        links = tree.links(nodes);

    // Normalize for fixed-depth.
    nodes.forEach(function(d) { d.y = d.depth * 180; });

    // Update the nodes…
    var node = svg.selectAll("g.node").data(nodes, function(d) { return d.id || (d.id = ++i); });

    // Enter any new nodes at the parent's previous position.
    var nodeEnter = node.enter().append("g")
        .attr("class", "node")
        .attr("transform", function(d) { return "translate(" + source.y0 + "," + source.x0 + ")"; });

    nodeEnter.append("image")
        .attr("x", "-50px")
        .attr("y", "-50px")
        .attr("width", "100px")
        .attr("height", "100px")
        .attr("xlink:href", function(d) {
            if (d.current && d.image_url) return d.image_url;
            if (d.icon_url) return d.icon_url;
            return default_image;
        });
    nodeEnter.append("text")
        .attr("x", 0)
        .attr("dy", "4.5em")
        .attr("text-anchor", "middle")
        .text(function(d) { return d.name; })
        .style("fill-opacity", 1e-6)
        .style("font-weight", "bold");
    nodeEnter.append("text")
        .attr("x", 0)
        .attr("dy", "5.5em")
        .attr("text-anchor", "middle")
        .text(function(d) { return d.url; });

    // Transition nodes to their new position.
    var nodeUpdate = node.transition()
        .duration(duration)
        .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });

    for(i=0; i<node[0].length; i++) {
        if (d3.select(node[0][i]).datum().current) {
            var color = "red";
            var img_color = d3.select(node[0][i]).datum().img_color;
            d.scrollTop = d3.select(node[0][i]).datum().y0 - (window.height / 2.0) + 250;
            if (img_color) color = rgbToHex(img_color[0], img_color[1], img_color[2]);
            d3.select(node[0][i]).select("text").attr("fill",color).attr("class","shadow");
            d3.select(node[0][i]).select("image").attr("filter", "url(#f1)").attr("xlink:href", function(d) {
                if (d.image_url) return d.image_url;
                if (d.icon_url) return d.icon_url;
                return default_image;
            });
        } else {
            d3.select(node[0][i]).select("text").attr("fill","black").attr("class","no-shadow");
            d3.select(node[0][i]).select("image").attr("filter", null).attr("xlink:href", function(d) {
                return d.icon_url ? d.icon_url : default_image;
            });
        }
    }

    nodeUpdate.select("text")
        .style("fill-opacity", 1);

    // Transition exiting nodes to the parent's new position.
    var nodeExit = node.exit().transition()
        .duration(duration)
        .attr("transform", function(d) { return "translate(" + source.y + "," + source.x + ")"; })
        .remove();

    nodeExit.select("text")
        .style("fill-opacity", 1e-6);

    // Update the links…
    var link = svg.selectAll("path.link")
        .data(links, function(d) {return d.target.id;});

    //draw lines from below text to above image
    link.enter().append("line")
        .attr("class", "link")
        .attr("x1", function(d) { return d.source.x; })
        .attr("y1", function(d) { return d.source.y+75; })
        .attr("x2", function(d) { return d.target.x; })
        .attr("y2", function(d) { return d.target.y-40; });

    // Stash the old positions for transition.
    nodes.forEach(function(d) {
        d.x0 = d.x;
        d.y0 = d.y;
    });
}

function up() {
    if (currentNode.parent) {
        currentNode.current = false;
        currentNode = currentNode.parent;
        currentNode.current = true;
        update(svg);
    }
}

function down() {
    if (currentNode.children) {
        currentNode.current = false;
        var last = currentNode.children.length-1;
        currentNode = currentNode.children[last];
        currentNode.current = true;
        update(svg);
    }
}

function left() {
    if (currentNode.parent) {
        var sisNodes = currentNode.parent.children;
        var index = sisNodes.indexOf(currentNode);
        if (index!=0) {
            currentNode.current = false;
            currentNode = sisNodes[index-1];
            currentNode.current = true;
            update(svg);
        }
    }
}

function right() {
    if (currentNode.parent) {
        var sisNodes = currentNode.parent.children;
        var index = sisNodes.indexOf(currentNode);
        if (index!=sisNodes.length-1) {
            currentNode.current = false;
            currentNode = sisNodes[index+1];
            currentNode.current = true;
            update(svg);
        }
    }
}

function componentToHex(c) {
    var hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
}

function rgbToHex(r, g, b) {
    return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}

createTree(treeData, 3, 3);
