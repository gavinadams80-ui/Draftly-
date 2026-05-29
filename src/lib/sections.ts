// ── Section Databases ──
// Ported from Draftly — AS/NZS 4600 cold-formed, AS4100 steel, AS1720 timber

import type { SectionDB } from '@/types';

// ── Cold Formed C-Section (lightweight portal frame) ──
export const CSECTION_SECTIONS: SectionDB = {
  posts: [
    { size:'C100 × 50 × 1.6',  d:100, t:1.6,  Z:10800,   I:540000,    E:200000, fy:450, wt:1.56,  grade:'G450 gal C-section' },
    { size:'C150 × 50 × 1.9',  d:150, t:1.9,  Z:22000,   I:1650000,   E:200000, fy:450, wt:1.95,  grade:'G450 gal C-section' },
    { size:'C150 × 50 × 2.0',  d:150, t:2.0,  Z:31500,   I:2360000,   E:200000, fy:450, wt:2.31,  grade:'G450 gal C-section' },
    { size:'C150 × 50 × 2.4',  d:150, t:2.4,  Z:38500,   I:2890000,   E:200000, fy:450, wt:2.78,  grade:'G450 gal C-section' },
    { size:'C200 × 60 × 2.0',  d:200, t:2.0,  Z:48000,   I:4800000,   E:200000, fy:450, wt:2.85,  grade:'G450 gal C-section' },
    { size:'C200 × 60 × 2.4',  d:200, t:2.4,  Z:64800,   I:6480000,   E:200000, fy:450, wt:3.42,  grade:'G450 gal C-section' },
    { size:'C250 × 65 × 2.4',  d:250, t:2.4,  Z:101000,  I:12600000,  E:200000, fy:450, wt:4.15,  grade:'G450 gal C-section' },
    { size:'C250 × 65 × 3.0',  d:250, t:3.0,  Z:126000,  I:15700000,  E:200000, fy:450, wt:5.18,  grade:'G450 gal C-section' },
    { size:'C300 × 70 × 2.4',  d:300, t:2.4,  Z:151000,  I:22700000,  E:200000, fy:450, wt:5.18,  grade:'G450 gal C-section' },
    { size:'C300 × 70 × 3.0',  d:300, t:3.0,  Z:189000,  I:28350000,  E:200000, fy:450, wt:6.48,  grade:'G450 gal C-section' },
    // RHS options for posts (closed section, no LTB)
    { size:'SHS 65 × 65 × 2.5',  d:65,  t:2.5,  Z:21500,   I:700000,    E:200000, fy:450, wt:1.47,  grade:'G450 gal SHS' },
    { size:'SHS 75 × 75 × 3.0',  d:75,  t:3.0,  Z:34800,   I:1305000,   E:200000, fy:450, wt:2.14,  grade:'C250L0 gal SHS' },
    { size:'SHS 89 × 89 × 3.0',  d:89,  t:3.0,  Z:50500,   I:2250000,   E:200000, fy:450, wt:2.49,  grade:'C250L0 gal SHS' },
    { size:'SHS 100 × 100 × 3.0',d:100, t:3.0,  Z:64800,   I:3240000,   E:200000, fy:450, wt:2.78,  grade:'C250L0 gal SHS' },
    { size:'SHS 100 × 100 × 4.0',d:100, t:4.0,  Z:84200,   I:4210000,   E:200000, fy:450, wt:3.66,  grade:'C250L0 gal SHS' },
    { size:'RHS 100 × 50 × 3.0', d:100, t:3.0,  Z:26500,   I:1330000,   E:200000, fy:450, wt:1.98,  grade:'C250L0 gal RHS' },
    { size:'RHS 150 × 100 × 3.0',d:150, t:3.0,  Z:87000,   I:6530000,   E:200000, fy:450, wt:3.58,  grade:'C250L0 gal RHS' },
    { size:'RHS 150 × 100 × 4.0',d:150, t:4.0,  Z:113000,  I:8470000,   E:200000, fy:450, wt:4.71,  grade:'C250L0 gal RHS' },
  ],
  beams: [
    { size:'C150 × 50 × 1.9',  d:150, t:1.9,  Z:22000,   I:1650000,   E:200000, fy:450, wt:1.95,  grade:'G450 gal C-section' },
    { size:'C150 × 50 × 2.0',  d:150, t:2.0,  Z:31500,   I:2360000,   E:200000, fy:450, wt:2.31,  grade:'G450 gal C-section' },
    { size:'C150 × 50 × 2.4',  d:150, t:2.4,  Z:38500,   I:2890000,   E:200000, fy:450, wt:2.78,  grade:'G450 gal C-section' },
    { size:'C200 × 60 × 2.0',  d:200, t:2.0,  Z:48000,   I:4800000,   E:200000, fy:450, wt:2.85,  grade:'G450 gal C-section' },
    { size:'C200 × 60 × 2.4',  d:200, t:2.4,  Z:64800,   I:6480000,   E:200000, fy:450, wt:3.42,  grade:'G450 gal C-section' },
    { size:'C250 × 65 × 2.4',  d:250, t:2.4,  Z:101000,  I:12600000,  E:200000, fy:450, wt:4.15,  grade:'G450 gal C-section' },
    { size:'C250 × 65 × 3.0',  d:250, t:3.0,  Z:126000,  I:15700000,  E:200000, fy:450, wt:5.18,  grade:'G450 gal C-section' },
    { size:'C300 × 70 × 2.4',  d:300, t:2.4,  Z:151000,  I:22700000,  E:200000, fy:450, wt:5.18,  grade:'G450 gal C-section' },
    { size:'C300 × 70 × 3.0',  d:300, t:3.0,  Z:189000,  I:28350000,  E:200000, fy:450, wt:6.48,  grade:'G450 gal C-section' },
    // Back-to-back built-up
    { size:'2/C200 × 60 × 2.4',d:200, t:2.4,  Z:129600,  I:12960000,  E:200000, fy:450, wt:6.84,  grade:'2× G450 gal back-to-back' },
    { size:'2/C250 × 65 × 2.4',d:250, t:2.4,  Z:202000,  I:25200000,  E:200000, fy:450, wt:8.30,  grade:'2× G450 gal back-to-back' },
    { size:'2/C250 × 65 × 3.0',d:250, t:3.0,  Z:252000,  I:31400000,  E:200000, fy:450, wt:10.36, grade:'2× G450 gal back-to-back' },
    { size:'2/C300 × 70 × 3.0',d:300, t:3.0,  Z:378000,  I:56700000,  E:200000, fy:450, wt:12.96, grade:'2× G450 gal back-to-back' },
    // RHS options for beams
    { size:'RHS 100 × 50 × 3.0', d:100, t:3.0,  Z:39500,   I:1980000,   E:200000, fy:450, wt:1.98,  grade:'C250L0 gal RHS' },
    { size:'RHS 125 × 75 × 3.0', d:125, t:3.0,  Z:69100,   I:4320000,   E:200000, fy:450, wt:2.25,  grade:'C250L0 gal RHS' },
    { size:'RHS 150 × 100 × 3.0',d:150, t:3.0,  Z:112000,  I:8400000,   E:200000, fy:450, wt:3.58,  grade:'C250L0 gal RHS' },
    { size:'RHS 150 × 100 × 4.0',d:150, t:4.0,  Z:147000,  I:11000000,  E:200000, fy:450, wt:4.71,  grade:'C250L0 gal RHS' },
  ],
  rafters: [
    { size:'C75 × 40 × 1.2',   d:75,  t:1.2,  Z:4200,    I:157000,    E:200000, fy:450, wt:0.78,  grade:'G450 gal C-section purlin' },
    { size:'C75 × 40 × 1.6',   d:75,  t:1.6,  Z:7200,    I:270000,    E:200000, fy:450, wt:1.04,  grade:'G450 gal C-section purlin' },
    { size:'C100 × 50 × 1.2',  d:100, t:1.2,  Z:7200,    I:360000,    E:200000, fy:450, wt:1.02,  grade:'G450 gal C-section purlin' },
    { size:'C100 × 50 × 1.6',  d:100, t:1.6,  Z:10800,   I:540000,    E:200000, fy:450, wt:1.56,  grade:'G450 gal C-section purlin' },
    { size:'C100 × 50 × 1.9',  d:100, t:1.9,  Z:15200,   I:760000,    E:200000, fy:450, wt:1.85,  grade:'G450 gal C-section purlin' },
    { size:'C100 × 50 × 2.0',  d:100, t:2.0,  Z:17200,   I:860000,    E:200000, fy:450, wt:1.95,  grade:'G450 gal C-section purlin' },
    { size:'C150 × 50 × 1.6',  d:150, t:1.6,  Z:15200,   I:1140000,   E:200000, fy:450, wt:1.85,  grade:'G450 gal C-section purlin' },
    { size:'C150 × 50 × 1.9',  d:150, t:1.9,  Z:22000,   I:1650000,   E:200000, fy:450, wt:2.20,  grade:'G450 gal C-section purlin' },
    { size:'C150 × 50 × 2.0',  d:150, t:2.0,  Z:23600,   I:1770000,   E:200000, fy:450, wt:2.31,  grade:'G450 gal C-section purlin' },
    { size:'C150 × 50 × 2.4',  d:150, t:2.4,  Z:38500,   I:2890000,   E:200000, fy:450, wt:2.78,  grade:'G450 gal C-section purlin' },
    { size:'C200 × 60 × 2.0',  d:200, t:2.0,  Z:34500,   I:3450000,   E:200000, fy:450, wt:2.85,  grade:'G450 gal C-section purlin' },
    { size:'C200 × 60 × 2.4',  d:200, t:2.4,  Z:43200,   I:4320000,   E:200000, fy:450, wt:3.42,  grade:'G450 gal C-section purlin' },
    { size:'C250 × 65 × 2.4',  d:250, t:2.4,  Z:101000,  I:12600000,  E:200000, fy:450, wt:4.15,  grade:'G450 gal C-section purlin' },
    { size:'C300 × 70 × 2.4',  d:300, t:2.4,  Z:151000,  I:22700000,  E:200000, fy:450, wt:5.18,  grade:'G450 gal C-section purlin' },
    // RHS purlin options — closed section, no LTB
    { size:'RHS 50 × 25 × 2.0',  d:50,  t:2.0,  Z:5200,    I:130000,    E:200000, fy:450, wt:0.54,  grade:'G450 Duragal RHS purlin' },
    { size:'RHS 65 × 35 × 2.0',  d:65,  t:2.0,  Z:11000,   I:358000,    E:200000, fy:450, wt:0.75,  grade:'G450 Duragal RHS purlin' },
    { size:'RHS 65 × 35 × 2.5',  d:65,  t:2.5,  Z:13800,   I:449000,    E:200000, fy:450, wt:0.94,  grade:'G450 Duragal RHS purlin' },
    { size:'RHS 75 × 50 × 2.0',  d:75,  t:2.0,  Z:18200,   I:683000,    E:200000, fy:450, wt:0.91,  grade:'G450 Duragal RHS purlin' },
    { size:'RHS 75 × 50 × 2.5',  d:75,  t:2.5,  Z:22800,   I:855000,    E:200000, fy:450, wt:1.14,  grade:'G450 Duragal RHS purlin' },
    { size:'RHS 100 × 50 × 2.0', d:100, t:2.0,  Z:26500,   I:1330000,   E:200000, fy:450, wt:1.15,  grade:'G450 Duragal RHS purlin' },
    { size:'RHS 100 × 50 × 2.5', d:100, t:2.5,  Z:33100,   I:1660000,   E:200000, fy:450, wt:1.43,  grade:'G450 Duragal RHS purlin' },
    { size:'RHS 100 × 50 × 3.0', d:100, t:3.0,  Z:39500,   I:1980000,   E:200000, fy:450, wt:1.98,  grade:'C250L0 Duragal RHS purlin' },
  ]
};

