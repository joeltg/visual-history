var height_scale = 180;
var old_body_style = 'auto';
var default_image = chrome.extension.getURL('tab.png');
var NAV = false;

var css = document.createElement('link');
css.setAttribute("type", "text/css");
css.setAttribute("rel", "stylesheet");
css.setAttribute("href", chrome.extension.getURL("tree.css"));
var head = document.head || document.getElementsByTagName( "head" )[0] || document.documentElement;
head.insertBefore(css, head.firstChild);

if (document.getElementById('install-histree-button'))
    document.getElementById('install-histree-button').innerHTML = 'View in Chrome Web Store';

var body = document.getElementsByTagName("body")[0];
var d = makeDiv();

function makeDiv() {
    d = document.createElement("div");
    d.setAttribute("id", "histree");
    d.style.padding = 0;
    d.style.margin = 0;
    d.style.position = 'fixed';
    d.style.height = window.innerHeight;
    d.style.width = window.innerWidth;
    d.style.left = 0;
    d.style.right = 0;
    d.style.top = 0;
    d.style.bottom = 0;
    d.style.zIndex = -1;
    d.style.visibility = 'hidden';
    d.style.overflowY = 'hidden';
    d.style.overflowX = 'hidden';
    d.style.backgroundColor = "rgba(255, 255, 255, 0.8)";
    body.insertBefore(d, body.firstChild);
    return d;
}

document.documentElement.onkeyup = function(e) {
    if ((e.keyCode == "17" || e.keyIdentifier == "Meta") && NAV) {
        chrome.runtime.sendMessage({key: 'ctrl'}, function() {});
        removeTree();
    }
};

chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    if (!NAV) {
        if (message.move == 'stay') d.style.overflowY = 'scroll';
        createTree(message.tree, message.depth_of_current, message.max_depth);
        NAV = true;
    }
    else if (message.move == 'up') up();
    else if (message.move == 'down') down();
    else if (message.move == 'left') left();
    else if (message.move == 'right') right();
    else removeTree();
});

// ************** Generate the tree diagram	 *****************

var i = 0,
    duration = 1,
    root;

var tree, svg, currentNode;

function createTree(treeData, depth_of_current, max_depth) {
    root = treeData;
    root.x0 = 0;
    root.y0 = 0;
    old_body_style = body.style.overflowY;
    body.style.overflowY = 'hidden';
    d.style.zIndex = 1000;
    d.style.visibility = "visible";
    var height =  height_scale * (max_depth + 1);
    tree = d3.layout.tree().size([window.innerWidth, height]);
    svg = d3.select("#histree").append("svg")
        .attr("width", window.innerWidth)
        .attr("height", height)
        .attr("class", "histree-animated histree-fadeIn")
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
    d.scrollTop = (depth_of_current * height_scale) - (window.innerHeight / 2.0);
}

function findCurrent(node) {
    if (node.current) return node;
    if (node.children) for (var i = 0; i < node.children.length; i++) {
        var current = findCurrent(node.children[i]);
        if (current != false) return current;
    }
    return false;
}

function removeTree() {
    document.getElementsByTagName("body")[0].style.overflowY = old_body_style;
    if (svg) svg.remove();
    d.parentElement.removeChild(d);
    d = null;
    makeDiv();
    NAV = false;
    svg = null;
    tree = null;
}

function update(source) {
    // Compute the new tree layout.
    var nodes = tree.nodes(root).reverse(),
        links = tree.links(nodes);

    // Normalize for fixed-depth.
    nodes.forEach(function(d) { d.y = d.depth * height_scale; });

    // Update the nodes…
    var node = svg.selectAll("g.histree-node").data(nodes, function(d) { return d.id || (d.id = ++i); });

    // Enter any new nodes at the parent's previous position.
    var nodeEnter = node.enter().append("g")
        .attr("class", "histree-node")
        .attr("transform", function() { return "translate(" + source.y0 + "," + source.x0 + ")"; })
        .on("click", click);

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
        .duration(0)
        .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });

    for(i=0; i<node[0].length; i++) {
        if (d3.select(node[0][i]).datum().current) {
            var color = rgbToHex(64, 128, 192);
            var img_color = d3.select(node[0][i]).datum().img_color;
            if (img_color) color = rgbToHex(img_color[0], img_color[1], img_color[2]);
            d.scrollTop = d3.select(node[0][i]).datum().y0 - (window.innerHeight / 2.0);
            d3.select(node[0][i]).select("text").attr("fill",color).attr("class","histree-shadow");
            d3.select(node[0][i]).select("image").attr("filter", "url(#f1)").attr("xlink:href", function(d) {
                if (d.image_url) return d.image_url;
                if (d.icon_url) return d.icon_url;
                return default_image;
            });
        } else {
            d3.select(node[0][i]).select("text").attr("fill","black").attr("class","histree-no-shadow");
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
        .attr("class", "histree-link")
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
    if (r + g + b < 32 * 3) {
        r = 256 - r;
        b = 256 - b;
        g = 256 - g;
    }
    return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}

// Navigate to nodes on click.
function click(d) {
    if (!d) return;
    if (d.current) removeTree();
    else {
        d.current = true;
        currentNode = d;
        if (d.full_url) location.href = d.full_url;
        else {
            chrome.runtime.sendMessage({key: 'ctrl'}, function() {});
            removeTree();
        }
    }
}