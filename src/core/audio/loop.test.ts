import { describe, expect, it } from "vitest";
import { loopBounds, prepareLoop } from "./loop";
function buffer(channels: number[][], rate = 1000) {
  const data = channels.map((channel) => Float32Array.from(channel));
  return {
    numberOfChannels: data.length,
    length: data[0].length,
    sampleRate: rate,
    duration: data[0].length / rate,
    getChannelData: (c: number) => data[c],
  } as AudioBuffer;
}
const context = {
  createBuffer: (channels: number, length: number, rate: number) =>
    buffer(
      Array.from({ length: channels }, () => Array(length).fill(0)),
      rate,
    ),
} as BaseAudioContext;
describe("loop preparation", () => {
  it("trims silence using every channel within explicit bounds", () => {
    const source = buffer([
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0.3, 0.4, 0.2, 0, 0, 0],
    ]);
    expect(
      loopBounds(source, {
        loopStart: 0.001,
        loopEnd: 0.007,
        trimSilence: true,
      }),
    ).toEqual({ start: 2, end: 5 });
  });
  it("keeps a silent loop valid and preserves unprocessed bounds", () => {
    const source = buffer([[0, 0, 0, 0]]);
    expect(loopBounds(source, { trimSilence: true })).toEqual({
      start: 0,
      end: 4,
    });
    const loop = prepareLoop(context, source, {
      loopStart: 0.001,
      loopEnd: 0.003,
    });
    expect(loop.buffer).toBe(source);
    expect(loop.start).toBe(0.001);
    expect(loop.end).toBe(0.003);
  });
  it("removes exported head and tail silence before closing an ambience loop", () => {
    const source = buffer([
      [...Array(12).fill(0), ...Array(60).fill(0.25), ...Array(18).fill(0)],
    ]);
    const loop = prepareLoop(context, source, {
      trimSilence: true,
      crossfadeSeconds: 0.01,
    });
    const samples = loop.buffer.getChannelData(0);
    expect(samples.length).toBeGreaterThan(20);
    expect(
      Math.min(...samples.map((sample) => Math.abs(sample))),
    ).toBeGreaterThan(0.2);
    expect(Math.abs(samples[0] - samples[samples.length - 1])).toBeLessThan(
      0.001,
    );
  });

  it("reduces a discontinuous seam without clipping or changing channels", () => {
    const source = buffer([
      Array.from({ length: 100 }, (_, i) => (i < 50 ? 0.7 : -0.7)),
      Array.from({ length: 100 }, (_, i) => (i < 50 ? 0.3 : -0.3)),
    ]);
    const loop = prepareLoop(context, source, { crossfadeSeconds: 0.02 });
    expect(loop.buffer.length).toBe(80);
    expect(loop.buffer.numberOfChannels).toBe(2);
    for (let channel = 0; channel < 2; channel++) {
      const samples = loop.buffer.getChannelData(channel);
      expect(Math.abs(samples[0] - samples[samples.length - 1])).toBeLessThan(
        0.001,
      );
      expect(Math.max(...samples.map(Math.abs))).toBeLessThanOrEqual(0.71);
    }
  });
});