// ── Structural Steel (hot-rolled / SHS/RHS) ──
export const STEEL_SECTIONS: SectionDB = {
  posts: [
    { size:'SHS 50 × 50 × 2.0',  d:50,  t:2.0,  Z:7600,    I:190000,    E:200000, fy:450, wt:0.90,  grade:'G450 gal SHS' },
    { size:'SHS 50 × 50 × 2.5',  d:50,  t:2.5,  Z:9800,    I:245000,    E:200000, fy:450, wt:1.13,  grade:'G450 gal SHS' },
    { size:'SHS 65 × 65 × 2.0',  d:65,  t:2.0,  Z:17300,   I:562000,    E:200000, fy:450, wt:1.18,  grade:'G450 gal SHS' },
    { size:'SHS 65 × 65 × 2.5',  d:65,  t:2.5,  Z:21500,   I:700000,    E:200000, fy:450, wt:1.47,  grade:'G450 gal SHS' },
    { size:'SHS 65 × 65 × 3.0',  d:65,  t:3.0,  Z:25500,   I:828000,    E:200000, fy:450, wt:1.83,  grade:'C250L0 gal SHS' },
    { size:'SHS 75 × 75 × 2.5',  d:75,  t:2.5,  Z:29300,   I:1100000,   E:200000, fy:450, wt:1.72,  grade:'G450 gal SHS' },
    { size:'SHS 75 × 75 × 3.0',  d:75,  t:3.0,  Z:34800,   I:1305000,   E:200000, fy:450, wt:2.14,  grade:'C250L0 gal SHS' },
    { size:'SHS 89 × 89 × 2.5',  d:89,  t:2.5,  Z:42500,   I:1890000,   E:200000, fy:450, wt:2.06,  grade:'G450 gal SHS' },
    { size:'SHS 89 × 89 × 3.0',  d:89,  t:3.0,  Z:50500,   I:2250000,   E:200000, fy:450, wt:2.49,  grade:'C250L0 gal SHS' },
    { size:'SHS 89 × 89 × 3.5',  d:89,  t:3.5,  Z:58000,   I:2580000,   E:200000, fy:450, wt:2.88,  grade:'C250L0 gal SHS' },
    { size:'SHS 100 × 100 × 2.5',d:100, t:2.5,  Z:54500,   I:2730000,   E:200000, fy:450, wt:2.32,  grade:'G450 gal SHS' },
    { size:'SHS 100 × 100 × 3.0',d:100, t:3.0,  Z:64800,   I:3240000,   E:200000, fy:450, wt:2.78,  grade:'C250L0 gal SHS' },
    { size:'SHS 100 × 100 × 4.0',d:100, t:4.0,  Z:84200,   I:4210000,   E:200000, fy:450, wt:3.66,  grade:'C250L0 gal SHS' },
    { size:'RHS 125 × 75 × 3.0', d:125, t:3.0,  Z:50500,   I:3160000,   E:200000, fy:450, wt:2.83,  grade:'C250L0 gal RHS' },
    { size:'RHS 150 × 100 × 3.0',d:150, t:3.0,  Z:87000,   I:6530000,   E:200000, fy:450, wt:3.58,  grade:'C250L0 gal RHS' },
    { size:'RHS 150 × 100 × 4.0',d:150, t:4.0,  Z:113000,  I:8470000,   E:200000, fy:450, wt:4.71,  grade:'C250L0 gal RHS' },
  ],
  beams: [
    { size:'RHS 50 × 25 × 2.0',  d:50,  t:2.0,  Z:5200,    I:130000,    E:200000, fy:450, wt:0.54,  grade:'G450 gal RHS' },
    { size:'RHS 65 × 35 × 2.0',  d:65,  t:2.0,  Z:11000,   I:358000,    E:200000, fy:450, wt:0.75,  grade:'G450 gal RHS' },
    { size:'RHS 65 × 35 × 2.5',  d:65,  t:2.5,  Z:13800,   I:449000,    E:200000, fy:450, wt:0.94,  grade:'G450 gal RHS' },
    { size:'RHS 75 × 50 × 2.0',  d:75,  t:2.0,  Z:18200,   I:683000,    E:200000, fy:450, wt:0.91,  grade:'G450 gal RHS' },
    { size:'RHS 75 × 50 × 2.5',  d:75,  t:2.5,  Z:22800,   I:855000,    E:200000, fy:450, wt:1.14,  grade:'G450 gal RHS' },
    { size:'RHS 75 × 50 × 3.0',  d:75,  t:3.0,  Z:27100,   I:1020000,   E:200000, fy:450, wt:1.36,  grade:'C250L0 gal RHS' },
    { size:'RHS 100 × 50 × 2.5', d:100, t:2.5,  Z:33100,   I:1660000,   E:200000, fy:450, wt:1.43,  grade:'G450 gal RHS' },
    { size:'RHS 100 × 50 × 3.0', d:100, t:3.0,  Z:39500,   I:1980000,   E:200000, fy:450, wt:1.98,  grade:'C250L0 gal RHS' },
    { size:'RHS 100 × 50 × 4.0', d:100, t:4.0,  Z:51300,   I:2570000,   E:200000, fy:450, wt:2.58,  grade:'C250L0 gal RHS' },
    { size:'RHS 125 × 75 × 2.5', d:125, t:2.5,  Z:58000,   I:3630000,   E:200000, fy:450, wt:1.89,  grade:'G450 gal RHS' },
    { size:'RHS 125 × 75 × 3.0', d:125, t:3.0,  Z:69100,   I:4320000,   E:200000, fy:450, wt:2.25,  grade:'C250L0 gal RHS' },
    { size:'RHS 150 × 100 × 3.0',d:150, t:3.0,  Z:112000,  I:8400000,   E:200000, fy:450, wt:3.58,  grade:'C250L0 gal RHS' },
    { size:'RHS 150 × 100 × 4.0',d:150, t:4.0,  Z:147000,  I:11000000,  E:200000, fy:450, wt:4.71,  grade:'C250L0 gal RHS' },
    { size:'SHS 100 × 100 × 3.0',d:100, t:3.0,  Z:64800,   I:3240000,   E:200000, fy:450, wt:2.78,  grade:'C250L0 gal SHS' },
    { size:'SHS 100 × 100 × 4.0',d:100, t:4.0,  Z:84200,   I:4210000,   E:200000, fy:450, wt:3.66,  grade:'C250L0 gal SHS' },
    { size:'2/C300 × 70 × 3.0',   d:300, t:3.0,  Z:378000,  I:56700000,  E:200000, fy:450, wt:12.96, grade:'2× G450 gal B2B' },
  ],
  rafters: [
    { size:'C75 × 40 × 1.2',     d:75,  t:1.2,  Z:4200,    I:157000,    E:200000, fy:450, wt:0.78,  grade:'G450 gal purlin' },
    { size:'C75 × 40 × 1.6',     d:75,  t:1.6,  Z:6200,    I:233000,    E:200000, fy:450, wt:0.95,  grade:'G450 gal purlin' },
    { size:'C100 × 50 × 1.6',    d:100, t:1.6,  Z:10800,   I:540000,    E:200000, fy:450, wt:1.56,  grade:'G450 gal purlin' },
    { size:'C100 × 50 × 1.9',    d:100, t:1.9,  Z:15200,   I:760000,    E:200000, fy:450, wt:1.85,  grade:'G450 gal purlin' },
    { size:'C100 × 50 × 2.0',    d:100, t:2.0,  Z:17200,   I:860000,    E:200000, fy:450, wt:1.95,  grade:'G450 gal purlin' },
    { size:'C150 × 50 × 1.9',    d:150, t:1.9,  Z:22000,   I:1650000,   E:200000, fy:450, wt:2.20,  grade:'G450 gal purlin' },
    { size:'C150 × 50 × 2.0',    d:150, t:2.0,  Z:23600,   I:1770000,   E:200000, fy:450, wt:2.31,  grade:'G450 gal purlin' },
    { size:'C150 × 50 × 2.4',    d:150, t:2.4,  Z:38500,   I:2890000,   E:200000, fy:450, wt:2.78,  grade:'G450 gal purlin' },
    { size:'C200 × 60 × 2.0',    d:200, t:2.0,  Z:48000,   I:4800000,   E:200000, fy:450, wt:2.85,  grade:'G450 gal purlin' },
    { size:'C200 × 60 × 2.4',    d:200, t:2.4,  Z:64800,   I:6480000,   E:200000, fy:450, wt:3.42,  grade:'G450 gal purlin' },
    { size:'C200 × 60 × 3.0',    d:200, t:3.0,  Z:81000,   I:8100000,   E:200000, fy:450, wt:4.28,  grade:'G450 gal purlin' },
    { size:'C250 × 65 × 2.4',    d:250, t:2.4,  Z:101000,  I:12600000,  E:200000, fy:450, wt:4.15,  grade:'G450 gal purlin' },
    { size:'C250 × 65 × 3.0',    d:250, t:3.0,  Z:126000,  I:15700000,  E:200000, fy:450, wt:5.18,  grade:'G450 gal purlin' },
    { size:'C300 × 70 × 2.4',    d:300, t:2.4,  Z:151000,  I:22700000,  E:200000, fy:450, wt:5.18,  grade:'G450 gal purlin' },
    { size:'C300 × 70 × 3.0',    d:300, t:3.0,  Z:189000,  I:28350000,  E:200000, fy:450, wt:6.48,  grade:'G450 gal purlin' },
    // RHS purlin options
    { size:'RHS 50 × 25 × 2.0',  d:50,  t:2.0,  Z:5200,    I:130000,    E:200000, fy:450, wt:0.54,  grade:'G450 Duragal RHS' },
    { size:'RHS 65 × 35 × 2.0',  d:65,  t:2.0,  Z:11000,   I:358000,    E:200000, fy:450, wt:0.75,  grade:'G450 Duragal RHS' },
    { size:'RHS 65 × 35 × 2.5',  d:65,  t:2.5,  Z:13800,   I:449000,    E:200000, fy:450, wt:0.94,  grade:'G450 Duragal RHS' },
    { size:'RHS 75 × 50 × 2.0',  d:75,  t:2.0,  Z:18200,   I:683000,    E:200000, fy:450, wt:0.91,  grade:'G450 Duragal RHS' },
    { size:'RHS 75 × 50 × 2.5',  d:75,  t:2.5,  Z:22800,   I:855000,    E:200000, fy:450, wt:1.14,  grade:'G450 Duragal RHS' },
    { size:'RHS 75 × 50 × 3.0',  d:75,  t:3.0,  Z:27100,   I:1020000,   E:200000, fy:450, wt:1.36,  grade:'C250L0 Duragal RHS' },
    { size:'RHS 100 × 50 × 2.0', d:100, t:2.0,  Z:26500,   I:1330000,   E:200000, fy:450, wt:1.15,  grade:'G450 Duragal RHS' },
    { size:'RHS 100 × 50 × 2.5', d:100, t:2.5,  Z:33100,   I:1660000,   E:200000, fy:450, wt:1.43,  grade:'G450 Duragal RHS' },
    { size:'RHS 100 × 50 × 3.0', d:100, t:3.0,  Z:39500,   I:1980000,   E:200000, fy:450, wt:1.98,  grade:'C250L0 Duragal RHS' },
  ]
};

