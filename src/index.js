import domready from "domready"
import "./style.css"
import randomPalette, { randomPaletteWithBlack } from "./randomPalette"
import HexagonPatch from "./HexagonPatch"
import Color from "./Color"
import Vector from "./Vector"


const PHI = (1 + Math.sqrt(5)) / 2;
const TAU = Math.PI * 2;
const DEG2RAD_FACTOR = TAU / 360;

const config = {
    width: 0,
    height: 0,
    palette: ["#000", "#fff"],

    petalA: {
        mid: 0.5,
        width: 0.55,
        scale: 0.9,
        pollenRadius: 0.2,
        color: "#f00",
        alpha: 0.5
    },

    petalB: {
        mid: 0.5,
        width: 0.35,
        scale: 0.65,
        pollenRadius: 0.3,
        color: "#fc0",
        alpha: 0.8
    }
};

const stemAlpha = 0.85;

function renderPetal(face, closest, {mid, color, width = 0.55, scale = 0.95, alpha = 1})
{

    const pts = getPoints(closest)

    let [ x0, y0, x1, y1, x2, y2, x3, y3] = pts;

    x2 = x0 + (x2 - x0) * scale
    y2 = y0 + (y2 - y0) * scale

    const vA = new Vector(x1 - x0, y1 - y0)
    const vB = new Vector(x3 - x0, y3 - y0)
    const vCenter = new Vector(x2 - x0, y2 - y0)

    const sq = vCenter.x * vCenter.x + vCenter.y * vCenter.y
    const scaleA = vA.dot(vCenter) / sq
    const scaleB = vB.dot(vCenter) / sq

    const projA = vCenter.clone().scale(scaleA).add(x0,y0)
    const projB = vCenter.clone().scale(scaleB).add(x0,y0)

    const correctedA = vCenter.clone().scale(mid - scaleA).add(new Vector(x1,y1).subtract(projA).scale(width).add(projA))
    const correctedB = vCenter.clone().scale(mid - scaleB).add(new Vector(x3,y3).subtract(projB).scale(width).add(projB))

    const midPoint = new Vector((x0 + x2)/2, (y0 + y2)/2)

    const cpA = correctedA.clone().subtract(midPoint).scale(2).add(midPoint)
    const cpB = correctedB.clone().subtract(midPoint).scale(2).add(midPoint)

    ctx.fillStyle = Color.from(color).toRGBA(alpha)
    ctx.beginPath()
    ctx.moveTo(x0,y0)
    ctx.quadraticCurveTo(cpA.x, cpA.y, x2, y2)
    ctx.quadraticCurveTo(cpB.x, cpB.y, x0, y0)
    ctx.fill()
}


/**
 * @type CanvasRenderingContext2D
 */
let ctx;
let canvas;

const overdraw = 1.1

const MIN_SIZE = 64;

function drawArrow(x0, y0, x1, y1)
{
    const { width, height} = config;

    const cx = width/2;
    const cy = height/2;

    const dy = y1 - y0;
    const dx = x1 - x0;

    if (dx * dx + dy * dy > 2)
    {
        const nx = dy * 0.08
        const ny = -dx * 0.08

        const start = 0.01
        const end = 0.5

        const x2 = x0 + (x1 - x0) * start
        const y2 = y0 + (y1 - y0) * start
        const x3 = x0 + (x1 - x0) * end
        const y3 = y0 + (y1 - y0) * end

        const x4 = x0 + (x1 - x0) * (start + (end - start) * 0.6)
        const y4 = y0 + (y1 - y0) * (start + (end - start) * 0.6)

        ctx.beginPath()
        ctx.moveTo(cx + x2, cy + y2)
        ctx.lineTo(cx + x3, cy + y3)

        ctx.moveTo(cx + x3, cy + y3)
        ctx.lineTo(cx + x4 + nx, cy + y4 + ny)
        ctx.moveTo(cx + x3, cy + y3)
        ctx.lineTo(cx + x4 - nx, cy + y4 - ny)
        ctx.stroke()
    }
}

const Mode = {
    GREEN: 1,
    FLOWER_A: 2,
    FLOWER_B: 3
}

const COLORS = {
    [Mode.GREEN] : "rgba(0,170,0, 0)",
    [Mode.FLOWER_A] : "#f00",
    [Mode.FLOWER_B] : "#f80",
}

