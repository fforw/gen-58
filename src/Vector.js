export default class Vector {

    constructor(x, y)
    {
        this.x = x;
        this.y = y;
    }

    add(x, y)
    {
        if (y === undefined)
        {
            this.x += x.x;
            this.y += x.y;
        }
        else
        {
            this.x += x;
            this.y += y;
        }
        return this;
    }

    subtract(x, y)
    {
        if (y === undefined)
        {
            this.x -= x.x;
            this.y -= x.y;
        }
        else
        {
            this.x -= x;
            this.y -= y;
        }
        return this;
    }

    scale(s)
    {
        this.x *= s;
        this.y *= s;
        return this;
    }

    len()
    {
        const { x, y } = this
        return Math.sqrt(x * x + y * y);
    }

    norm(len)
    {
        const invLen = (len || 1) / this.len()
        return this.scale(invLen);
    }

    clone()
    {
        return new Vector(this.x, this.y);
    }

    dot(v)
    {
        return this.x * v.x + this.y * v.y;
    }

    projectOnto(b)
    {
        const dp = this.dot(b)
        const scale = dp / (b.x * b.x + b.y * b.y)
        return new Vector(scale * b.x, scale * b.y);
    }

    angleTo(v)
    {
        const deltaX = this.x - v.x
        const deltaY = this.y - v.y
        return Math.atan2(deltaY, deltaX);
    }

    toString()
    {
        return "( " + this.x + ", " + this.y + ")";
    }
}