// ── Timber sections ──
export const TIMBER_SECTIONS: SectionDB = {
  posts: [
    { size:'90 × 90 F17',    d:90,  b:90,  t:0, Z:121500,  I:5467500,   E:18000, fy:17,  wt:0.81,  grade:'F17 hardwood' },
    { size:'100 × 100 F17',  d:100, b:100, t:0, Z:166667,  I:8333333,   E:18000, fy:17,  wt:1.00,  grade:'F17 hardwood' },
    { size:'120 × 120 F17',  d:120, b:120, t:0, Z:288000,  I:17280000,  E:18000, fy:17,  wt:1.44,  grade:'F17 hardwood' },
    { size:'150 × 150 F17',  d:150, b:150, t:0, Z:562500,  I:42187500,  E:18000, fy:17,  wt:2.25,  grade:'F17 hardwood' },
  ],
  beams: [
    { size:'150 × 50 F17',   d:150, b:50,  t:0, Z:187500,  I:14062500,  E:18000, fy:17,  wt:0.56,  grade:'F17 hardwood' },
    { size:'200 × 50 F17',   d:200, b:50,  t:0, Z:333333,  I:33333333,  E:18000, fy:17,  wt:0.75,  grade:'F17 hardwood' },
    { size:'240 × 45 F17',   d:240, b:45,  t:0, Z:432000,  I:51840000,  E:18000, fy:17,  wt:0.81,  grade:'F17 hardwood' },
    { size:'200 × 75 F17',   d:200, b:75,  t:0, Z:500000,  I:50000000,  E:18000, fy:17,  wt:1.13,  grade:'F17 hardwood' },
  ],
  rafters: [
    { size:'100 × 50 F5',    d:100, b:50,  t:0, Z:83333,   I:4166667,   E:12000, fy:5,   wt:0.50,  grade:'F5 treated pine' },
    { size:'100 × 50 F17',   d:100, b:50,  t:0, Z:83333,   I:4166667,   E:18000, fy:17,  wt:0.50,  grade:'F17 hardwood' },
    { size:'150 × 50 F5',    d:150, b:50,  t:0, Z:187500,  I:14062500,  E:12000, fy:5,   wt:0.56,  grade:'F5 treated pine' },
    { size:'150 × 50 F17',   d:150, b:50,  t:0, Z:187500,  I:14062500,  E:18000, fy:17,  wt:0.56,  grade:'F17 hardwood' },
    { size:'200 × 50 F17',   d:200, b:50,  t:0, Z:333333,  I:33333333,  E:18000, fy:17,  wt:0.75,  grade:'F17 hardwood' },
  ]
};

