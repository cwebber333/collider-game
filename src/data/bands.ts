// Speed bands: what each band produces. Spec: docs/collider-spec.md §2.
import type { ParticleId } from './particles';

export interface BandDef {
  band: number;
  /** Share of common particles produced per collision. Shares add up to 1. */
  mix: Partial<Record<ParticleId, number>>;
  /** Rare particle that can show up here (needs enough Sensitivity). */
  rare?: ParticleId;
}

export const BANDS: readonly BandDef[] = [
  { band: 1, mix: { photon: 0.8, electron: 0.2 } },
  { band: 2, mix: { photon: 0.5, electron: 0.4, muon: 0.1 } },
  { band: 3, mix: { photon: 0.2, electron: 0.4, muon: 0.4 }, rare: 'positron' },
  { band: 4, mix: { electron: 0.2, muon: 0.5, pion: 0.3 }, rare: 'positron' },
  // Threshold 1
  { band: 5, mix: { muon: 0.3, pion: 0.5, kaon: 0.2 } },
  { band: 6, mix: { pion: 0.3, kaon: 0.5, tau: 0.2 } },
  { band: 7, mix: { kaon: 0.3, tau: 0.5, jpsi: 0.2 }, rare: 'pentaquark' },
  { band: 8, mix: { tau: 0.3, jpsi: 0.5, bmeson: 0.2 }, rare: 'pentaquark' },
  // Threshold 2
  { band: 9, mix: { jpsi: 0.3, bmeson: 0.5, zboson: 0.2 } },
  { band: 10, mix: { bmeson: 0.3, zboson: 0.5, higgs: 0.2 } },
  { band: 11, mix: { zboson: 0.4, higgs: 0.6 }, rare: 'graviton' },
  { band: 12, mix: { zboson: 0.2, higgs: 0.8 }, rare: 'graviton' },
  // Threshold 3
];
