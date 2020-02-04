const ele = document.getElementById('preview');
const prev = document.getElementById('ico-preview');

if (ele && prev) ele.onkeyup = () => { prev.className = `year ${ele.value}`; };