// ── Aluminium sections ──
export const ALUMINIUM_SECTIONS: SectionDB = {
  posts: [
    { size:'90 × 90 × 3.0',  d:90,  b:90,  t:3.0, Z:97300,   I:4378000,   E:70000, fy:240, wt:0.44,  grade:'6061-T6 extruded' },
    { size:'100 × 100 × 4.0',d:100, b:100, t:4.0, Z:152000,  I:7600000,   E:70000, fy:240, wt:0.52,  grade:'6061-T6 extruded' },
    { size:'120 × 120 × 4.0',d:120, b:120, t:4.0, Z:262000,  I:15700000,  E:70000, fy:240, wt:0.65,  grade:'6061-T6 extruded' },
    { size:'150 × 150 × 5.0',d:150, b:150, t:5.0, Z:512000,  I:38400000,  E:70000, fy:240, wt:1.01,  grade:'6061-T6 extruded' },
    { size:'150 × 150 × 6.0',d:150, b:150, t:6.0, Z:607500,  I:45560000,  E:70000, fy:240, wt:1.21,  grade:'6061-T6 extruded' },
  ],
  beams: [
    { size:'100 × 50 × 3.0', d:100, b:50,  t:3.0, Z:32300,   I:808000,    E:70000, fy:240, wt:0.24,  grade:'6061-T6 extruded' },
    { size:'125 × 75 × 4.0', d:125, b:75,  t:4.0, Z:70300,   I:2630000,   E:70000, fy:240, wt:0.41,  grade:'6061-T6 extruded' },
    { size:'150 × 100 × 4.0',d:150, b:100, t:4.0, Z:147000,  I:7350000,   E:70000, fy:240, wt:0.54,  grade:'6061-T6 extruded' },
    { size:'200 × 100 × 5.0',d:200, b:100, t:5.0, Z:245000,  I:12250000,  E:70000, fy:240, wt:0.81,  grade:'6061-T6 extruded' },
    { size:'200 × 150 × 6.0',d:200, b:150, t:6.0, Z:450000,  I:33750000,  E:70000, fy:240, wt:1.22,  grade:'6061-T6 extruded' },
  ],
  rafters: [
    { size:'65 × 40 × 2.0',  d:65,  b:40,  t:2.0, Z:17300,   I:346000,    E:70000, fy:240, wt:0.11,  grade:'6061-T6 extruded' },
    { size:'80 × 45 × 2.5',  d:80,  b:45,  t:2.5, Z:27000,   I:607000,    E:70000, fy:240, wt:0.16,  grade:'6061-T6 extruded' },
    { size:'100 × 50 × 3.0', d:100, b:50,  t:3.0, Z:32300,   I:808000,    E:70000, fy:240, wt:0.24,  grade:'6061-T6 extruded' },
    { size:'125 × 65 × 3.5', d:125, b:65,  t:3.5, Z:52800,   I:1715000,   E:70000, fy:240, wt:0.34,  grade:'6061-T6 extruded' },
  ]
};

export function getSectionDB(constructionType: string): SectionDB {
  switch (constructionType) {
    case 'timber': return TIMBER_SECTIONS;
    case 'steel': return STEEL_SECTIONS;
    case 'aluminium': return ALUMINIUM_SECTIONS;
    case 'csection': return CSECTION_SECTIONS;
    default: return CSECTION_SECTIONS;
  }
}
