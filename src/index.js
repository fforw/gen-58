import domready from "domready"
import "./style.css"
import { voronoi } from "d3-voronoi"
import { polygonCentroid } from "d3-polygon"

const PHI = (1 + Math.sqrt(5)) / 2;
const TAU = Math.PI * 2;
const DEG2RAD_FACTOR = TAU / 360;

const config = {
    width: 0,
    height: 0
};

/**
 * @type CanvasRenderingContext2D
 */
let ctx;
let canvas;

const overdraw = 1.1

function randomPoints(num = 50)
{
    const { width, height } = config

    const cx = width >> 1
    const cy = height >> 1

    let out = []
    for ( let i=0; i < num; i++)
    {
        out.push([
            Math.round(cx + (-0.5 + Math.random()) * overdraw * width),
            Math.round(cy + (-0.5 + Math.random()) * overdraw * height)
        ])
    }
    return out
}

function drawPolygon(polygon)
{
    const last = polygon.length - 1
    const [x1, y1] = polygon[last]

    ctx.beginPath()
    ctx.moveTo(
        x1 | 0,
        y1 | 0
    )

    for (let i = 0; i < polygon.length; i++)
    {
        const [x1, y1] = polygon[i]
        ctx.lineTo(x1 | 0, y1 | 0)
    }
    ctx.fill()
    ctx.stroke()
}



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

            const v = voronoi().extent([
                [Math.floor(cx - width * overdraw * 0.5), Math.floor(cy - height * overdraw * 0.5)],
                [Math.ceil(cx + width * overdraw * 0.5), Math.ceil(cy + height * overdraw * 0.5)]]
            )

            let pts = randomPoints(30)
            ctx.fillStyle = "#000";
            ctx.fillRect(0,0, width, height);

            const relaxCount = 15;

            for (let i=0; i < relaxCount; i++)
            {
                const diagram = v(pts);
                const polygons = diagram.polygons();
                pts = polygons.map(poly => {
                    if (!poly)
                    {
                        return null;
                    }
                    const [centroidX, centroidY] = polygonCentroid(poly)
                    return [
                        Math.round(centroidX), Math.round(centroidY)
                    ]
                });
            }

            const diagram = v(pts);

            console.log({diagram})

        }

        paint()

        canvas.addEventListener("click", paint, true)
    }
);
