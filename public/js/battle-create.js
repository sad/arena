const defaultRules = 2; const maxRules = 7;
const setAttributes = (el, options) => {
  Object.keys(options).forEach((attr) => {
    el.setAttribute(attr, options[attr]);
  });
};
const createRulesetInput = (id) => {
  if (id < 0) return;
  const rulesetElement = document.querySelector('#ruleset');
  const inputElement = document.createElement('input');
  setAttributes(inputElement, {
    type: 'text',
    placeholder: `rule ${id + 1}`,
    name: 'ruleset',
    id: `rule_${id}`,
    style: 'display: block',
    required: true,
  });


  return rulesetElement.appendChild(inputElement);
};
const removeRulesetInput = (id) => {
  if (id < 0) return;
  const element = document.querySelector(`#rule_${id}`);
  return element.parentNode.removeChild(element);
};

let numRules = 0;
for (let i = 0; i < defaultRules; i += 1) createRulesetInput(numRules += 1);

document.querySelector('#rule-add').parentElement.onclick = () => {
  if (numRules < maxRules) createRulesetInput(numRules += 1);
};

document.querySelector('#rule-remove').parentElement.onclick = () => {
  if (numRules > 1) removeRulesetInput(--numRules);
};

document.querySelector('form').onsubmit = () => {
  document.querySelector('#startTime_epoch').value = +new Date(document.querySelector("input[name='startTime']").value);
  document.querySelector('#endTime_epoch').value = +new Date(document.querySelector("input[name='endTime']").value);
  return true;
};
