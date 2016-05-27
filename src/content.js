/**
 * Created by joel on 5/18/16.
 */

"use strict";

let callback = null;
let SELECTING = false;
let svg = null;
let currentId = 0;
let clicked = false;

// assemble container element
const container = document.createElement('div');
container.id = 'visual-history-container';

// attach container element to document body wherever convenient
if (document.body.firstChild)
    document.body.insertBefore(container, document.body.firstChild);
else
    document.body.appendChild(container);

// close on loose click
container.onclick = e => exit(false);

// track right-clicked elements for the contextMenu
document.documentElement.addEventListener('mousedown', e =>
    e.button === 2 && e.target.textContent ? clicked = e.target.textContent : null, true);

function makeTree(data) {
    const imageSize = data.imageSize;
    const nodeWidth = data.nodeWidth;

    // freeze the document body and class the container
    document.body.classList.add('visual-history-freeze');
    container.className = 'visual-history-container-visible';
    console.log('setting container top and left to', document.body.scrollTop, document.body.scrollLeft);

    container.style.setProperty("top", String(document.body.scrollTop) + 'px', "important");
    container.style.setProperty("left", String(document.body.scrollLeft) + 'px', "important");
    console.log('container is now', container.style.top, container.style.left);

    // start appending all the things

    // svg element contains a single wrapper g cell
    svg = d3_selection.select('#visual-history-container')
        .append('svg')
        .attr('width', data.width)
        .attr('height', data.height)
        .attr('id', 'visual-history-svg')
        .append('g');

    // append and class links
    const links = svg.selectAll('path').data(data.links, link => link.id);
    links.enter().append('line')
        .attr("class", "visual-history-link")
        .attr("x1", link => link.source.x)
        .attr("y1", link => link.source.y)
        .attr("x2", link => link.target.x)
        .attr("y2", link => link.target.y);

    // append and class nodes, and save the selector createNode for later
    const nodes = svg.selectAll('g').data(data.nodes, node => node.id);
    const createNode = nodes.enter().append('g')
        .attr('transform', node => `translate(${node.position.x},${node.position.y})`)
        .classed('visual-history-current', node => node.id === data.current.id)
        .classed('visual-history-preview', node => node.data.preview)
        .classed('visual-history-node', true)
        .attr('id', node => `visual-history-id-${node.id}`)
        .on('click', click);

    // append favIcon images to the node g cells
    createNode.append('image')
        .attr('x', `-${imageSize / 2.0}px`)
        .attr('y', `-${imageSize / 2.0}px`)
        .attr('width', `${imageSize}px`)
        .attr('height', `${imageSize}px`)
        .attr('xlink:href', node => node.data.favIconUrl)
        .attr('class', 'visual-history-image');

    // append an html wrapper div to the node g cells and save the selector to later
    const div = createNode.append('foreignObject')
        .attr('x', `-${nodeWidth / 2.0}px`)
        .attr('y', `${imageSize / 2.0}px`)
        .attr('width', `${nodeWidth}px`)
        .attr('height', `${imageSize}px`)
        .append('xhtml:div')
        .attr('class', 'visual-history-text');

    // append the title html element to the wrapper
    div.append('p')
        .attr('class', 'visual-history-title')
        .html(node => node.data.title || makeTitle(node.data.url));

    // append the url html element to the wrapper
    div.append('p')
        .attr('class', 'visual-history-url')
        .html(node => node.data.url);

    // class the current node and center position
    updateCurrent(data.current);

    // the day will come when I understand CSS animations
    container.style.opacity = 1;
}

function removeTree() {
    SELECTING = false;
    container.removeChild(document.getElementById('visual-history-svg'));
    container.className = '';
    svg = null;
    document.body.classList.remove('visual-history-freeze');

    container.style.opacity = 0;
    // but today is not that day.
}

function updateCurrent(current) {
    // class the current node
    d3_selection.select(`#visual-history-id-${current.id}`)
        .classed('visual-history-current', true)
        .classed('visual-history-preview', false);
    if (current.id !== currentId) {
        d3_selection.select(`#visual-history-id-${currentId}`).classed('visual-history-current', false);
        currentId = current.id;
    }

    // center current position
    container.scrollLeft = current.x - document.body.clientWidth / 2.0;
    container.scrollTop = current.y - document.body.clientHeight / 2.0;
}

function click(node) {
    // this is the only time we callback with a url
    // in all other cases, backend.js already knows
    // about the changes and will update accordingly
    exit(node.data.url);
}

function makeTitle(url) {
    // TODO: add fancy formatting for url titles
    return url;
}

document.documentElement.onkeyup = e => {
    const key = e.keyCode || e.which;
    // exit on Ctrl or Cmd release
    if (key === 17 || e.metaKey) exit(false);
};

document.documentElement.onkeydown = e => {
    const key = e.keyCode || e.which;
    // exit on Escape down
    if (key === 27 || e.code === 'Escape') exit(false);
};

function exit(url) {
    if (SELECTING) {
        removeTree();
        // make sure to seal the free closure upon exiting the building.
        callback({url: url});
    }
}

chrome.runtime.onMessage.addListener((data, sender, sendResponse) => {
    if (data.type === 'clicked') sendResponse({text: clicked});

    // callback on every other browserAction click.
    else if (data.type === 'close') exit(false);

    // moving the current pointer doesn't evaluate the closure
    else if (data.type === 'move' && SELECTING) updateCurrent(data.current);

    // do all the things
    else if (data.type === 'tree' && !SELECTING) {
        SELECTING = true;
        callback = sendResponse;
        makeTree(data);

        // only let one closure escape at a time
        return true;
    }
});