function renderDebugFace(modes, face, drawNext = false, ids = false)
{
    const { width, height} = config;

    const cx = width/2;
    const cy = height/2;

    const faceCentroid = face.centroid

    if (ids)
    {
        const label = String(face.id);
        const tm = ctx.measureText(label);
        ctx.fillStyle = "#ccc"
        ctx.fillText(label, cx + faceCentroid[0] - tm.width/2, cy + faceCentroid[1] + 4)
    }
    // else
    // {
    //     ctx.fillStyle = "#0f0"
    //     ctx.fillRect(cx + faceCentroid[0] - 2, cy + faceCentroid[1] - 2, 4, 4)
    // }

    const first = face.halfEdge;
    let curr = first;

    const [mode, rx, ry] = modes.get(face.id);

    ctx.fillStyle = COLORS[mode]
    
    ctx.save()

    ctx.strokeStyle = "#fff"
    ctx.lineWidth = 1
    ctx.beginPath()

    do
    {
        const next = curr.next;

        const x0 = 0|(cx + curr.vertex.x)
        const y0 = 0|(cy + curr.vertex.y)
        const x1 = 0|(cx + next.vertex.x)
        const y1 = 0|(cy + next.vertex.y)

        if (curr === first)
        {
            ctx.moveTo(x0, y0)
        }
        ctx.lineTo(x1, y1)

        curr = next
    }  while (curr !== first)

    ctx.stroke()
    //ctx.fill()
    ctx.restore()

    curr = first
    do
    {
        const next = curr.next;

        const x0 = 0|(cx + curr.vertex.x)
        const y0 = 0|(cy + curr.vertex.y)
        const x1 = 0|(cx + next.vertex.x)
        const y1 = 0|(cy + next.vertex.y)

        const x2 = 0|((x0 + x1)/2 - cx)
        const y2 = 0|((y0 + y1)/2 - cy)

        if (drawNext)
        {
            const { twin }  = curr;
            if (twin)
            {
                const [ x0, y0 ] = faceCentroid;

                ctx.strokeStyle = "#666"
                drawArrow(x2, y2, x0, y0);
            }

        }

        curr = next
    }  while (curr !== first)
}

const black = new Color(0,0,0)

const ambient = 0.2

function renderLeaf(x0, y0, centroidX, centroidY, x1, y1)
{
    // center point of the line
    let midLineX = ( x0 + x1 )  /2
    let midLineY = ( y0 + y1 )  /2

    // delta to centroid
    const dcx = centroidX - midLineX
    const dcy = centroidY - midLineY

    // point on quadratic bezier at midpoint
    const sx = midLineX + dcx * 0.5
    const sy = midLineY + dcy * 0.5

    // delta from former point to end point
    const dx = x1 - sx
    const dy = y1 - sy

    const l = 1.3 + 0.7 * Math.random()

    const mx = sx + dx * l * 0.5
    const my = sy + dy * l * 0.5
    const ex = sx + dx * l
    const ey = sy + dy * l

    const angle = (0.3 + 0.7 * Math.random()) * TAU/4;

    const lft = Math.cos(angle)
    const rgt = Math.cos(angle + TAU * 0.45 )
    const lightLeft = ambient + (1 - ambient) * Math.max(0, lft)
    const lightRight = ambient + (1 - ambient) * Math.max(0, rgt)

    ctx.fillStyle = Color.from("#080").mix(black,  lightLeft).toRGBA(stemAlpha)
    ctx.beginPath()
    ctx.moveTo(sx,sy)
    ctx.quadraticCurveTo( mx - dy * lft, my + dx * lft, ex, ey)
    ctx.lineTo(sx,sy)
    ctx.fill()
    ctx.fillStyle = Color.from("#080").mix(black, lightRight).toRGBA(stemAlpha)
    ctx.beginPath()
    ctx.moveTo(sx,sy)
    ctx.quadraticCurveTo( mx + dy * rgt, my - dx * rgt, ex, ey)
    ctx.lineTo(sx,sy)
    ctx.fill()
}


function findClosest(face, rx, ry)
{
    const { width, height} = config;

    const cx = width/2;
    const cy = height/2;

    const first = face.halfEdge

    let minDistance = Infinity;
    let best = null;

    let curr = first
    do
    {
        const next = curr.next;

        const x0 = 0|(cx + curr.vertex.x)
        const y0 = 0|(cy + curr.vertex.y)

        const dx = rx - x0
        const dy = ry - y0

        const distance = Math.sqrt(dx * dx + dy * dy)

        if (distance < minDistance)
        {
            minDistance = distance;
            best = curr;
        }

        curr = next
    }  while (curr !== first)
    return best;
}


