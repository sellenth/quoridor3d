export function translate(x, y, z, m)
{
    return multiply (m, [
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        x, y, z, 1
    ]);
}

export function scale(x, y, z, m)
{
    return multiply (m, [
        x, 0, 0, 0,
        0, y, 0, 0,
        0, 0, z, 0,
        0, 0, 0, 1
    ])
}

export function rotationXY(rad, m)
{
    let c = Math.cos(rad);
    let s = Math.sin(rad);
    return multiply(m, [
        c, -s, 0, 0,
        s, c,  0, 0,
        0, 0,  1, 0,
        0, 0,  0, 1,
    ])
}

export function rotationXZ(rad, m)
{
    let c = Math.cos(rad);
    let s = Math.sin(rad);
    return multiply(m, [
        c, 0, s, 0,
        0, 1,  0, 0,
       -s, 0, c, 0,
        0, 0,  0, 1,
    ])
}

export function projection(fieldOfViewInRadians, aspect, near, far)
{
    /*
    return multiply (m, [
        2/width, 0,         0,  0,
        0,       2/height, 0,   0,
        0,       0,  2 / depth, 0,
        0,       0,          0, 1,
    ])
    */
    var f = Math.tan(Math.PI * 0.5 - 0.5 * fieldOfViewInRadians);
    var rangeInv = 1.0 / (near - far);
 
    return [
      f / aspect, 0, 0, 0,
      0, f, 0, 0,
      0, 0, (near + far) * rangeInv, -1,
      0, 0, near * far * rangeInv * 2, 0
    ];
}

export function identity()
{
    return [
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1
    ]
}

export function multiply(m1, m2)
{
    return [
        m1[0*4 + 0] * m2[0*4 + 0] + m1[1*4 + 0] * m2[0*4 + 1] + m1[2*4 + 0] * m2[0*4 + 2] + m1[3*4 + 0] * m2[0*4 + 3],
        m1[0*4 + 1] * m2[0*4 + 0] + m1[1*4 + 1] * m2[0*4 + 1] + m1[2*4 + 1] * m2[0*4 + 2] + m1[3*4 + 1] * m2[0*4 + 3],
        m1[0*4 + 2] * m2[0*4 + 0] + m1[1*4 + 2] * m2[0*4 + 1] + m1[2*4 + 2] * m2[0*4 + 2] + m1[3*4 + 2] * m2[0*4 + 3],
        m1[0*4 + 3] * m2[0*4 + 0] + m1[1*4 + 3] * m2[0*4 + 1] + m1[2*4 + 3] * m2[0*4 + 2] + m1[3*4 + 3] * m2[0*4 + 3],

        m1[0*4 + 0] * m2[1*4 + 0] + m1[1*4 + 0] * m2[1*4 + 1] + m1[2*4 + 0] * m2[1*4 + 2] + m1[3*4 + 0] * m2[1*4 + 3],
        m1[0*4 + 1] * m2[1*4 + 0] + m1[1*4 + 1] * m2[1*4 + 1] + m1[2*4 + 1] * m2[1*4 + 2] + m1[3*4 + 1] * m2[1*4 + 3],
        m1[0*4 + 2] * m2[1*4 + 0] + m1[1*4 + 2] * m2[1*4 + 1] + m1[2*4 + 2] * m2[1*4 + 2] + m1[3*4 + 2] * m2[1*4 + 3],
        m1[0*4 + 3] * m2[1*4 + 0] + m1[1*4 + 3] * m2[1*4 + 1] + m1[2*4 + 3] * m2[1*4 + 2] + m1[3*4 + 3] * m2[1*4 + 3],

        m1[0*4 + 0] * m2[2*4 + 0] + m1[1*4 + 0] * m2[2*4 + 1] + m1[2*4 + 0] * m2[2*4 + 2] + m1[3*4 + 0] * m2[2*4 + 3],
        m1[0*4 + 1] * m2[2*4 + 0] + m1[1*4 + 1] * m2[2*4 + 1] + m1[2*4 + 1] * m2[2*4 + 2] + m1[3*4 + 1] * m2[2*4 + 3],
        m1[0*4 + 2] * m2[2*4 + 0] + m1[1*4 + 2] * m2[2*4 + 1] + m1[2*4 + 2] * m2[2*4 + 2] + m1[3*4 + 2] * m2[2*4 + 3],
        m1[0*4 + 3] * m2[2*4 + 0] + m1[1*4 + 3] * m2[2*4 + 1] + m1[2*4 + 3] * m2[2*4 + 2] + m1[3*4 + 3] * m2[2*4 + 3],

        m1[0*4 + 0] * m2[3*4 + 0] + m1[1*4 + 0] * m2[3*4 + 1] + m1[2*4 + 0] * m2[3*4 + 2] + m1[3*4 + 0] * m2[3*4 + 3],
        m1[0*4 + 1] * m2[3*4 + 0] + m1[1*4 + 1] * m2[3*4 + 1] + m1[2*4 + 1] * m2[3*4 + 2] + m1[3*4 + 1] * m2[3*4 + 3],
        m1[0*4 + 2] * m2[3*4 + 0] + m1[1*4 + 2] * m2[3*4 + 1] + m1[2*4 + 2] * m2[3*4 + 2] + m1[3*4 + 2] * m2[3*4 + 3],
        m1[0*4 + 3] * m2[3*4 + 0] + m1[1*4 + 3] * m2[3*4 + 1] + m1[2*4 + 3] * m2[3*4 + 2] + m1[3*4 + 3] * m2[3*4 + 3],
    ]
}