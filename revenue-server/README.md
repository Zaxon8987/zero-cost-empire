# calculate-shaft-mechanics — MCP Revenue Server

Standard MCP server implementing `calculate_shaft_mechanics` with metered billing.

## Formulas

- Polar moment of inertia: `J = (π × d⁴) / 32`
- Max shear stress: `τ_max = (T × r) / J`
- Factor of safety: `FoS = σ_yield / τ_max`

## Usage

Any MCP client can discover and call this tool:

```json
{
  "method": "tools/call",
  "params": {
    "name": "calculate_shaft_mechanics",
    "arguments": {
      "torque_Nm": 500,
      "diameter_mm": 40,
      "material_yield_MPa": 250,
      "safety_factor_target": 2.0
    }
  }
}
```

## Billing

| Item | Value |
|------|-------|
| Rate | $0.02 per successful calculation |
| Split | 85% creator / 15% platform |
| Payout | Bitcoin (watch-only wallet) |
| Settlement | Daily |

## Audit

All calls are logged to `transaction-log.ndjson` (append-only).
