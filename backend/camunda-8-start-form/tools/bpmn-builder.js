// Tiny BPMN writer for the MicroLending demo models.
// Nodes are placed on a grid (column c, row r); the diagram (BPMNDI) - shapes, routed flows,
// label positions and colours - is generated from that, so the processes render cleanly in
// Operate / Modeler without manual layout work.
//
// Usage: see generate-models.js

const fs = require('fs');
const path = require('path');

const COL = 190; // px between columns
const ROW = 140; // px between rows
const X0 = 160;
const Y0 = 130;

const SIZE = {
  task: [120, 80],
  event: [36, 36],
  gateway: [50, 50],
};

// BPMN-in-color palette (same colours as the Camunda Modeler colour picker)
const TONES = {
  human: { fill: '#bbdefb', stroke: '#0d4372' }, // a person works on it
  decision: { fill: '#e1bee7', stroke: '#5b176d' }, // DMN
  warn: { fill: '#ffe0b2', stroke: '#6b3c00' }, // exception handling
  good: { fill: '#c8e6c9', stroke: '#205022' }, // happy outcome
  bad: { fill: '#ffcdd2', stroke: '#831311' }, // negative outcome
};

const TASK_TYPES = ['service', 'user', 'rule', 'receive'];
const EVENT_TYPES = ['start', 'end', 'timer', 'message', 'boundary'];

function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function kind(n) {
  if (TASK_TYPES.includes(n.type)) return 'task';
  if (EVENT_TYPES.includes(n.type)) return 'event';
  if (n.type === 'xgw' || n.type === 'egw') return 'gateway';
  if (n.type === 'sub') return 'sub';
  throw new Error('unknown type ' + n.type);
}

/** Size of a wrapped label (bpmn-js uses ~11px Arial; ~6px per character). */
function textBox(text, maxW) {
  const words = String(text).split(/\s+/);
  let lines = 1;
  let line = 0;
  let widest = 0;
  for (const w of words) {
    const ww = w.length * 6;
    if (line > 0 && line + 4 + ww > maxW) {
      lines++;
      widest = Math.max(widest, line);
      line = ww;
    } else {
      line += (line > 0 ? 4 : 0) + ww;
    }
  }
  widest = Math.max(widest, line);
  return { w: Math.min(maxW, widest + 4), h: lines * 14 };
}

class ProcessModel {
  constructor(id, name) {
    this.id = id;
    this.name = name;
    this.nodes = new Map();
    this.flows = [];
    this.messages = new Map();
    this.errors = new Map();
    /** Folder with the Camunda form files (name.form) that user tasks refer to with `form: 'name'`. */
    this.formsDir = null;
  }

  /** Camunda 8.3 has no linked forms yet: each user task's form is embedded in the process (zeebe:userTaskForm). */
  static formElementId(name) {
    return 'UserTaskForm_' + name.replace(/[^A-Za-z0-9]/g, '_');
  }

  // ---- nodes -------------------------------------------------------------
  add(node, parent) {
    if (this.nodes.has(node.id)) throw new Error('duplicate id ' + node.id);
    node.parent = parent || null;
    this.nodes.set(node.id, node);
    return node;
  }

  sub(id, name, opts, build, parent) {
    const node = this.add({ id, name, type: 'sub', ...opts }, parent);
    build(new Scope(this, node));
    return node;
  }

  message(name) {
    this.messages.set(name, 'Message_' + name.replace(/[^A-Za-z0-9]/g, '_'));
    return this.messages.get(name);
  }

  error(code) {
    this.errors.set(code, 'Error_' + code);
    return this.errors.get(code);
  }

  flow(from, to, opts = {}) {
    let id = opts.id || 'Flow_' + from + '_' + to;
    while (this.flows.some((f) => f.id === id)) id += '_';
    this.flows.push({ id, from, to, ...opts });
    return id;
  }

