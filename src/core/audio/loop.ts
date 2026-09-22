export type LoopOptions = {
  loopStart?: number;
  loopEnd?: number | null;
  trimSilence?: boolean;
  crossfadeSeconds?: number;
};

export function loopBounds(buffer: AudioBuffer, options: LoopOptions) {
  let start = Math.max(
    0,
    Math.min(
      buffer.length - 1,
      Math.floor((options.loopStart ?? 0) * buffer.sampleRate),
    ),
  );
  let end = Math.min(
    buffer.length,
    Math.floor((options.loopEnd ?? buffer.duration) * buffer.sampleRate),
  );
  if (end <= start) {
    start = 0;
    end = buffer.length;
  }
  if (options.trimSilence) {
    const audible = (frame: number) => {
      for (let c = 0; c < buffer.numberOfChannels; c++)
        if (Math.abs(buffer.getChannelData(c)[frame]) > 0.001) return true;
      return false;
    };
    const originalStart = start,
      originalEnd = end;
    while (start < end && !audible(start)) start++;
    while (end > start && !audible(end - 1)) end--;
    if (end - start < 2) {
      start = originalStart;
      end = originalEnd;
    }
  }
  return { start, end };
}

export function prepareLoop(
  context: BaseAudioContext,
  buffer: AudioBuffer,
  options: LoopOptions,
) {
  const { start, end } = loopBounds(buffer, options);
  const overlap = Math.min(
    Math.floor((options.crossfadeSeconds ?? 0) * buffer.sampleRate),
    Math.floor((end - start) / 4),
  );
  if (overlap < 2)
    return {
      buffer,
      start: start / buffer.sampleRate,
      end: end / buffer.sampleRate,
    };
  const length = end - start - overlap;
  const result = context.createBuffer(
    buffer.numberOfChannels,
    length,
    buffer.sampleRate,
  );
  for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
    const source = buffer.getChannelData(channel),
      output = result.getChannelData(channel);
    output.set(source.subarray(start + overlap, end));
    for (let i = 0; i < overlap; i++) {
      const mix = i / (overlap - 1),
        at = length - overlap + i;
      output[at] = output[at] * (1 - mix) + source[start + i] * mix;
    }
  }
  return { buffer: result, start: 0, end: result.duration };
}
