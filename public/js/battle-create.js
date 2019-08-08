Element.prototype.remove = function () {
    this.parentElement.removeChild(this);
}

const defaultRules = 2,
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
            name: `ruleset[${id}]`,
            id: `rule_${id}`,
            style: 'display: block',
            required: true
        })


        return rulesetElement.appendChild(inputElement);

    },
    removeRulesetInput = function (id) {
        if (id < 0) return;
        return document.querySelector("#rule_" + id).remove();
    }

let numRules = 0;
for (let i = 0; i < defaultRules; i++) createRulesetInput(numRules++);
document.querySelector("#rule-add").parentElement.onclick = () => {
    createRulesetInput(numRules++);
}
document.querySelector("#rule-remove").parentElement.onclick = () => {
    removeRulesetInput(--numRules);
}