  // ---- geometry ----------------------------------------------------------
  bounds(id) {
    const n = this.nodes.get(id);
    if (!n) throw new Error('no node ' + id);
    if (n._b) return n._b;
    let b;
    const k = kind(n);
    if (k === 'sub') {
      const kids = [...this.nodes.values()].filter((x) => x.parent === n && x.type !== 'boundary');
      const bs = kids.map((x) => this.bounds(x.id));
      const pad = 40;
      const x = Math.min(...bs.map((q) => q.x)) - pad;
      const y = Math.min(...bs.map((q) => q.y)) - pad - 15;
      const x2 = Math.max(...bs.map((q) => q.x + q.w)) + pad;
      const y2 = Math.max(...bs.map((q) => q.y + q.h)) + pad;
      b = { x, y, w: x2 - x, h: y2 - y };
    } else if (n.type === 'boundary') {
      const h = this.bounds(n.attachedTo);
      const [w, hh] = SIZE.event;
      const side = n.side || 'bottom';
      const cx = n.atC !== undefined ? X0 + n.atC * COL : h.x + h.w / 2 + (n.offset || 0) * (h.w / 2);
      const cy = side === 'top' ? h.y : h.y + h.h;
      b = { x: cx - w / 2, y: cy - hh / 2, w, h: hh };
    } else {
      const [w, h] = SIZE[k];
      const cx = X0 + n.c * COL;
      const cy = Y0 + n.r * ROW;
      b = { x: cx - w / 2, y: cy - h / 2, w, h };
    }
    b.cx = b.x + b.w / 2;
    b.cy = b.y + b.h / 2;
    n._b = b;
    return b;
  }

  waypoints(f) {
    if (f._wp) return f._wp;
    const s = this.bounds(f.from);
    const t = this.bounds(f.to);
    const sn = this.nodes.get(f.from);
    const tn = this.nodes.get(f.to);
    const exitSide = (b, p) => {
      // a sub-process is entered / left on its side at the height of the waypoint
      if ((b === s ? sn : tn).type === 'sub' && p.y > b.y && p.y < b.y + b.h) {
        return { x: p.x < b.cx ? b.x : b.x + b.w, y: p.y };
      }
      // point on the border of b in the direction of p (p shares x or y with the centre)
      if (Math.abs(p.x - b.cx) < 1) return { x: b.cx, y: p.y < b.cy ? b.y : b.y + b.h };
      return { x: p.x < b.cx ? b.x : b.x + b.w, y: b.cy };
    };
    let pts;
    const dx = t.cx - s.cx;
    const dy = t.cy - s.cy;
    if (f.wp) {
      const mids = f.wp.map(([x, y]) => ({ x, y }));
      pts = [exitSide(s, mids[0]), ...mids, exitSide(t, mids[mids.length - 1])];
    } else if (tn.type === 'sub' && s.cy > t.y && s.cy < t.y + t.h && dx > 0) {
      // into the side of a sub-process, at the source's height
      pts = [{ x: s.x + s.w, y: s.cy }, { x: t.x, y: s.cy }];
    } else if (sn.type === 'sub' && t.cy > s.y && t.cy < s.y + s.h && dx > 0) {
      // out of the side of a sub-process, at the target's height
      pts = [{ x: s.x + s.w, y: t.cy }, { x: t.x, y: t.cy }];
    } else if (Math.abs(dy) < 1) {
      pts = dx > 0
        ? [{ x: s.x + s.w, y: s.cy }, { x: t.x, y: t.cy }]
        : [{ x: s.x, y: s.cy }, { x: t.x + t.w, y: t.cy }];
    } else if (Math.abs(dx) < 1) {
      pts = dy > 0
        ? [{ x: s.cx, y: s.y + s.h }, { x: t.cx, y: t.y }]
        : [{ x: s.cx, y: s.y }, { x: t.cx, y: t.y + t.h }];
    } else if (kind(sn) === 'gateway' || sn.type === 'boundary') {
      // gateways and boundary events branch vertically first
      pts = [
        { x: s.cx, y: dy > 0 ? s.y + s.h : s.y },
        { x: s.cx, y: t.cy },
        dx > 0 ? { x: t.x, y: t.cy } : { x: t.x + t.w, y: t.cy },
      ];
    } else {
      pts = [
        dx > 0 ? { x: s.x + s.w, y: s.cy } : { x: s.x, y: s.cy },
        { x: t.cx, y: s.cy },
        { x: t.cx, y: dy > 0 ? t.y : t.y + t.h },
      ];
    }
    f._wp = pts;
    return pts;
  }

