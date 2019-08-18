let ele = document.getElementById('preview'),
    prev = document.getElementById('ico-preview');

if(ele && prev) ele.onkeyup = () => { prev.className = `year ${ele.value}`; }