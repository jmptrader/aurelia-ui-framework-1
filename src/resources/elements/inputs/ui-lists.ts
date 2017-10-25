//
// @description :
// @author      : Adarsh Pastakia
// @copyright   : 2017
// @license     : MIT
import { autoinject, customElement, bindable, bindingMode, children, inlineView, useView, containerless, View, DOM } from 'aurelia-framework';
import { UIEvent } from "../../utils/ui-event";
import { UIUtils } from "../../utils/ui-utils";
import * as _ from "lodash";

export class BaseListInput {
  model;
  value = '';
  options = [];

  readonly = false;
  disabled = false;
  allowSearch = true;
  forceSelect = true;

  valueProperty = 'id';
  iconProperty = 'icon';
  displayProperty = 'text';

  protected inputEl;
  protected elValue;
  protected element;
  protected dropdown;

  protected tether;
  protected obMouseup;

  protected original = [];
  protected filtered = [];
  protected isDisabled = false;
  protected isTagInput = false;
  protected showDropdown = false;

  protected hilight;
  protected floating;

  bind(bindingContext: Object, overrideContext: Object) {
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
        if (getParentByClass(evt.target, 'ui-list-container') == this.dropdown) return true;
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
      if (el) el.classList.add('ui-focus');
    }
    if (evt.type === 'blur') {
      this.element.classList.remove('ui-focus');
      if (el) el.classList.remove('ui-focus');
      if (!this.dropdown.isOpen) this.scrollIntoView();
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

  valueChanged(newValue, oldValue?) {
    if (!this.isTagInput) {
      let item = _['findChildren'](this.filtered = this.original, 'items', 'value', newValue === null ? '' : newValue);
      this.elValue = item.text;
      if (!this.forceSelect && !this.elValue) this.elValue = newValue === null ? '' : newValue;
      else if (!this.elValue) this.value = '';

      if (!oldValue && item.model) UIEvent.fireEvent('select', this.element, this.model = item.model);
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
    if (h !== null) h.classList.remove('ui-hilight');
    evt.target.classList.add('ui-hilight');
  }
  unhilightItem(evt) {
    let h = this.dropdown.querySelector('.ui-list-item.ui-hilight');
    if (h !== null) h.classList.remove('ui-hilight');
  }

  scrollIntoView() {
    let h = this.dropdown.querySelector('.ui-list-item.ui-hilight') || this.dropdown.querySelector('.ui-list-item.ui-selected');

    if (h !== null) {
      //if not already in view
      if (h.offsetTop < this.dropdown.scrollTop || h.offsetTop - this.dropdown.scrollTop > this.dropdown.clientHeight - 10)
        this.dropdown.scrollTop = h.offsetTop - (this.dropdown.offsetHeight / 2);
    }
    else {
      this.dropdown.scrollTop = 0;
    }
  }

  openDropdown() {
    if (this.readonly || this.disabled) return true;
    this.dropdown.isOpen = true;
    this.dropdown.classList.add('ui-open');
    if (this.floating) this.tether.position();
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
    if (evt.ctrlKey || evt.altKey || evt.metaKey || (evt.keyCode || evt.which) === 0) return true;
    if (this.readonly || this.disabled) return true;
    let code = (evt.keyCode || evt.which);

    // OnEnterPress if dropdown open, select current highlighted item
    if (code == 13 && this.dropdown.isOpen) {
      if (this.hilight) this.hilight.click();
      if (!this.hilight && this.forceSelect) this.elValue = _['findChildren'](this.filtered = this.original, 'items', 'value', this.value).text;
      // if (!this.hilight && !this.forceSelect) this.fireChange();
      this.closeDropdown();
      return false;
    }
    // OnEnterPress if dropdown closed, fire enterpressed
    else if (code == 13 && !this.dropdown.isOpen) {
      return UIEvent.fireEvent('enterpressed', this.element, this);
    }
    // if backspace when blank remove last tag item
    if (code == 8 && this.elValue == '') {
      return this.removeValue(null);
    }
    if (code === 9) {
      if (!this.isTagInput) {
        this.elValue = _['findChildren'](this.filtered = this.original, 'items', 'value', this.value).text;
        if (!this.forceSelect && !this.elValue) this.elValue = this.value;
      } else {
        this.elValue = '';
      }
      this.closeDropdown();
      return true;
    }
    if (this.filtered.length == 0) return true;

    if (!this.dropdown.isOpen) {
      this.openDropdown();
    }

    if (!this.hilight) this.hilight = this.dropdown.querySelector('.ui-selected');

    if (code === 38) {
      if (!this.hilight) this.hilight = this.dropdown.querySelector('.ui-list-item:last-child');
      if (this.hilight) {
        this.hilight.classList.remove('ui-hilight');
        let prev = this.hilight.previousElementSibling;
        while (prev != null && (prev.classList.contains('ui-list-group') || prev.classList.contains('ui-disabled'))) prev = prev.previousElementSibling;
        this.hilight = prev || this.hilight;
      }

      UIEvent.queueTask(() => {
        this.hilight.classList.add('ui-hilight');
        this.scrollIntoView();
      });
      return false;
    }
    if (code === 40) {
      if (!this.hilight) this.hilight = this.dropdown.querySelector('.ui-list-item');
      if (this.hilight) {
        this.hilight.classList.remove('ui-hilight');
        let next = this.hilight.nextElementSibling;
        while (next != null && (next.classList.contains('ui-list-group') || next.classList.contains('ui-disabled'))) next = next.nextElementSibling;
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
    if (this.hilight != null) this.hilight.classList.remove('hilight');
    this.hilight = null;
    this.dropdown.scrollTop = 0;

    //TODO: Add event/callback attribute to enable remote option filter

    let groups = [];
    let rx = new RegExp(getAscii(this.elValue), 'i');
    _.forEach(_.cloneDeep(this.original), (v, k) => {
      let list = _.filter(v.items, (n: any) => {
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
      if (list.length !== 0) groups.push({ label: v.label, items: list });
    });
    if (!this.forceSelect && !this.isTagInput) this.value = this.elValue;
    UIEvent.queueTask(() => this.filtered = groups);;
  }

  fireSelect(model?) {
    this.filtered = this.original;
    this.unhilightItem(null);
    this.inputEl.focus();
  }

  fireChange() { }
  addValue(val) { }
  removeValue(val) { }
}

@autoinject()
@inlineView(`<template class="ui-input-wrapper ui-input-list"><div role="input" class="ui-input-control"><slot></slot>
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
</template>`)
@customElement('ui-combo')
export class UICombo extends BaseListInput {
  constructor(public element: Element) {
    super();
    this.clear = element.hasAttribute('clear');
  }

  // aurelia hooks
  // created(owningView: View, myView: View) { }
  bind(bindingContext: Object, overrideContext: Object) {
    super.bind(bindingContext, overrideContext);
  }
  attached() {
    super.attached();
  }
  detached() {
    super.detached();
  }
  // unbind() { }
  // end aurelia hooks

  @bindable({ defaultBindingMode: bindingMode.twoWay }) value = '';
  @bindable({ defaultBindingMode: bindingMode.twoWay }) model;

  @bindable() errors = null;
  @bindable() disabled = false;
  @bindable() readonly = false;
  @bindable() info = '';
  @bindable() placeholder = '';
  @bindable() emptyText = 'No Results';

  @bindable() options;
  @bindable() iconClass = '';
  @bindable() valueProperty = 'value';
  @bindable() displayProperty = 'text';
  @bindable() iconProperty = 'icon';
  @bindable() forceSelect = true;

  private clear = false;

  fireSelect(model?) {
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
}


@autoinject()
@inlineView(`<template class="ui-input-wrapper ui-input-list tags"><div role="input" class="ui-input-control"><slot></slot>
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
</template>`)
@customElement('ui-tags')
export class UITags extends BaseListInput {
  constructor(public element: Element) {
    super();
    this.isTagInput = true;
    this.clear = element.hasAttribute('clear');
  }

  // aurelia hooks
  // created(owningView: View, myView: View) { }
  bind(bindingContext: Object, overrideContext: Object) {
    super.bind(bindingContext, overrideContext);
  }
  attached() {
    super.attached();
  }
  detached() {
    super.detached();
  }
  // unbind() { }
  // end aurelia hooks

  @bindable({ defaultBindingMode: bindingMode.twoWay }) value = '';

  @bindable() errors = null;
  @bindable() disabled = false;
  @bindable() readonly = false;
  @bindable() info = '';
  @bindable() placeholder = '';
  @bindable() emptyText = 'No Results';

  @bindable() options;
  @bindable() iconClass = '';
  @bindable() valueProperty = 'value';
  @bindable() displayProperty = 'text';
  @bindable() iconProperty = 'icon';
  @bindable() forceSelect = true;

  private clear = false;

  getDisplay(tag) {
    return _['findChildren'](this.original, 'items', 'value', tag).text || tag;
  }

  addValue(val) {
    if (!val) return;
    let v = [];
    if (this.value) v = this.value.split(',');
    if (v.indexOf(val) == -1) {
      v.push(val);
      _['findChildren'](this.filtered = this.original, 'items', 'value', val).disabled = true;
    }
    this.value = v.join(',');
    this.elValue = '';
    let h = this.dropdown.querySelector('.ui-list-item.ui-hilight');
    if (h) h.classList.remove('ui-hilight');
    UIEvent.queueTask(() => this.tether.position());
  }

  removeValue(val) {
    let v = [];
    if (this.value) v = this.value.split(',');
    if (!val) _['findChildren'](this.filtered = this.original, 'items', 'value', v.pop()).disabled = false;
    else {
      _['findChildren'](this.filtered = this.original, 'items', 'value', val).disabled = false;
      if (v.indexOf(val) != -1) v.splice(v.indexOf(val), 1);
    }
    this.value = v.join(',');
    this.elValue = '';
    UIEvent.queueTask(() => this.tether.position());
  }

  fireSelect(model?) {
    super.fireSelect(model);
    let val = model ? (model[this.valueProperty] == null ? model : model[this.valueProperty]) : '';
    this.addValue(this.forceSelect ? val : (val || this.elValue));
    UIEvent.fireEvent('change', this.element, this.value);
  }

  fireChange() {
    this.addValue(this.elValue);
    UIEvent.fireEvent('change', this.element, this.value);
  }
}

@autoinject()
@inlineView(`<template class="ui-input-wrapper"><div role="input" class="ui-input-control ui-input-list listbox">
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
</template>`)
@customElement('ui-list')
export class UIList extends BaseListInput {
  constructor(public element: Element) {
    super();
    this.clear = element.hasAttribute('clear');
    if (this.element.hasAttribute('fill')) this.element.classList.add('ui-fill');
  }

  // aurelia hooks
  // created(owningView: View, myView: View) { }
  bind(bindingContext: Object, overrideContext: Object) {
    super.bind(bindingContext, overrideContext);
  }
  attached() {
    super.attached();
  }
  detached() {
    super.detached();
  }
  // unbind() { }
  // end aurelia hooks

  @bindable({ defaultBindingMode: bindingMode.twoWay }) value = '';
  @bindable({ defaultBindingMode: bindingMode.twoWay }) model;

  @bindable() errors = null;
  @bindable() disabled = false;
  @bindable() readonly = false;
  @bindable() info = '';
  @bindable() placeholder = '';
  @bindable() emptyText = 'No Results';

  @bindable() options;
  @bindable() iconClass = '';
  @bindable() valueProperty = 'value';
  @bindable() displayProperty = 'text';
  @bindable() iconProperty = 'icon';
  @bindable() forceSelect = true;

  private clear = false;

  fireSelect(model?) {
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
}

@autoinject()
@inlineView(`<template class="ui-input-wrapper"><div class="ui-input-control ui-input-list reorder">
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
</template>`)
@customElement('ui-reorder')
export class UIReorder {
  constructor(public element: Element) {
    if (this.element.hasAttribute('fill')) this.element.classList.add('ui-fill');
  }

  // aurelia hooks
  // created(owningView: View, myView: View) { }
  // bind(bindingContext: Object, overrideContext: Object) { }
  // attached() { }
  // detached() { }
  // unbind() { }
  // end aurelia hooks

  @bindable({ defaultBindingMode: bindingMode.twoWay }) options: Array<any> = [];
  @bindable() displayProperty: any = 'name';

  private startY = 0;
  private ghostModel;
  private ghostEl;
  private dragEl;
  private dropdown;
  private diff = 0
  private top = 0;

  private move;
  private stop;

  startDrag(opt, $event) {
    if ($event.button != 0) return;
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
      if (next) this.dropdown.insertBefore(next, this.dragEl);
    }
    if (this.top + this.dragEl.offsetHeight <= this.dragEl.offsetTop) {
      let prev = this.dragEl.previousSibling;
      if (prev) this.dropdown.insertBefore(this.dragEl, prev);
    }

  }
  stopDrag($event) {
    this.dragEl.classList.remove('dragging');
    this.ghostModel = null;

    let list = this.element.querySelectorAll('.ui-list-item');
    let newList = [];
    _.forEach(list, (l: any) => {
      if (l.model) newList.push(l.model);
    });
    this.options = newList;

    document.removeEventListener('mousemove', this.move);
    document.removeEventListener('mouseup', this.stop);
  }
}
