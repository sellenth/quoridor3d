export function translate(x, y, m)
{
    return multiply (m, [
        1, 0, 0,
        0, 1, 0,
        x, y, 1
    ]);
}

export function scale(x, y, m)
{
    return multiply (m, [
        x, 0, 0,
        0, y, 0,
        0, 0, 1
    ])
}

export function projection(width, height, m)
{
    return multiply (m, [
        2/width, 0, 0,
        0, -2/height, 0,
        -1, +1 , 1
    ])
}

export function rotationX(rad, m)
{
    let c = Math.cos(rad);
    let s = Math.sin(rad);
    return multiply(m, [
        c, -s, 0,
        s, c, 0,
        0, 0, 1
    ])
}

export function identity()
{
    return [
        1, 0, 0,
        0, 1, 0,
        0, 0, 1
    ]
}

export function multiply(m1, m2)
{
    return [
        m1[0*3 + 0] * m2[0*3 + 0] + m1[1*3 + 0] * m2[0*3 + 1] + m1[2*3 + 0] * m2[0*3 + 2],
        m1[0*3 + 1] * m2[0*3 + 0] + m1[1*3 + 1] * m2[0*3 + 1] + m1[2*3 + 1] * m2[0*3 + 2],
        m1[0*3 + 2] * m2[0*3 + 0] + m1[1*3 + 2] * m2[0*3 + 1] + m1[2*3 + 2] * m2[0*3 + 2],

        m1[0*3 + 0] * m2[1*3 + 0] + m1[1*3 + 0] * m2[1*3 + 1] + m1[2*3 + 0] * m2[1*3 + 2],
        m1[0*3 + 1] * m2[1*3 + 0] + m1[1*3 + 1] * m2[1*3 + 1] + m1[2*3 + 1] * m2[1*3 + 2],
        m1[0*3 + 2] * m2[1*3 + 0] + m1[1*3 + 2] * m2[1*3 + 1] + m1[2*3 + 2] * m2[1*3 + 2],

        m1[0*3 + 0] * m2[2*3 + 0] + m1[1*3 + 0] * m2[2*3 + 1] + m1[2*3 + 0] * m2[2*3 + 2],
        m1[0*3 + 1] * m2[2*3 + 0] + m1[1*3 + 1] * m2[2*3 + 1] + m1[2*3 + 1] * m2[2*3 + 2],
        m1[0*3 + 2] * m2[2*3 + 0] + m1[1*3 + 2] * m2[2*3 + 1] + m1[2*3 + 2] * m2[2*3 + 2],
    ]
}