  /** Which sides of a node already have a flow attached (to keep its label off the lines). */
  usedSides(id) {
    const b = this.bounds(id);
    const sides = new Set();
    const mark = (p) => {
      if (Math.abs(p.y - b.y) < 1) sides.add('top');
      else if (Math.abs(p.y - (b.y + b.h)) < 1) sides.add('bottom');
      else if (Math.abs(p.x - b.x) < 1) sides.add('left');
      else if (Math.abs(p.x - (b.x + b.w)) < 1) sides.add('right');
    };
    for (const f of this.flows) {
      const pts = this.waypoints(f);
      if (f.from === id) mark(pts[0]);
      if (f.to === id) mark(pts[pts.length - 1]);
    }
    return sides;
  }

  /** Label bounds for events and gateways: first free side. */
  nodeLabel(n) {
    const b = this.bounds(n.id);
    const { w, h } = textBox(n.name, 110);
    const used = this.usedSides(n.id);
    const at = {
      bottom: { x: b.cx - w / 2, y: b.y + b.h + 5 },
      top: { x: b.cx - w / 2, y: b.y - h - 5 },
      right: { x: b.x + b.w + 6, y: b.cy - h / 2 },
      left: { x: b.x - w - 6, y: b.cy - h / 2 },
      topLeft: { x: b.x - w - 4, y: b.y - h - 2 },
      topRight: { x: b.cx + 6, y: b.y - h - 4 },
    };
    if (n.labelSide) {
      const q = at[n.labelSide];
      return { x: q.x, y: q.y, w, h };
    }
    if (n.type === 'boundary') {
      // beside the event, outside the host task (below for bottom events, above for top events)
      const top = n.side === 'top';
      return { x: b.x + b.w + 4, y: top ? b.y - h + 6 : b.y + b.h - 6, w, h };
    }
    let order = kind(n) === 'gateway' ? ['top', 'bottom'] : ['bottom', 'top'];
    if (n.labelSide) order = [n.labelSide];
    const side = order.find((s) => !used.has(s));
    const p = side ? at[side] : { x: b.cx + 6, y: b.y - h - 4 }; // above, right of an incoming vertical line
    return { x: p.x, y: p.y, w, h };
  }

  /** Label bounds for a sequence flow: next to the first segment, just after the source. */
  flowLabel(f) {
    const pts = this.waypoints(f);
    const [p0, p1] = pts;
    const { w, h } = textBox(f.name, 100);
    if (pts.length === 3 && Math.abs(p0.x - p1.x) < 1 && !f.wp) {
      // vertical-then-horizontal branch: label at the corner, so branches sharing a gateway side stay apart
      const p2 = pts[2];
      return p2.x > p1.x ? { x: p1.x + 8, y: p1.y - h - 3, w, h } : { x: p1.x - 8 - w, y: p1.y - h - 3, w, h };
    }
    if (Math.abs(p0.y - p1.y) < 1) {
      return p1.x > p0.x ? { x: p0.x + 8, y: p0.y - h - 3, w, h } : { x: p0.x - 8 - w, y: p0.y - h - 3, w, h };
    }
    return p1.y > p0.y ? { x: p0.x + 6, y: p0.y + 6, w, h } : { x: p0.x + 6, y: p0.y - h - 6, w, h };
  }

  tone(n) {
    if (n.tone) return TONES[n.tone];
    if (n.type === 'user') return TONES.human;
    if (n.type === 'rule') return TONES.decision;
    if (n.type === 'start' && !n.parent) return TONES.good;
    return null;
  }

  // grid helpers for manual waypoints
  static cx(c) {
    return X0 + c * COL;
  }
  static cy(r) {
    return Y0 + r * ROW;
  }

