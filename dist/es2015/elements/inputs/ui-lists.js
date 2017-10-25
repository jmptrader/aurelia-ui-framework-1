var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { autoinject, customElement, bindable, bindingMode, inlineView } from 'aurelia-framework';
import { UIEvent } from "../../utils/ui-event";
import { UIUtils } from "../../utils/ui-utils";
import * as _ from "lodash";
export class BaseListInput {
    constructor() {
        this.value = '';
        this.options = [];
        this.readonly = false;
        this.disabled = false;
        this.allowSearch = true;
        this.forceSelect = true;
        this.valueProperty = 'id';
        this.iconProperty = 'icon';
        this.displayProperty = 'text';
        this.original = [];
        this.filtered = [];
        this.isDisabled = false;
        this.isTagInput = false;
        this.showDropdown = false;
    }
    bind(bindingContext, overrideContext) {
        this.readonlyChanged(this.readonly);
        this.disabledChanged(this.disabled);
        this.forceSelect = isTrue(this.forceSelect);
        this.optionsChanged(this.options);
        this.valueChanged(this.value);
    }
    attached() {
        this.floating = this.dropdown.classList.contains('ui-floating');
        if (this.floating) {
            this.tether = UIUtils.tether(this.element, this.dropdown);
            this.obMouseup = UIEvent.subscribe('mouseclick', (evt) => {
                if (getParentByClass(evt.target, 'ui-list-container') == this.dropdown)
                    return true;
                this.closeDropdown();
            });
        }
        UIEvent.queueTask(() => this.valueChanged(this.value, true));
    }
    detached() {
        if (this.floating) {
            this.tether.dispose();
            this.obMouseup.dispose();
        }
    }
    disabledChanged(newValue) {
        this.element.classList[(this.isDisabled = this.disabled = isTrue(newValue)) ? 'add' : 'remove']('ui-disabled');
    }
    readonlyChanged(newValue) {
        this.element.classList[(this.readonly = isTrue(newValue)) ? 'add' : 'remove']('ui-readonly');
    }
    disable(b) {
        this.element.classList[(this.isDisabled = (b || this.disabled)) ? 'add' : 'remove']('ui-disabled');
    }
    clearInput() {
        this.value = '';
        this.inputEl.focus();
    }
    focus() {
        this.inputEl.focus();
    }
    fireEvent(evt) {
        evt.stopPropagation();
        let el = getParentByClass(this.element, 'ui-input-group');
        if (evt.type === 'focus') {
            this.inputEl.select();
            this.element.classList.add('ui-focus');
            if (el)
                el.classList.add('ui-focus');
        }
        if (evt.type === 'blur') {
            this.element.classList.remove('ui-focus');
            if (el)
                el.classList.remove('ui-focus');
            if (!this.dropdown.isOpen)
                this.scrollIntoView();
        }
        UIEvent.fireEvent(evt.type, this.element, this.value);
    }
    optionsChanged(newValue) {
        let groups = [];
        if (_.isArray(newValue)) {
            let list = [];
            _.forEach(newValue, v => list.push({
                value: v[this.valueProperty] == null ? v : v[this.valueProperty],
                text: v[this.displayProperty] == null ? v : v[this.displayProperty],
                display: v[this.displayProperty] == null ? v : v[this.displayProperty],
                icon: v[this.iconProperty], model: v
            }));
            groups.push({ items: list });
            this.allowSearch = !this.forceSelect || list.length > 10;
        }
        else {
            let count = 0;
            _.forEach(newValue, (g, k) => {
                let list = [];
                _.forEach(g, v => list.push({
                    value: v[this.valueProperty] == null ? v : v[this.valueProperty],
                    text: v[this.displayProperty] == null ? v : v[this.displayProperty],
                    display: v[this.displayProperty] == null ? v : v[this.displayProperty],
                    icon: v[this.iconProperty], model: v
                }));
                groups.push({ label: k, items: list });
                count += list.length;
            });
            this.allowSearch = !this.forceSelect || count > 10;
        }
        this.original = this.filtered = groups;
    }
    valueChanged(newValue, oldValue) {
        if (!this.isTagInput) {
            let item = _['findChildren'](this.filtered = this.original, 'items', 'value', newValue === null ? '' : newValue);
            this.elValue = item.text;
            if (!this.forceSelect && !this.elValue)
                this.elValue = newValue === null ? '' : newValue;
            else if (!this.elValue)
                this.value = '';
            if (!oldValue && item.model)
                UIEvent.fireEvent('select', this.element, this.model = item.model);
        }
        else {
            let v = (newValue || '').split(',');
            _.forEach(v, n => _['findChildren'](this.filtered = this.original, 'items', 'value', n).disabled = true);
        }
        UIEvent.queueTask(() => {
            this.hilight = this.dropdown.querySelector('.ui-selected');
            this.scrollIntoView();
        });
    }
    hilightItem(evt) {
        let h = this.dropdown.querySelector('.ui-list-item.ui-hilight');
        if (h !== null)
            h.classList.remove('ui-hilight');
        evt.target.classList.add('ui-hilight');
    }
    unhilightItem(evt) {
        let h = this.dropdown.querySelector('.ui-list-item.ui-hilight');
        if (h !== null)
            h.classList.remove('ui-hilight');
    }
    scrollIntoView() {
        let h = this.dropdown.querySelector('.ui-list-item.ui-hilight') || this.dropdown.querySelector('.ui-list-item.ui-selected');
        if (h !== null) {
            if (h.offsetTop < this.dropdown.scrollTop || h.offsetTop - this.dropdown.scrollTop > this.dropdown.clientHeight - 10)
                this.dropdown.scrollTop = h.offsetTop - (this.dropdown.offsetHeight / 2);
        }
        else {
            this.dropdown.scrollTop = 0;
        }
    }
    openDropdown() {
        if (this.readonly || this.disabled)
            return true;
        this.dropdown.isOpen = true;
        this.dropdown.classList.add('ui-open');
        if (this.floating)
            this.tether.position();
        this.scrollIntoView();
    }
    closeDropdown() {
        this.dropdown.isOpen = false;
        this.dropdown.classList.remove('ui-open');
    }
    toggleDropdown(evt, forceClose = false) {
        evt.stopPropagation();
        evt.cancelBubble = true;
        this.dropdown.isOpen ? this.closeDropdown() : this.openDropdown();
    }
    keyDown(evt) {
        if (evt.ctrlKey || evt.altKey || evt.metaKey || (evt.keyCode || evt.which) === 0)
            return true;
        if (this.readonly || this.disabled)
            return true;
        let code = (evt.keyCode || evt.which);
        if (code == 13 && this.dropdown.isOpen) {
            if (this.hilight)
                this.hilight.click();
            if (!this.hilight && this.forceSelect)
                this.elValue = _['findChildren'](this.filtered = this.original, 'items', 'value', this.value).text;
            this.closeDropdown();
            return false;
        }
        else if (code == 13 && !this.dropdown.isOpen) {
            return UIEvent.fireEvent('enterpressed', this.element, this);
        }
        if (code == 8 && this.elValue == '') {
            return this.removeValue(null);
        }
        if (code === 9) {
            if (!this.isTagInput) {
                this.elValue = _['findChildren'](this.filtered = this.original, 'items', 'value', this.value).text;
                if (!this.forceSelect && !this.elValue)
                    this.elValue = this.value;
            }
            else {
                this.elValue = '';
            }
            this.closeDropdown();
            return true;
        }
        if (this.filtered.length == 0)
            return true;
        if (!this.dropdown.isOpen) {
            this.openDropdown();
        }
        if (!this.hilight)
            this.hilight = this.dropdown.querySelector('.ui-selected');
        if (code === 38) {
            if (!this.hilight)
                this.hilight = this.dropdown.querySelector('.ui-list-item:last-child');
            if (this.hilight) {
                this.hilight.classList.remove('ui-hilight');
                let prev = this.hilight.previousElementSibling;
                while (prev != null && (prev.classList.contains('ui-list-group') || prev.classList.contains('ui-disabled')))
                    prev = prev.previousElementSibling;
                this.hilight = prev || this.hilight;
            }
            UIEvent.queueTask(() => {
                this.hilight.classList.add('ui-hilight');
                this.scrollIntoView();
            });
            return false;
        }
        if (code === 40) {
            if (!this.hilight)
                this.hilight = this.dropdown.querySelector('.ui-list-item');
            if (this.hilight) {
                this.hilight.classList.remove('ui-hilight');
                let next = this.hilight.nextElementSibling;
                while (next != null && (next.classList.contains('ui-list-group') || next.classList.contains('ui-disabled')))
                    next = next.nextElementSibling;
                this.hilight = next || this.hilight;
            }
            UIEvent.queueTask(() => {
                this.hilight.classList.add('ui-hilight');
                this.scrollIntoView();
            });
            return false;
        }
        return true;
    }
    search() {
        if (this.hilight != null)
            this.hilight.classList.remove('hilight');
        this.hilight = null;
        this.dropdown.scrollTop = 0;
        let groups = [];
        let rx = new RegExp(getAscii(this.elValue), 'i');
        _.forEach(_.cloneDeep(this.original), (v, k) => {
            let list = _.filter(v.items, (n) => {
                var lbl = n.text + '';
                let asc = getAscii(lbl);
                if (rx.test(asc)) {
                    let start = asc.search(rx);
                    lbl = lbl.substr(0, start + this.elValue.length) + '</u>' +
                        lbl.substr(start + this.elValue.length);
                    lbl = lbl.substr(0, start) + '<u>' + lbl.substr(start);
                    n.display = lbl;
                    return true;
                }
                return false;
            });
            if (list.length !== 0)
                groups.push({ label: v.label, items: list });
        });
        if (!this.forceSelect && !this.isTagInput)
            this.value = this.elValue;
        UIEvent.queueTask(() => this.filtered = groups);
        ;
    }
    fireSelect(model) {
        this.filtered = this.original;
        this.unhilightItem(null);
        this.inputEl.focus();
    }
    fireChange() { }
    addValue(val) { }
    removeValue(val) { }
}
let UICombo = class UICombo extends BaseListInput {
    constructor(element) {
        super();
        this.element = element;
        this.value = '';
        this.errors = null;
        this.disabled = false;
        this.readonly = false;
        this.info = '';
        this.placeholder = '';
        this.emptyText = 'No Results';
        this.iconClass = '';
        this.valueProperty = 'value';
        this.displayProperty = 'text';
        this.iconProperty = 'icon';
        this.forceSelect = true;
        this.clear = false;
        this.clear = element.hasAttribute('clear');
    }
    bind(bindingContext, overrideContext) {
        super.bind(bindingContext, overrideContext);
    }
    attached() {
        super.attached();
    }
    detached() {
        super.detached();
    }
    fireSelect(model) {
        if (model) {
            this.value = model[this.valueProperty] == null ? model : model[this.valueProperty];
            UIEvent.fireEvent('select', this.element, model);
        }
        super.fireSelect(model);
        this.fireChange();
        this.closeDropdown();
    }
    fireChange() {
        UIEvent.fireEvent('change', this.element, this.value);
    }
};
__decorate([
    bindable({ defaultBindingMode: bindingMode.twoWay }),
    __metadata("design:type", Object)
], UICombo.prototype, "value", void 0);
__decorate([
    bindable({ defaultBindingMode: bindingMode.twoWay }),
    __metadata("design:type", Object)
], UICombo.prototype, "model", void 0);
__decorate([
    bindable(),
    __metadata("design:type", Object)
], UICombo.prototype, "errors", void 0);
__decorate([
    bindable(),
    __metadata("design:type", Object)
], UICombo.prototype, "disabled", void 0);
__decorate([
    bindable(),
    __metadata("design:type", Object)
], UICombo.prototype, "readonly", void 0);
__decorate([
    bindable(),
    __metadata("design:type", Object)
], UICombo.prototype, "info", void 0);
__decorate([
    bindable(),
    __metadata("design:type", Object)
], UICombo.prototype, "placeholder", void 0);
__decorate([
    bindable(),
    __metadata("design:type", Object)
], UICombo.prototype, "emptyText", void 0);
__decorate([
    bindable(),
    __metadata("design:type", Object)
], UICombo.prototype, "options", void 0);
__decorate([
    bindable(),
    __metadata("design:type", Object)
], UICombo.prototype, "iconClass", void 0);
__decorate([
    bindable(),
    __metadata("design:type", Object)
], UICombo.prototype, "valueProperty", void 0);
__decorate([
    bindable(),
    __metadata("design:type", Object)
], UICombo.prototype, "displayProperty", void 0);
__decorate([
    bindable(),
    __metadata("design:type", Object)
], UICombo.prototype, "iconProperty", void 0);
__decorate([
    bindable(),
    __metadata("design:type", Object)
], UICombo.prototype, "forceSelect", void 0);
UICombo = __decorate([
    autoinject(),
    inlineView(`<template class="ui-input-wrapper ui-input-list"><div role="input" class="ui-input-control"><slot></slot>
  <span class="ui-error" if.bind="errors"><ui-glyph glyph="glyph-invalid"></ui-glyph><ul class="ui-error-list"><li repeat.for="err of errors" innerhtml.bind="err"></li></ul></span>
  <input ref="inputEl" value.bind="elValue" autocomplete="off" size="1"
    focus.trigger="fireEvent($event)" blur.trigger="fireEvent($event)" click.trigger="openDropdown($event)"
    input.trigger="search() & debounce:200" change.trigger="fireEvent($event)" select.trigger="$event.stopPropagation()"
    keydown.trigger="keyDown($event)" placeholder.bind="placeholder"
    disabled.bind="isDisabled" readonly.bind="!allowSearch || readonly"/>
  <span class="ui-clear" if.bind="clear && value" click.trigger="clearInput()">&times;</span>
  <span class="ui-input-addon ui-dropdown-handle" click.trigger="openDropdown($event, inputEl.focus())"><ui-glyph glyph="glyph-chevron-down"></ui-glyph></span></div>

  <div class="ui-list-container ui-floating" ref="dropdown">
    <div if.bind="filtered.length==0" class="ui-list-group">\${emptyText}</div>
    <template repeat.for="group of filtered"><div if.bind="group.label" class="ui-list-group">\${group.label}</div>
    <div class="ui-list-item \${item.value==value?'ui-selected':''} \${item.disabled?'ui-disabled':''}" repeat.for="item of group.items"
      mouseover.trigger="hilightItem($event)" click.trigger="fireSelect(item.model)">
      <span class="\${iconClass} \${item.icon}" if.bind="item.icon"></span>&nbsp;<span innerhtml.bind="item.display"></span></div>
    </template>
  </div>
  <div class="ui-input-info" if.bind="info" innerhtml.bind="info"></div>
</template>`),
    customElement('ui-combo'),
    __metadata("design:paramtypes", [Element])
], UICombo);
export { UICombo };
let UITags = class UITags extends BaseListInput {
    constructor(element) {
        super();
        this.element = element;
        this.value = '';
        this.errors = null;
        this.disabled = false;
        this.readonly = false;
        this.info = '';
        this.placeholder = '';
        this.emptyText = 'No Results';
        this.iconClass = '';
        this.valueProperty = 'value';
        this.displayProperty = 'text';
        this.iconProperty = 'icon';
        this.forceSelect = true;
        this.clear = false;
        this.isTagInput = true;
        this.clear = element.hasAttribute('clear');
    }
    bind(bindingContext, overrideContext) {
        super.bind(bindingContext, overrideContext);
    }
    attached() {
        super.attached();
    }
    detached() {
        super.detached();
    }
    getDisplay(tag) {
        return _['findChildren'](this.original, 'items', 'value', tag).text || tag;
    }
    addValue(val) {
        if (!val)
            return;
        let v = [];
        if (this.value)
            v = this.value.split(',');
        if (v.indexOf(val) == -1) {
            v.push(val);
            _['findChildren'](this.filtered = this.original, 'items', 'value', val).disabled = true;
        }
        this.value = v.join(',');
        this.elValue = '';
        let h = this.dropdown.querySelector('.ui-list-item.ui-hilight');
        if (h)
            h.classList.remove('ui-hilight');
        UIEvent.queueTask(() => this.tether.position());
    }
    removeValue(val) {
        let v = [];
        if (this.value)
            v = this.value.split(',');
        if (!val)
            _['findChildren'](this.filtered = this.original, 'items', 'value', v.pop()).disabled = false;
        else {
            _['findChildren'](this.filtered = this.original, 'items', 'value', val).disabled = false;
            if (v.indexOf(val) != -1)
                v.splice(v.indexOf(val), 1);
        }
        this.value = v.join(',');
        this.elValue = '';
        UIEvent.queueTask(() => this.tether.position());
    }
    fireSelect(model) {
        super.fireSelect(model);
        let val = model ? (model[this.valueProperty] == null ? model : model[this.valueProperty]) : '';
        this.addValue(this.forceSelect ? val : (val || this.elValue));
        UIEvent.fireEvent('change', this.element, this.value);
    }
    fireChange() {
        this.addValue(this.elValue);
        UIEvent.fireEvent('change', this.element, this.value);
    }
};
__decorate([
    bindable({ defaultBindingMode: bindingMode.twoWay }),
    __metadata("design:type", Object)
], UITags.prototype, "value", void 0);
__decorate([
    bindable(),
    __metadata("design:type", Object)
], UITags.prototype, "errors", void 0);
__decorate([
    bindable(),
    __metadata("design:type", Object)
], UITags.prototype, "disabled", void 0);
__decorate([
    bindable(),
    __metadata("design:type", Object)
], UITags.prototype, "readonly", void 0);
__decorate([
    bindable(),
    __metadata("design:type", Object)
], UITags.prototype, "info", void 0);
__decorate([
    bindable(),
    __metadata("design:type", Object)
], UITags.prototype, "placeholder", void 0);
__decorate([
    bindable(),
    __metadata("design:type", Object)
], UITags.prototype, "emptyText", void 0);
__decorate([
    bindable(),
    __metadata("design:type", Object)
], UITags.prototype, "options", void 0);
__decorate([
    bindable(),
    __metadata("design:type", Object)
], UITags.prototype, "iconClass", void 0);
__decorate([
    bindable(),
    __metadata("design:type", Object)
], UITags.prototype, "valueProperty", void 0);
__decorate([
    bindable(),
    __metadata("design:type", Object)
], UITags.prototype, "displayProperty", void 0);
__decorate([
    bindable(),
    __metadata("design:type", Object)
], UITags.prototype, "iconProperty", void 0);
__decorate([
    bindable(),
    __metadata("design:type", Object)
], UITags.prototype, "forceSelect", void 0);
UITags = __decorate([
    autoinject(),
    inlineView(`<template class="ui-input-wrapper ui-input-list tags"><div role="input" class="ui-input-control"><slot></slot>
  <span class="ui-error" if.bind="errors"><ui-glyph glyph="glyph-invalid"></ui-glyph><ul class="ui-error-list"><li repeat.for="err of errors" innerhtml.bind="err"></li></ul></span>
  <div class="ui-tag-item" repeat.for="tag of value | split" if.bind="tag!=''"><span innerhtml.bind="getDisplay(tag)"></span><i class="ui-clear" click.trigger="removeValue(tag)">&times;</i></div>
  <input ref="inputEl" value.bind="elValue" autocomplete="off" size="1"
    focus.trigger="fireEvent($event)" blur.trigger="fireEvent($event)" select.trigger="$event.stopPropagation()"
    input.trigger="search() & debounce:200" change.trigger="fireEvent($event)"
    keydown.trigger="keyDown($event)" placeholder.bind="placeholder"
    disabled.bind="isDisabled" readonly.bind="!allowSearch || readonly"/></div>
  <div class="ui-input-info" if.bind="info" innerhtml.bind="info"></div>

  <div class="ui-list-container ui-floating" ref="dropdown">
    <div if.bind="filtered.length==0" class="ui-list-group">\${emptyText}</div>
    <template repeat.for="group of filtered"><div if.bind="group.label" class="ui-list-group">\${group.label}</div>
    <div class="ui-list-item \${item.disabled?'ui-disabled':''}" repeat.for="item of group.items"
      mouseover.trigger="hilightItem($event)" click.trigger="fireSelect(item.model)">
      <span class="\${iconClass} \${item.icon}" if.bind="item.icon"></span>&nbsp;<span innerhtml.bind="item.display"></span></div>
    </template>
  </div>
</template>`),
    customElement('ui-tags'),
    __metadata("design:paramtypes", [Element])
], UITags);
export { UITags };
let UIList = class UIList extends BaseListInput {
    constructor(element) {
        super();
        this.element = element;
        this.value = '';
        this.errors = null;
        this.disabled = false;
        this.readonly = false;
        this.info = '';
        this.placeholder = '';
        this.emptyText = 'No Results';
        this.iconClass = '';
        this.valueProperty = 'value';
        this.displayProperty = 'text';
        this.iconProperty = 'icon';
        this.forceSelect = true;
        this.clear = false;
        this.clear = element.hasAttribute('clear');
        if (this.element.hasAttribute('fill'))
            this.element.classList.add('ui-fill');
    }
    bind(bindingContext, overrideContext) {
        super.bind(bindingContext, overrideContext);
    }
    attached() {
        super.attached();
    }
    detached() {
        super.detached();
    }
    fireSelect(model) {
        super.fireSelect(model);
        if (model) {
            this.value = model[this.valueProperty] == null ? model : model[this.valueProperty];
            UIEvent.fireEvent('select', this.element, model);
        }
        this.fireChange();
        this.closeDropdown();
    }
    fireChange() {
        UIEvent.fireEvent('change', this.element, this.value);
    }
};
__decorate([
    bindable({ defaultBindingMode: bindingMode.twoWay }),
    __metadata("design:type", Object)
], UIList.prototype, "value", void 0);
__decorate([
    bindable({ defaultBindingMode: bindingMode.twoWay }),
    __metadata("design:type", Object)
], UIList.prototype, "model", void 0);
__decorate([
    bindable(),
    __metadata("design:type", Object)
], UIList.prototype, "errors", void 0);
__decorate([
    bindable(),
    __metadata("design:type", Object)
], UIList.prototype, "disabled", void 0);
__decorate([
    bindable(),
    __metadata("design:type", Object)
], UIList.prototype, "readonly", void 0);
__decorate([
    bindable(),
    __metadata("design:type", Object)
], UIList.prototype, "info", void 0);
__decorate([
    bindable(),
    __metadata("design:type", Object)
], UIList.prototype, "placeholder", void 0);
__decorate([
    bindable(),
    __metadata("design:type", Object)
], UIList.prototype, "emptyText", void 0);
__decorate([
    bindable(),
    __metadata("design:type", Object)
], UIList.prototype, "options", void 0);
__decorate([
    bindable(),
    __metadata("design:type", Object)
], UIList.prototype, "iconClass", void 0);
__decorate([
    bindable(),
    __metadata("design:type", Object)
], UIList.prototype, "valueProperty", void 0);
__decorate([
    bindable(),
    __metadata("design:type", Object)
], UIList.prototype, "displayProperty", void 0);
__decorate([
    bindable(),
    __metadata("design:type", Object)
], UIList.prototype, "iconProperty", void 0);
__decorate([
    bindable(),
    __metadata("design:type", Object)
], UIList.prototype, "forceSelect", void 0);
UIList = __decorate([
    autoinject(),
    inlineView(`<template class="ui-input-wrapper"><div role="input" class="ui-input-control ui-input-list listbox">
  <span class="ui-error" if.bind="errors"><ui-glyph glyph="glyph-invalid"></ui-glyph><ul class="ui-error-list"><li repeat.for="err of errors" innerhtml.bind="err"></li></ul></span>
  <input ref="inputEl" value.bind="elValue" class="ui-input ui-remove" autocomplete="off"
    focus.trigger="fireEvent($event)" blur.trigger="fireEvent($event)" size="1"
    input.trigger="search() & debounce:200" change.trigger="fireEvent($event)"
    keydown.trigger="keyDown($event)" placeholder.bind="placeholder" select.trigger="$event.stopPropagation()"
    disabled.bind="isDisabled" readonly.bind="true"/>
  <span class="ui-clear" if.bind="clear && value" click.trigger="clearInput()">&times;</span>

  <div class="ui-list-container" ref="dropdown" mouseout.trigger="unhilightItem()">
    <div if.bind="filtered.length==0" class="ui-list-group">\${emptyText}</div>
    <template repeat.for="group of filtered"><div if.bind="group.label" class="ui-list-group">\${group.label}</div>
    <div class="ui-list-item \${item.value==value?'ui-selected':''} \${item.disabled?'ui-disabled':''}" repeat.for="item of group.items"
      mouseover.trigger="hilightItem($event)" click.trigger="fireSelect(item.model)">
      <span class="\${iconClass} \${item.icon}" if.bind="item.icon"></span>&nbsp;<span innerhtml.bind="item.display"></span></div>
    </template>
  </div></div>
  <div class="ui-input-info" if.bind="info" innerhtml.bind="info"></div>
</template>`),
    customElement('ui-list'),
    __metadata("design:paramtypes", [Element])
], UIList);
export { UIList };
let UIReorder = class UIReorder {
    constructor(element) {
        this.element = element;
        this.options = [];
        this.displayProperty = 'name';
        this.startY = 0;
        this.diff = 0;
        this.top = 0;
        if (this.element.hasAttribute('fill'))
            this.element.classList.add('ui-fill');
    }
    startDrag(opt, $event) {
        if ($event.button != 0)
            return;
        this.ghostModel = opt;
        this.dragEl = getParentByClass($event.target, 'ui-list-item');
        this.top = this.diff = this.dragEl.offsetTop;
        this.dragEl.classList.add('dragging');
        this.startY = ($event.y || $event.clientY);
        document.addEventListener('mousemove', this.move = e => this.doDrag(e));
        document.addEventListener('mouseup', this.stop = e => this.stopDrag(e));
    }
    doDrag($event) {
        var y = ($event.y || $event.clientY) - this.startY;
        this.startY = ($event.y || $event.clientY);
        this.diff += y;
        let oh = this.dropdown.offsetHeight;
        let st = this.dropdown.scrollTop;
        let sh = this.dropdown.scrollHeight;
        this.top = this.diff < 0 ? 0 : (this.diff >= sh - this.dragEl.offsetHeight ? sh : this.diff);
        this.dropdown.scrollTop = this.top > st + oh ? st + this.dragEl.offsetHeight : (this.top < st ? st - this.dragEl.offsetHeight : st);
        if (this.top >= this.dragEl.offsetTop + this.dragEl.offsetHeight) {
            let next = this.dragEl.nextSibling;
            if (next)
                this.dropdown.insertBefore(next, this.dragEl);
        }
        if (this.top + this.dragEl.offsetHeight <= this.dragEl.offsetTop) {
            let prev = this.dragEl.previousSibling;
            if (prev)
                this.dropdown.insertBefore(this.dragEl, prev);
        }
    }
    stopDrag($event) {
        this.dragEl.classList.remove('dragging');
        this.ghostModel = null;
        let list = this.element.querySelectorAll('.ui-list-item');
        let newList = [];
        _.forEach(list, (l) => {
            if (l.model)
                newList.push(l.model);
        });
        this.options = newList;
        document.removeEventListener('mousemove', this.move);
        document.removeEventListener('mouseup', this.stop);
    }
};
__decorate([
    bindable({ defaultBindingMode: bindingMode.twoWay }),
    __metadata("design:type", Array)
], UIReorder.prototype, "options", void 0);
__decorate([
    bindable(),
    __metadata("design:type", Object)
], UIReorder.prototype, "displayProperty", void 0);
UIReorder = __decorate([
    autoinject(),
    inlineView(`<template class="ui-input-wrapper"><div class="ui-input-control ui-input-list reorder">
    <div class="ui-list-container" ref="dropdown">
        <div model.bind="opt" repeat.for="opt of options & oneTime" class="ui-list-item" data-value="\${$index}" mousedown.trigger="startDrag(opt, $event)">
            <ui-glyph glyph="glyph-handle-drag"></ui-glyph>
            <span class="ui-col-fill" innerhtml.bind="opt[displayProperty] || opt"></span>
        </div>

        <div class="ui-list-item ui-ghost" if.bind="ghostModel" ref="ghostEl" css.bind="{top:top+'px'}">
            <ui-glyph glyph="glyph-handle-drag"></ui-glyph>
            <span class="ui-col-fill" innerhtml.bind="ghostModel[displayProperty] || ghostModel"></span>
        </div>
    </div></div>
</template>`),
    customElement('ui-reorder'),
    __metadata("design:paramtypes", [Element])
], UIReorder);
export { UIReorder };
