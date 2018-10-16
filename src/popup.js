const width = 400, height = 300
const nWidth = 96, nHeight = 96
const size = 32
const span = 64
const margin = {top: 40, right: 90, bottom: 50, left: 90}
const svg = d3.select("body").append("svg")
    .attr("width", width)
    .attr("height", height)

const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`)

const fakeData = {
    title: "This is a title",
    favIconUrl: "fav",
    url: "url thing",
    children: [
        {
            title: "Another title",
            favIconUrl: "Another favicon",
            url: "another url",
            children: [],
        },
        {
            title: "A third title",
            favIconUrl: "A third favicon",
            url: "Can you believe this",
            children: [],
        }
    ]
}

const tree = d3.tree().nodeSize([nWidth, nHeight])

function connect({x, y, parent}) {
    return "M" + x + "," + y
        + "C" + x + "," + (y + parent.y) / 2
        + " " + parent.x + "," +  (y + parent.y) / 2
        + " " + parent.x + "," + parent.y
}

// Get current tab
browser.tabs.query({active: true, currentWindow: true, windowType: "normal"}).then(tabs => {
    if (tabs && tabs.length > 0) {
        const [{id}] = tabs
        browser.runtime.sendMessage(id, response => {
            let i = 0
            // const root = d3.hierarchy(response, ({children}) => children)
            const root = d3.hierarchy(fakeData, ({children}) => children)
            const nodes = tree(root)

            // Links
            g.selectAll(".link").data(nodes.descendants().slice(1), d => i++).enter()
                .append("path")
                .attr("class", "link")
                .attr("d", connect)

            // Nodes
            const node = g.selectAll(".node")
                .data(nodes.descendants(), d => i++)
                .enter().append("g")
                .attr("class", "node")
                .attr("transform", ({x, y}) => `translate(${x},${y})`)

            // node.append("circle").attr("r", 10)
            node.append("svg:image")
                .attr("width", size)
                .attr("height", size)
                .attr("transform", `translate(${-size / 2}, ${-size / 2})`)
                .attr("xlink:href", ({data: {favIconUrl}}) => favIconUrl)

            node.append("text")
                .attr("dy", `${size}px`)
                .attr("dx", `${-span}px`)
                .text(({data: {title}}) => title)
        })
    }
})