  // ---- XML ---------------------------------------------------------------
  nodeXml(n, ind) {
    const i = ' '.repeat(ind);
    const nm = n.name ? ` name="${esc(n.name)}"` : '';
    const ext = (inner) => `${i}  <bpmn:extensionElements>\n${inner}${i}  </bpmn:extensionElements>\n`;
    const timerDef = (expr) =>
      `${i}  <bpmn:timerEventDefinition>\n${i}    <bpmn:timeDuration xsi:type="bpmn:tFormalExpression">${esc(expr)}</bpmn:timeDuration>\n${i}  </bpmn:timerEventDefinition>\n`;
    const msgDef = (name) => `${i}  <bpmn:messageEventDefinition messageRef="${this.message(name)}" />\n`;
    const doc = n.doc ? `${i}  <bpmn:documentation>${esc(n.doc)}</bpmn:documentation>\n` : '';
    // incoming/outgoing references (Zeebe validates boundary events and event gateways with them)
    const io =
      this.flows.filter((f) => f.to === n.id).map((f) => `${i}  <bpmn:incoming>${f.id}</bpmn:incoming>\n`).join('') +
      this.flows.filter((f) => f.from === n.id).map((f) => `${i}  <bpmn:outgoing>${f.id}</bpmn:outgoing>\n`).join('');
    switch (n.type) {
      case 'start': {
        const intr = n.interrupting === false ? ' isInterrupting="false"' : '';
        const body = n.message ? msgDef(n.message) : '';
        return `${i}<bpmn:startEvent id="${n.id}"${nm}${intr}>\n${doc}${io}${body}${i}</bpmn:startEvent>\n`;
      }
      case 'end':
        return `${i}<bpmn:endEvent id="${n.id}"${nm}>\n${doc}${io}${i}</bpmn:endEvent>\n`;
      case 'service': {
        let inner = `${i}    <zeebe:taskDefinition type="${esc(n.job)}" retries="${n.retries || 3}" />\n`;
        if (n.headers && Object.keys(n.headers).length) {
          inner += `${i}    <zeebe:taskHeaders>\n`;
          for (const [k, v] of Object.entries(n.headers)) {
            inner += `${i}      <zeebe:header key="${esc(k)}" value="${esc(v)}" />\n`;
          }
          inner += `${i}    </zeebe:taskHeaders>\n`;
        }
        return `${i}<bpmn:serviceTask id="${n.id}"${nm}>\n${doc}${ext(inner)}${io}${i}</bpmn:serviceTask>\n`;
      }
      case 'user': {
        const a = n.assignee ? ` assignee="${esc(n.assignee)}"` : '';
        const g = n.group ? ` candidateGroups="${esc(n.group)}"` : '';
        const form = n.form
          ? `${i}    <zeebe:formDefinition formKey="camunda-forms:bpmn:${ProcessModel.formElementId(n.form)}" />\n`
          : '';
        const inner = `${form}${i}    <zeebe:assignmentDefinition${a}${g} />\n`;
        return `${i}<bpmn:userTask id="${n.id}"${nm}>\n${doc}${ext(inner)}${io}${i}</bpmn:userTask>\n`;
      }
      case 'rule': {
        const inner = `${i}    <zeebe:calledDecision decisionId="${esc(n.decision)}" resultVariable="${esc(n.result)}" />\n`;
        return `${i}<bpmn:businessRuleTask id="${n.id}"${nm}>\n${doc}${ext(inner)}${io}${i}</bpmn:businessRuleTask>\n`;
      }
      case 'receive':
        return `${i}<bpmn:receiveTask id="${n.id}"${nm} messageRef="${this.message(n.message)}">\n${doc}${io}${i}</bpmn:receiveTask>\n`;
      case 'xgw': {
        const def = this.flows.find((f) => f.from === n.id && f.def);
        const d = def ? ` default="${def.id}"` : '';
        return `${i}<bpmn:exclusiveGateway id="${n.id}"${nm}${d}>\n${io}${i}</bpmn:exclusiveGateway>\n`;
      }
      case 'egw':
        return `${i}<bpmn:eventBasedGateway id="${n.id}"${nm}>\n${io}${i}</bpmn:eventBasedGateway>\n`;
      case 'timer':
        return `${i}<bpmn:intermediateCatchEvent id="${n.id}"${nm}>\n${doc}${io}${timerDef(n.duration)}${i}</bpmn:intermediateCatchEvent>\n`;
      case 'message':
        return `${i}<bpmn:intermediateCatchEvent id="${n.id}"${nm}>\n${doc}${io}${msgDef(n.message)}${i}</bpmn:intermediateCatchEvent>\n`;
      case 'boundary': {
        const cancel = n.interrupting === false ? ' cancelActivity="false"' : '';
        let body;
        if (n.event === 'timer') body = timerDef(n.duration);
        else if (n.event === 'error') body = `${i}  <bpmn:errorEventDefinition errorRef="${this.error(n.errorCode)}" />\n`;
        else if (n.event === 'message') body = msgDef(n.message);
        else throw new Error('boundary event ' + n.event);
        return `${i}<bpmn:boundaryEvent id="${n.id}"${nm}${cancel} attachedToRef="${n.attachedTo}">\n${io}${body}${i}</bpmn:boundaryEvent>\n`;
      }
      case 'sub': {
        const trig = n.eventSub ? ' triggeredByEvent="true"' : '';
        let inner = '';
        for (const c of this.nodes.values()) if (c.parent === n) inner += this.nodeXml(c, ind + 2);
        for (const f of this.flows) if (this.nodes.get(f.from).parent === n) inner += this.flowXml(f, ind + 2);
        return `${i}<bpmn:subProcess id="${n.id}"${nm}${trig}>\n${doc}${io}${inner}${i}</bpmn:subProcess>\n`;
      }
    }
    throw new Error('type ' + n.type);
  }

