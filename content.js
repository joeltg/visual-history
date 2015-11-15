var body = document.getElementsByTagName("body")[0];
var style = body.currentStyle || window.getComputedStyle(body);
var margin = style.margin;
var width = parseInt(style.width.substr(0, style.width.length - 2));
var height = parseInt(style.height.substr(0, style.height.length - 2));

var d = document.createElement("div");
d.setAttribute("id", "histree");
d.setAttribute("style", "padding: 0; margin: " + margin +
    "; position: absolute; top: 0; bottom: 0; left: 0; right: 0;");
body.insertBefore(d, body.firstChild);
d.style.zIndex = -1;
margin = parseInt(margin.substr(0, 1));

var CTRL = false;
var NAV = false;

/*
document.documentElement.onkeydown = function(e) {
    if (e.keyIdentifier == "Up" || e.keyIdentifier == "Down" || e.keyIdentifier == "Left" || e.keyIdentifier == "Right") {
        console.log('got arrow key');
        if (CTRL) {
            console.log("checking for nav");
            if (!NAV) {
                NAV = true;
                console.log('creating tree');
                createTree();
            }
            checkKey(e);
        }
    }
    else if (e.keyIdentifier == 'U+00A2') {
        NAV = false;
        CTRL = true;
    }
};
*/

document.documentElement.onkeyup = function(e) {
    if (e.keyIdentifier == "U+00A2" || e.keyIdentifier == "Meta") {
        chrome.runtime.sendMessage({key: 'ctrl'}, function() {});
        CTRL = false;
        NAV = false;
        removeTree();
    }
};

chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    console.log(message);
    if (!NAV) {
        createTree(message.tree);
        NAV = true;
    }
    if (message.move == 'up') up();
    else if (message.move == 'down') down();
    else if (message.move == 'left') left();
    else if (message.move == 'right') right();
});

/*
var treeData = [
    {"name": "Hacker News",
        "url": "news.yc",
        "icon": "https://upload.wikimedia.org/wikipedia/commons/d/d5/Y_Combinator_Logo_400.gif",
        "children": [
            {"name": "GRASP","icon": "https://upload.wikimedia.org/wikipedia/commons/d/d5/Y_Combinator_Logo_400.gif", "children": [
                {"name": "JG Wikipedia", "icon": "https://upload.wikimedia.org/wikipedia/commons/d/d5/Y_Combinator_Logo_400.gif"},
                {"name": "GRAIL", "icon": "https://upload.wikimedia.org/wikipedia/commons/d/d5/Y_Combinator_Logo_400.gif"}
            ]},
            {"name": "Xanadu 2.0", "icon": "https://upload.wikimedia.org/wikipedia/commons/d/d5/Y_Combinator_Logo_400.gif"}
        ]}
];
*/

//Selecting last element in array
if (!Array.prototype.last){
    Array.prototype.last = function(){
        return this[this.length - 1];
    };
}

// ************** Generate the tree diagram	 *****************

var i = 0,
    duration = 750,
    root;



var tree, svg, currentNode;

function createTree(treeData) {
    root = treeData;
    root.x0 = 0;
    root.y0 = height / 2;

    document.getElementById("histree").style.zIndex = 1000;
    var treeWidth = Math.min(width, 400);
    var treeHeight = Math.min(height, 400);
    tree = d3.layout.tree().size([treeWidth, treeHeight]);
    svg = d3.select("#histree").append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", "translate(" + String((width - treeWidth) / 2.0) + "," + String(50) + ")");
    update(root);
    currentNode = tree.nodes(root)[0];
    while (currentNode.children) {
        currentNode = currentNode.children.last();
    }
}

function removeTree() {
    document.getElementById("histree").style.zIndex = -1;
    if (svg) svg.remove();
    svg = null;
    tree = null;
}


//this snippet grabs the furtherest right element
//(which I think is the node we are on to start...)


function update(source) {

    // Compute the new tree layout.
    var nodes = tree.nodes(root).reverse(),
        links = tree.links(nodes);

    // Normalize for fixed-depth.
    nodes.forEach(function(d) { d.y = d.depth * 180; });


    // Update the nodes…
    var node = svg.selectAll("g.node")
        .data(nodes, function(d) { return d.id || (d.id = ++i); });

    // Enter any new nodes at the parent's previous position.
    var nodeEnter = node.enter().append("g")
        .attr("class", "node")
        .attr("transform", function(d) { return "translate(" + source.y0 + "," + source.x0 + ")"; })
        .on("click", click);

    nodeEnter.append("image")
        .attr("xlink:href", function(d) { return d.icon; })
        .attr("x", "-50px")
        .attr("y", "-50px")
        .attr("width", "100px")
        .attr("height", "100px");

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
        .text(function(d) { return d.url; })

    // Transition nodes to their new position.
    var nodeUpdate = node.transition()
        .duration(duration)
        .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });

    if (currentNode) {
        for(i=0; i<node[0].length; i++) {
            var tempID = d3.select(node[0][i]).datum().id;
            var currentID = currentNode["id"];
            if (tempID==currentID) {
                console.log("Yeppers!!!!");
                d3.select(node[0][i]).select("text").attr("fill","red");
            } else {
                d3.select(node[0][i]).select("text").attr("fill","black");
            }
        }
    } else {
        console.log("There is no currentNode available");
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
        .attr("y2", function(d) { return d.target.y-40; })

    // Stash the old positions for transition.
    nodes.forEach(function(d) {
        d.x0 = d.x;
        d.y0 = d.y;
    });
}

//document.documentElement.onkeydown = checkKey;
//createTree();

//Handle keyboard events
function checkKey(e) {
    if (!NAV) return;
    e = e || window.event;

    if (e.keyCode == '38') up();
    else if (e.keyCode == '40') down();
    else if (e.keyCode == '37') left();
    else if (e.keyCode == '39') right();

    console.log(currentNode.id);
    //console.log(d3.select(currentNode))
}

function up() {
    if (currentNode.parent) {
        currentNode = currentNode.parent;
        update(svg);
    }
}

function down() {
    if (currentNode.children) {
        var last = currentNode.children.length-1;
        currentNode = currentNode.children[last];
        update(svg);
    }
}

function left() {
    if (currentNode.parent) {
        var sisNodes = currentNode.parent.children;
        var index = sisNodes.indexOf(currentNode);
        if (index!=0) {
            currentNode = sisNodes[index-1];
            update(svg);
        }
    }
}

function right() {
    if (currentNode.parent) {
        var sisNodes = currentNode.parent.children;
        var index = sisNodes.indexOf(currentNode);
        if (index!=sisNodes.length-1) {
            currentNode = sisNodes[index+1];
            update(svg);
        }
    }
}

// Toggle children on click.
function click(d) {
    update(d);
}