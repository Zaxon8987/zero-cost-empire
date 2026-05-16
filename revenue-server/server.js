import { createHash } from 'crypto';
import { appendFileSync, readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const LOG_PATH = join(__dirname, 'transaction-log.ndjson');
const MANIFEST_PATH = join(__dirname, 'billing-manifest.json');
const BILLING_RATE = 0.02;
let seq = loadSeq();

function loadSeq() {
  if (!existsSync(LOG_PATH)) return 0;
  const lines = readFileSync(LOG_PATH, 'utf-8').trim().split('\n');
  if (lines.length === 0) return 0;
  const last = JSON.parse(lines[lines.length - 1]);
  return last.seq;
}

function appendLog(entry) {
  seq++;
  const record = { seq, ...entry, timestamp: new Date().toISOString() };
  appendFileSync(LOG_PATH, JSON.stringify(record) + '\n');
  return seq;
}

function calculateShaftMechanics(params) {
  const { torque_Nm, diameter_mm, material_yield_MPa, safety_factor_target } = params;

  const d = diameter_mm / 1000;
  const r = d / 2;
  const J = (Math.PI * Math.pow(d, 4)) / 32;
  const tau_max = (torque_Nm * r) / J;
  const tau_max_MPa = tau_max / 1e6;

  const fos_yield = material_yield_MPa / tau_max_MPa;
  const allowable_stress = material_yield_MPa / (safety_factor_target || 2);
  const max_torque = (allowable_stress * 1e6 * J) / r;

  const passes = fos_yield >= (safety_factor_target || 2);

  return {
    input_summary: {
      torque_Nm,
      diameter_mm,
      material_yield_MPa,
      safety_factor_target: safety_factor_target || 2,
    },
    results: {
      max_shear_stress_MPa: Math.round(tau_max_MPa * 100) / 100,
      polar_moment_of_inertia_m4: J,
      factor_of_safety_yield: Math.round(fos_yield * 100) / 100,
      allowable_stress_MPa: Math.round(allowable_stress * 100) / 100,
      max_allowable_torque_Nm: Math.round(max_torque * 100) / 100,
    },
    verdict: passes ? 'PASS — shaft design is safe' : 'FAIL — shaft design exceeds allowable stress',
  };
}

const TOOL_DEFINITION = {
  name: 'calculate_shaft_mechanics',
  description: 'Calculates shaft factor-of-safety from torque, diameter, and material yield strength using standard mechanical engineering formulas (torsion equation).',
  inputSchema: {
    type: 'object',
    properties: {
      torque_Nm: {
        type: 'number',
        description: 'Applied torque in Newton-meters',
        examples: [150, 500, 1200],
      },
      diameter_mm: {
        type: 'number',
        description: 'Shaft diameter in millimeters',
        examples: [25, 40, 60],
      },
      material_yield_MPa: {
        type: 'number',
        description: 'Material yield strength in MPa (e.g., 250 for mild steel, 500 for alloy steel)',
        examples: [250, 500, 750],
      },
      safety_factor_target: {
        type: 'number',
        description: 'Target safety factor (default 2.0)',
        default: 2.0,
        examples: [1.5, 2.0, 3.0],
      },
    },
    required: ['torque_Nm', 'diameter_mm', 'material_yield_MPa'],
  },
  billing: {
    rate: BILLING_RATE,
    currency: 'USD',
    trigger: 'on_success',
  },
};

function handleRequest(msg) {
  const id = msg.id;

  if (msg.method === 'initialize') {
    return {
      jsonrpc: '2.0',
      id,
      result: {
        protocolVersion: '2025-03-26',
        capabilities: { tools: {} },
        serverInfo: { name: 'calculate-shaft-mechanics', version: '1.0.0' },
      },
    };
  }

  if (msg.method === 'tools/list') {
    return {
      jsonrpc: '2.0',
      id,
      result: { tools: [TOOL_DEFINITION] },
    };
  }

  if (msg.method === 'tools/call') {
    const { name, arguments: args } = msg.params;
    if (name !== 'calculate_shaft_mechanics') {
      return { jsonrpc: '2.0', id, error: { code: -32601, message: `Tool not found: ${name}` } };
    }

    const result = calculateShaftMechanics(args);

    const txSeq = appendLog({
      event: 'TOOL_CALL',
      tool: name,
      input_hash: createHash('sha256').update(JSON.stringify(args)).digest('hex').slice(0, 16),
      billed: BILLING_RATE,
      status: 'success',
    });

    return {
      jsonrpc: '2.0',
      id,
      result: {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        meta: {
          billed: `${BILLING_RATE} USD`,
          transaction_id: `tx-${txSeq}`,
          audit_seq: txSeq,
        },
      },
    };
  }

  return { jsonrpc: '2.0', id, result: {} };
}

const BUF_SIZE = 4096;
let buffer = '';

process.stdin.setEncoding('utf-8');
process.stdin.on('data', (chunk) => {
  buffer += chunk;
  const parts = buffer.split('\n');
  buffer = parts.pop();
  for (const line of parts) {
    if (!line.trim()) continue;
    try {
      const msg = JSON.parse(line);
      const resp = handleRequest(msg);
      if (resp) process.stdout.write(JSON.stringify(resp) + '\n');
    } catch (e) {
      // skip malformed
    }
  }
});

process.stderr.write('[revenue-server] MCP server online: calculate_shaft_mechanics\n');
process.stderr.write(`[revenue-server] Billing rate: $${BILLING_RATE}/call | Audit log: transaction-log.ndjson\n`);
