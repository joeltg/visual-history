//JS written by Kenneth Friedman and Joel Gustafson

var treeData = [
	{"name": "Hacker News",
	 "url": "news.yc",
	 "icon": "testShot.png",
	 "children": [
		{"name": "GRASP","icon": "testShot.png", "url": "news.yc", "children": [
			{"name": "JG Wikipedia", "url": "news.yc", "icon": "testShot.png"},
			{"name": "GRAIL","url": "news.yc", "icon": "testShot.png", "children": [
				{"name": "JG Wikipedia2", "url": "news.yc", "icon": "testShot.png"},
				{"name": "JG Wikipedia3", "url": "news.yc", "icon": "testShot.png"}
			]}
        ]},
        {"name": "Xanadu 2.0","url": "news.yc", "icon": "testShot.png"}
        ]}
];

//Selecting last element in array
if (!Array.prototype.last){
    Array.prototype.last = function(){
        return this[this.length - 1];
    };
};

//Add checkKey
document.onkeydown = checkKey;

// ************** Generate the tree diagram	 *****************
var margin = {top: 20, right: 120, bottom: 20, left: 120},
	width = 960 - margin.right - margin.left,
	height = 1000 - margin.top - margin.bottom;
	
var i = 0,
	duration = 5,
	root;

var tree = d3.layout.tree()
	.size([height, width]);

var svg = d3.select("body").append("svg")
	.attr("width", width + margin.right + margin.left)
	.attr("height", height + margin.top + margin.bottom)
	.attr("class", "animated fadeIn")
  .append("g")
	.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

root = treeData[0];
root.x0 = 0;
root.y0 = height / 2;
  
update(root);

d3.select(self.frameElement).style("height", "500px");

//this snippet grabs the furtherest right element
//(which I think is the node we are on to start...)
var currentNode = tree.nodes(root)[0];
while (currentNode.children) {
	currentNode = currentNode.children.last();
}

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

//Handle keyboard events
function checkKey(e) {
    e = e || window.event;

    if (e.keyCode == '38') { //up
        if (currentNode.parent) {
	        currentNode = currentNode.parent;
        }
    } else if (e.keyCode == '40') { //down
        if (currentNode.children) {
	        var last = currentNode.children.length-1;
	        currentNode = currentNode.children[last]
        }
    } else if (e.keyCode == '37') { //left
       if (currentNode.parent) {
	       var sisNodes = currentNode.parent.children;
	       var index = sisNodes.indexOf(currentNode);
	       if (index!=0) {
		       currentNode = sisNodes[index-1]
	       }
	    }	       
    } else if (e.keyCode == '39') { //right
       if (currentNode.parent) {
	       var sisNodes = currentNode.parent.children;
	       var index = sisNodes.indexOf(currentNode);
	       if (index!=sisNodes.length-1) {
		       currentNode = sisNodes[index+1]
	       }
	    }
    }
    update(svg);
}

// Toggle children on click.
function click(d) {
  update(d);
}