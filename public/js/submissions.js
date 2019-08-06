let rules = document.getElementById('sub-rules'),
    samples = document.getElementById('sub-samples'),
    ruleAdd = document.getElementById('ra'),
    sampleAdd = document.getElementById('sa'),
    submitButton = document.getElementById('sub-submit'),
    icoLinks = document.getElementById('trash'),
    samplesAmount = 0, rulesAmount = 0;

ruleAdd.onclick = () => {
    createInput('new rule', rules, 'rules');
}

sampleAdd.onclick = () => {
    createInput('url to sample', samples, 'samples');
}

let createInput = (placeholder, parent, type) => {
    let newInput = document.createElement('input'),
        newArticle = document.createElement('article'),
        newIcoLink = document.createElement('a');
        newIco = document.createElement('i');

    if(type == 'samples') {
        samplesAmount++;
        newInput.name = `${type}-${samplesAmount}`;
    } else if(type == 'rules') {
        rulesAmount++;
        newInput.name = `${type}-${rulesAmount}`;
    }

    newInput.required = true;
    newInput.placeholder = placeholder;

    newIco.className = "fas fa-trash";
    newIco.id = "trash";
    newIcoLink.href = "#";

    newIcoLink.appendChild(newIco);
    newArticle.appendChild(newInput);
    newArticle.appendChild(newIcoLink);

    parent.appendChild(newArticle);

    if(samplesAmount > 0 || rulesAmount > 0) {
        submitButton.style = "display: inherit";
        if(!samples.className.includes("mb-8")) samples.className += " mb-8";
    }
}