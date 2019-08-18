const defaultRules = 2, maxRules = 7,
    setAttributes = (el, options) => {

        Object.keys(options).forEach(function (attr) {
            el.setAttribute(attr, options[attr]);
        })

    },
    createRulesetInput = function (id) {
        if (id < 0) return;
        let rulesetElement = document.querySelector("#ruleset");
        let inputElement = document.createElement("input");
        setAttributes(inputElement, {
            type: 'text',
            placeholder: `rule ${id + 1}`,
            name: `ruleset`,
            id: `rule_${id}`,
            style: 'display: block',
            required: true
        })


        return rulesetElement.appendChild(inputElement);
    },
    removeRulesetInput = function (id) {
        if (id < 0) return;
        let element = document.querySelector("#rule_" + id);
        return element.parentNode.removeChild(element);
    }

let numRules = 0;
for (let i = 0; i < defaultRules; i++) createRulesetInput(numRules++);

document.querySelector("#rule-add").parentElement.onclick = function () {
    if(numRules < maxRules) createRulesetInput(numRules++);
}

document.querySelector("#rule-remove").parentElement.onclick = function () {
    if(numRules > 1) removeRulesetInput(--numRules);
}

document.querySelector("form").onsubmit = () => {
    document.querySelector("#startTime_epoch").value = +new Date(document.querySelector("input[name='startTime']").value);
    document.querySelector("#endTime_epoch").value = +new Date(document.querySelector("input[name='endTime']").value);
    return true;
};