function getPoints(curr)
{

    const { width, height } = config

    const cx = width / 2
    const cy = height / 2

    const first = curr
    const pts = []
    do
    {
        const next = curr.next

        const x0 = 0 | (cx + curr.vertex.x)
        const y0 = 0 | (cy + curr.vertex.y)

        pts.push(x0, y0)

        curr = next
    } while (curr !== first)

    return pts
}


function renderStems(modes, face)
{
    const { width, height} = config;

    const cx = width/2;
    const cy = height/2;


    const first = face.halfEdge;
    let curr = first;

    const [mode, rx, ry] = modes.get(face.id);

    ctx.fillStyle = COLORS[mode]


    const faceCentroid = face.centroid

    const [ x0, y0, x1, y1, x2, y2, x3, y3] = getPoints(curr);

    ctx.strokeStyle = Color.from("#080").toRGBA(stemAlpha)
    ctx.beginPath()

    const double = Math.random() < 0.6;

    const centroidX = cx + faceCentroid[0]
    const centroidY = cy + faceCentroid[1]
    
    if (Math.random() < 0.5)
    {
        ctx.moveTo(x0, y0);
        ctx.quadraticCurveTo(centroidX,  centroidY, x1, y1)


        if (double)
        {
            ctx.moveTo(x2, y2);
            ctx.quadraticCurveTo(centroidX,  centroidY, x3, y3)
        }
        ctx.stroke()

        if (Math.random() < 0.8)
        {
            renderLeaf(x0, y0, centroidX, centroidY, x1, y1)
        }
    }
    else
    {
        ctx.moveTo(x0, y0);
        ctx.quadraticCurveTo(centroidX,  centroidY, x3, y3)

        if (double)
        {
            ctx.moveTo(x2, y2);
            ctx.quadraticCurveTo(centroidX,  centroidY, x1, y1)
        }
        ctx.stroke()

        if (Math.random() < 0.8)
        {
            renderLeaf(x0, y0, centroidX, centroidY, x3, y3)
        }
    }

}

function renderFlowers(modes, face, pollenA, pollenB)
{
    const { width, height} = config;

    const cx = width/2;
    const cy = height/2;

    const [mode, rx, ry] = modes.get(face.id);

    const closest = findClosest(face, rx , ry )
    const isFlowerA = mode === Mode.FLOWER_A
    const isFlowerB = mode === Mode.FLOWER_B
    if (isFlowerA)
    {
        renderPetal(face, closest, config.petalA)
    }
    else if (isFlowerB)
    {
        renderPetal(face, closest, config.petalB)
    }


    if (isFlowerA || isFlowerB)
    {
        const { x: x0, y: y0 } = closest.vertex
        const { x: x1, y: y1 } = closest.next.next.vertex

        const dx = x1 - x0
        const dy = y1 - y0

        const l = Math.sqrt(dx * dx + dy * dy)

        let { pollenRadius = 0.3 } = isFlowerA ? config.petalA : config.petalB
        let { scale = 0.95 } = isFlowerA ? config.petalA : config.petalB

        pollenRadius *= l * scale

        ctx.fillStyle = isFlowerA ? pollenA : pollenB
        ctx.beginPath()
        ctx.moveTo( cx + x0 + pollenRadius, cy + y0)
        ctx.arc( cx + x0, cy + y0, pollenRadius, 0, TAU, true)
        ctx.fill()

    }

}


function insertFaces(map, face)
{
    const { width, height} = config;

    const cx = width/2;
    const cy = height/2;

    const first = face.halfEdge;
    let curr = first;

    // ctx.save()
    //
    // ctx.strokeStyle = "#fff"
    // ctx.beginPath()

    do
    {
        const next = curr.next;

        const x0 = 0|(cx + curr.vertex.x)
        const y0 = 0|(cy + curr.vertex.y)
        // const x1 = 0|(cx + next.vertex.x)
        // const y1 = 0|(cy + next.vertex.y)

        const key = x0 + "/" + y0
        let ids = map.get(key)
        if (!ids)
        {
            ids = [ face.id ]
            map.set(key,ids)
        }
        else
        {
            ids.push(face.id)
        }

        // if (curr === first)
        // {
        //     ctx.moveTo(x0, y0)
        // }
        // ctx.lineTo(x1, y1)

        curr = next
    }  while (curr !== first)
    // ctx.stroke()
    // ctx.restore()
}