  flowXml(f, ind) {
    const i = ' '.repeat(ind);
    const nm = f.name ? ` name="${esc(f.name)}"` : '';
    const open = `${i}<bpmn:sequenceFlow id="${f.id}"${nm} sourceRef="${f.from}" targetRef="${f.to}"`;
    if (f.cond) {
      return `${open}>\n${i}  <bpmn:conditionExpression xsi:type="bpmn:tFormalExpression">${esc(f.cond)}</bpmn:conditionExpression>\n${i}</bpmn:sequenceFlow>\n`;
    }
    return `${open} />\n`;
  }

  shapeXml(n) {
    const b = this.bounds(n.id);
    const exp = n.type === 'sub' ? ' isExpanded="true"' : '';
    const t = this.tone(n);
    const col = t
      ? ` bioc:stroke="${t.stroke}" bioc:fill="${t.fill}" color:background-color="${t.fill}" color:border-color="${t.stroke}"`
      : '';
    let label = '';
    if (n.name && (kind(n) === 'event' || kind(n) === 'gateway')) {
      const l = this.nodeLabel(n);
      label = `        <bpmndi:BPMNLabel>\n          <dc:Bounds x="${Math.round(l.x)}" y="${Math.round(l.y)}" width="${Math.round(l.w)}" height="${l.h}" />\n        </bpmndi:BPMNLabel>\n`;
    }
    return `      <bpmndi:BPMNShape id="${n.id}_di" bpmnElement="${n.id}"${exp}${col}>\n        <dc:Bounds x="${Math.round(b.x)}" y="${Math.round(b.y)}" width="${b.w}" height="${b.h}" />\n${label}      </bpmndi:BPMNShape>\n`;
  }

  edgeXml(f) {
    const pts = this.waypoints(f)
      .map((p) => `        <di:waypoint x="${Math.round(p.x)}" y="${Math.round(p.y)}" />\n`)
      .join('');
    let label = '';
    if (f.name) {
      const l = this.flowLabel(f);
      label = `        <bpmndi:BPMNLabel>\n          <dc:Bounds x="${Math.round(l.x)}" y="${Math.round(l.y)}" width="${Math.round(l.w)}" height="${l.h}" />\n        </bpmndi:BPMNLabel>\n`;
    }
    return `      <bpmndi:BPMNEdge id="${f.id}_di" bpmnElement="${f.id}">\n${pts}${label}      </bpmndi:BPMNEdge>\n`;
  }

