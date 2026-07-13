/*
 * support.js — minimal standalone runtime shim for the "Garage OS" .dc.html prototype.
 *
 * The prototype was authored in a custom "Design Component" runtime (<x-dc> template +
 * `class Component extends DCLogic`). That runtime was NOT shipped in the handoff, so the
 * file cannot render on its own. This shim reimplements just enough of it — template
 * interpolation ({{ }}), <sc-if> / <sc-for>, ref / onClick / style-hover bindings, and a
 * setState-driven re-render — to view the prototype as a faithful reference while porting
 * it to the real Next.js/React app.
 *
 * This is a DESIGN PREVIEW HELPER ONLY. It is not part of the production codebase and must
 * not be reused there (the README says the same about the original runtime).
 */
(function () {
  'use strict';

  // Minimal React stand-in — the Component only uses createRef().
  window.React = window.React || { createRef: function () { return { current: null }; } };

  let inst = null;
  let templateNodes = [];
  let rootEl = null;

  class DCLogic {
    constructor(props) { this.props = props || {}; this.state = {}; }
    setState(patch, cb) {
      Object.assign(this.state, patch || {});
      render();
      if (typeof cb === 'function') cb();
    }
  }

  function stripBraces(s) {
    if (s == null) return '';
    const m = String(s).match(/\{\{([\s\S]*?)\}\}/);
    return m ? m[1].trim() : String(s).trim();
  }

  function evalExpr(expr, scope) {
    try {
      const keys = Object.keys(scope);
      const vals = keys.map(function (k) { return scope[k]; });
      // eslint-disable-next-line no-new-func
      return Function.apply(null, keys.concat(['return (' + expr + ');'])).apply(null, vals);
    } catch (e) {
      console.warn('[support] expr failed:', expr, e);
      return undefined;
    }
  }

  function interp(str, scope) {
    return String(str).replace(/\{\{([\s\S]*?)\}\}/g, function (_, e) {
      const v = evalExpr(e.trim(), scope);
      return v == null ? '' : v;
    });
  }

  function setupHover(el, hoverCss) {
    el.addEventListener('mouseenter', function () {
      el.__baseStyle = el.getAttribute('style') || '';
      el.setAttribute('style', el.__baseStyle + ';' + hoverCss);
    });
    el.addEventListener('mouseleave', function () {
      el.setAttribute('style', el.__baseStyle || '');
    });
  }

  function compile(node, scope, out) {
    // Text
    if (node.nodeType === 3) {
      out.appendChild(document.createTextNode(interp(node.nodeValue, scope)));
      return;
    }
    if (node.nodeType !== 1) return;

    const tag = node.tagName.toLowerCase();

    if (tag === 'sc-if') {
      const cond = evalExpr(stripBraces(node.getAttribute('value')), scope);
      if (cond) {
        Array.prototype.forEach.call(node.childNodes, function (c) { compile(c, scope, out); });
      }
      return;
    }

    if (tag === 'sc-for') {
      const list = evalExpr(stripBraces(node.getAttribute('list')), scope) || [];
      const asName = node.getAttribute('as');
      list.forEach(function (item) {
        const childScope = Object.assign({}, scope);
        childScope[asName] = item;
        Array.prototype.forEach.call(node.childNodes, function (c) { compile(c, childScope, out); });
      });
      return;
    }

    const el = document.createElement(tag);
    Array.prototype.forEach.call(node.attributes, function (attr) {
      const name = attr.name;
      const val = attr.value;
      if (name.indexOf('hint-') === 0) return;
      if (name === 'onclick') {
        const fn = evalExpr(stripBraces(val), scope);
        if (typeof fn === 'function') el.addEventListener('click', fn);
        return;
      }
      if (name === 'ref') {
        const r = evalExpr(stripBraces(val), scope);
        if (r && typeof r === 'object') r.current = el;
        return;
      }
      if (name === 'style-hover') { setupHover(el, val); return; }
      el.setAttribute(name, interp(val, scope));
    });

    Array.prototype.forEach.call(node.childNodes, function (c) { compile(c, scope, el); });
    out.appendChild(el);
  }

  function render() {
    if (!inst || !rootEl) return;
    const vals = inst.renderVals();
    const scope = Object.assign({}, vals);
    rootEl.innerHTML = '';
    templateNodes.forEach(function (n) { compile(n, scope, rootEl); });

    // Boot overlay only plays once; on re-render the fresh overlay must stay hidden if already booted.
    if (inst.bootRef && inst.bootRef.current && localStorage.getItem('ghos_booted') === '1') {
      inst.bootRef.current.style.display = 'none';
      // Re-run stat count-up when returning to the landing (imperative animation is otherwise lost).
      if (vals.isLanding && typeof inst._runCounts === 'function') inst._runCounts();
    }
  }

  function init() {
    const xdc = document.querySelector('x-dc');
    if (!xdc) { console.warn('[support] no <x-dc> found'); return; }

    const helmet = xdc.querySelector('helmet');
    if (helmet) {
      Array.prototype.slice.call(helmet.children).forEach(function (c) {
        document.head.appendChild(c);
      });
    }

    templateNodes = Array.prototype.slice.call(xdc.childNodes)
      .filter(function (n) { return !(n.nodeType === 1 && n.tagName.toLowerCase() === 'helmet'); })
      .map(function (n) { return n.cloneNode(true); });

    xdc.remove();

    rootEl = document.createElement('div');
    document.body.appendChild(rootEl);

    const scriptEl = document.querySelector('script[type="text/x-dc"]');
    if (!scriptEl) { console.warn('[support] no component script found'); return; }
    // eslint-disable-next-line no-new-func
    const Component = Function('DCLogic', 'React', scriptEl.textContent + '\n;return Component;')(DCLogic, window.React);

    inst = new Component({});
    render();
    if (typeof inst.componentDidMount === 'function') inst.componentDidMount();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
