import { describe, expect, it } from "vitest";
import { runCoupledOptimization } from "../lib/api-client";

describe("UC-067 Coupled Optimization Bitstring & Decoding Validation", () => {
  it("validates 8-qubit bitstring length, sensor/relay slicing, and decoded counts for MONSOON_SURGE", async () => {
    const res = await runCoupledOptimization({ basin_id: "krishna", scenario: "MONSOON_SURGE" });

    const { metrics, decoding, qubo_summary } = res;

    // P0-2 Assertions
    expect(qubo_summary.num_qubits).toBe(8);
    expect(qubo_summary.sensor_qubits).toBe(5);
    expect(qubo_summary.relay_qubits).toBe(3);

    expect(decoding.bitstring.length).toBe(qubo_summary.num_qubits);
    expect(decoding.sensor_bits.length).toBe(qubo_summary.sensor_qubits);
    expect(decoding.relay_bits.length).toBe(qubo_summary.relay_qubits);

    const activeSensorBit1s = (decoding.sensor_bits.match(/1/g) || []).length;
    const activeRelayBit1s = (decoding.relay_bits.match(/1/g) || []).length;

    expect(metrics.selected_sensors.length).toBe(activeSensorBit1s);
    expect(metrics.selected_relays.length).toBe(activeRelayBit1s);
    expect(decoding.selected_sensors_count).toBe(activeSensorBit1s);
    expect(decoding.selected_relays_count).toBe(activeRelayBit1s);
  });

  it("validates bitstring changes dynamically for EXTREME_CYCLONE scenario", async () => {
    const resSurge = await runCoupledOptimization({
      basin_id: "krishna",
      scenario: "MONSOON_SURGE",
    });
    const resCyclone = await runCoupledOptimization({
      basin_id: "krishna",
      scenario: "EXTREME_CYCLONE",
    });

    expect(resSurge.decoding.bitstring).toBe("11100011");
    expect(resCyclone.decoding.bitstring).toBe("00010011");
    expect(resSurge.decoding.bitstring).not.toBe(resCyclone.decoding.bitstring);
  });

  it("validates basin changes update metrics and coordinates for GODAVARI", async () => {
    const resKrishna = await runCoupledOptimization({ basin_id: "krishna" });
    const resGodavari = await runCoupledOptimization({ basin_id: "godavari" });

    expect(resKrishna.metrics.basin_id).toBe("krishna");
    expect(resGodavari.metrics.basin_id).toBe("godavari");
    expect(resKrishna.metrics.risk_score).toBe(78);
    expect(resGodavari.metrics.risk_score).toBe(88);
  });
});