  toXml() {
    // validate flows
    for (const f of this.flows) {
      const a = this.nodes.get(f.from);
      const b = this.nodes.get(f.to);
      if (!a || !b) throw new Error(`flow ${f.id}: unknown node`);
      const pa = a.type === 'boundary' ? this.nodes.get(a.attachedTo).parent : a.parent;
      if (pa !== b.parent) throw new Error(`flow ${f.id} crosses a sub-process border`);
    }
    // boundary events live in the scope of their host
    for (const n of this.nodes.values()) {
      if (n.type === 'boundary') n.parent = this.nodes.get(n.attachedTo).parent;
    }
    // embedded forms of the user tasks (one per form file, read from formsDir)
    const formNames = [...new Set([...this.nodes.values()].filter((n) => n.type === 'user' && n.form).map((n) => n.form))];
    if (formNames.length && !this.formsDir) throw new Error('user tasks refer to forms but formsDir is not set');
    let forms = '';
    for (const name of formNames) {
      const json = fs.readFileSync(path.join(this.formsDir, name + '.form'), 'utf8').trim();
      JSON.parse(json); // fail early on a broken form file
      forms += `      <zeebe:userTaskForm id="${ProcessModel.formElementId(name)}">${esc(json)}</zeebe:userTaskForm>\n`;
    }
    const processExt = forms ? `    <bpmn:extensionElements>\n${forms}    </bpmn:extensionElements>\n` : '';

    let body = processExt;
    for (const n of this.nodes.values()) if (n.parent === null) body += this.nodeXml(n, 4);
    for (const f of this.flows) if (this.nodes.get(f.from).parent === null) body += this.flowXml(f, 4);

    let roots = '';
    for (const [name, id] of this.messages) {
      roots += `  <bpmn:message id="${id}" name="${esc(name)}">\n    <bpmn:extensionElements>\n      <zeebe:subscription correlationKey="=applicationId" />\n    </bpmn:extensionElements>\n  </bpmn:message>\n`;
    }
    for (const [code, id] of this.errors) {
      roots += `  <bpmn:error id="${id}" name="${esc(code)}" errorCode="${esc(code)}" />\n`;
    }

    // diagram: sub-processes first so they are drawn underneath their content
    const ordered = [...this.nodes.values()].sort((a, b) => (a.type === 'sub' ? 0 : 1) - (b.type === 'sub' ? 0 : 1));
    const shapes = ordered.map((n) => this.shapeXml(n)).join('') + this.flows.map((f) => this.edgeXml(f)).join('');
    const sid = this.id.replace(/-/g, '_');

    return `<?xml version="1.0" encoding="UTF-8"?>
<!-- GENERATED by tools/generate-models.js - edit that file and run "node tools/generate-models.js" -->
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:di="http://www.omg.org/spec/DD/20100524/DI" xmlns:zeebe="http://camunda.org/schema/zeebe/1.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:modeler="http://camunda.org/schema/modeler/1.0" xmlns:bioc="http://bpmn.io/schema/bpmn/biocolor/1.0" xmlns:color="http://www.omg.org/spec/BPMN/non-normative/color/1.0" id="Definitions_${sid}" targetNamespace="http://bpmn.io/schema/bpmn" exporter="MicroLending model generator" exporterVersion="2.0" modeler:executionPlatform="Camunda Cloud" modeler:executionPlatformVersion="8.3.0">
  <bpmn:process id="${this.id}" name="${esc(this.name)}" isExecutable="true">
${body}  </bpmn:process>
${roots}  <bpmndi:BPMNDiagram id="BPMNDiagram_${sid}">
    <bpmndi:BPMNPlane id="BPMNPlane_${sid}" bpmnElement="${this.id}">
${shapes}    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>
`;
  }
}

// Adds nodes inside a sub-process
class Scope {
  constructor(model, parent) {
    this.model = model;
    this.parent = parent;
  }
  add(node) {
    return this.model.add(node, this.parent);
  }
  /** Nested (e.g. event) sub-process inside this sub-process. */
  sub(id, name, opts, build) {
    return this.model.sub(id, name, opts, build, this.parent);
  }
}

module.exports = { ProcessModel, Scope, COL, ROW, X0, Y0 };
