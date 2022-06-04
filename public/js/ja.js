for (let row = 0; row < 17; row++)
{
    for (let col = 0; col < 17; col++)
    {
        let d = document.createElement('div')
        d.innerHTML = "&nbsp"
        if (row % 2 || (col % 2))
            d.className = "gutter";
        else
            d.className = "tile";
        d.setAttribute('row', row);
        d.setAttribute('col', col);
        document.getElementById('board').appendChild(d);
    }
}

document.addEventListener('click', (e) => {
    if (e.target.className != "fence")
        console.log(e.target);
})

let fences = [[1, 0], [1, 1], [1,2]];

fences.forEach( f => {
    let el =  document.querySelector(`[row="${f[0]}"][col="${f[1]}"]`);
    el.className = "fence";
})



let selectedElements = [];

document.addEventListener('mouseover', (e) => {
    selectedElements.forEach( (el) =>
    {
        el.style.opacity = '0';
    })
    selectedElements.length = 0;

    if (e.target.className == 'gutter')
    {
        let row = parseInt(e.target.getAttribute('row'));
        let col = parseInt(e.target.getAttribute('col'));
        let augRow = 0;
        let augCol = 0;
        if (row % 2 && !(col % 2) && col <= 14)
        {
            augCol = 1;
        }
        else if (!(row % 2) && col % 2 && row >= 2)
        {
            augRow = 1;
        }
        if (augRow || augCol)
        {
            for (let i = 0; i < 3; i++)
            {
                let el =  document.querySelector(`[row="${row - augRow * i}"][col="${col + augCol * i}"]`);
                if (el && el.className != "fence")
                {
                    el.style.backgroundColor = 'green';
                    el.style.opacity = '1';
                    selectedElements.push(el);
                }
            }
        }
    }
})