/**
 * Returns a mode map for the given points map
 * @param map
 * @returns {Map<number, array>}
 */
function classify(map)
{
    const modes = new Map()

    const updateMode = (id, mode,pts) => {
        if (!modes.has(id) || modes.get(id)[0] < mode)
        {
            const m = /(.*)\/(.*)/.exec(pts)

            if (!m)
            {
                throw new Error("FAILED: " + pts)
            }

            modes.set(id, [mode, m[1], m[2]])
        }
    }

    for (let [pts, ids] of map)
    {
        if (ids.length === 6)
        {
            ids.forEach(id => updateMode(id, Mode.FLOWER_A, pts))
        }
        else if (ids.length === 5)
        {
            ids.forEach(id => updateMode(id, Mode.FLOWER_B, pts))
        }
        else if (ids.length === 4 || ids.length === 3)
        {
            ids.forEach(id => updateMode(id, Mode.GREEN, pts))
        }
    }
    return modes
}


function getTwoDistinctColors(palette, exclusionA = null, exclusionB = null)
{
    let rndA
    let rndB
    do
    {
        rndA = 0 | Math.random() * palette.length
        rndB = 0 | Math.random() * palette.length

    } while (
        rndA === rndB ||
        rndA === exclusionA ||
        rndB === exclusionB
    )

    return [
        palette[rndA],
        palette[rndB]
    ]
}

function getThreeDistinctColors(palette)
{
    let rndA = 0|Math.random() * palette.length
    let rndB
    let rndC
    do
    {
        rndB = 0 | Math.random() * palette.length
        rndC = 0 | Math.random() * palette.length

    } while (
        rndA === rndB ||
        rndA === rndC || rndB === rndC
    )

    return [
        palette[rndA],
        palette[rndB],
        palette[rndC]
    ]
}

const shadow = Color.from("#04112a")

domready(
    () => {

        canvas = document.getElementById("screen");
        ctx = canvas.getContext("2d");

        const width = (window.innerWidth) | 0;
        const height = (window.innerHeight) | 0;

        config.width = width;
        config.height = height;

        canvas.width = width;
        canvas.height = height;

        const cx = width >> 1
        const cy = height >> 1


        const paint = () => {

            const palette = randomPalette()

            let [ bgA, colorA, colorB ] = getThreeDistinctColors(palette)
            let [ pollenA, pollenB ] = getTwoDistinctColors(palette, colorA, colorB)

            bgA = Color.from(bgA).mix(black, 0.8).toRGBHex()
            const bgB = Color.from(bgA).mix(shadow, 0.9).toRGBHex()

            config.palette = palette
            config.petalA.color = colorA
            config.petalA.alpha = 0.7 + Math.random() * 0.3
            config.petalA.scale = 0.5 + Math.random() * 0.7
            config.petalA.width = 0.5 + Math.random() * 0.5
            config.petalA.mid = 0.1 + Math.random() * 0.75
            config.petalA.pollenRadius = 0.2 + Math.random() * 0.2

            config.petalB.color = colorB
            config.petalB.alpha = 0.7 + Math.random() * 0.3
            config.petalB.scale = 0.3 + Math.random() * 0.5
            config.petalB.width = 0.5 + Math.random() * 0.5
            config.petalB.mid = 0.1 + Math.random() * 0.75
            config.petalB.pollenRadius = 0.2 + Math.random() * 0.2

            const size = Math.min(width, height)

            const gradient = ctx.createRadialGradient(cx, cy, size * 0.65,cx,cy,size)
            gradient.addColorStop(0, bgA)
            gradient.addColorStop(1, bgB)
            ctx.fillStyle = gradient
            ctx.lineWidth = 2
            ctx.fillRect(0,0,width,height)


            ctx.fillStyle = "#f00"

            const hexagonSize = Math.round(width * 0.06) //(0.05 + Math.random() * 0.05))
            config.hexagonSize = hexagonSize
            const patch = new HexagonPatch(0, 0, hexagonSize)
            const faces = patch.build();

            const pointMap = new Map()
            faces.forEach( face => insertFaces(pointMap, face) )
            const modes = classify(pointMap)

            console.log("MAP", pointMap)

            // ctx.globalAlpha = 0.1
            // ctx.globalAlpha = 1
            faces.forEach( face => {
                renderStems(modes, face)
                renderFlowers(modes, face, pollenA, pollenB)
            })

            //faces.forEach( face => renderDebugFace(modes, face) )

        }

        paint()

        canvas.addEventListener("click", paint, true)
    }
);

