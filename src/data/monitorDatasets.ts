import { MonitorSpecies } from "@/data/marineData";

export interface DatasetFrame {
  id: number;
  timestamp: string;
  detections: {
    speciesId: string;
    name: string;
    commonName: string;
    icon: string;
    confidence: number;
    boundingBox: { x: number; y: number; w: number; h: number };
  }[];
  frameStats: {
    fps: number;
    inferenceMs: number;
    vram: number;
  };
}

export interface Dataset {
  id: string;
  name: string;
  location: string;
  date: string;
  totalFrames: number;
  duration: string;
  depth: string;
  frames: DatasetFrame[];
  videoUrl?: string;
}

export const sampleDatasets: Dataset[] = [
  {
    id: "ds-001",
    name: "Fujairah Reef Survey — Feb 2026",
    location: "Fujairah Coast, UAE",
    date: "2026-02-15",
    totalFrames: 8,
    duration: "4 min 32 sec",
    depth: "8–15m",
    frames: [
      {
        id: 1, timestamp: "00:00:12",
        detections: [
          { speciesId: "5", name: "Lutjanus argentimaculatus", commonName: "Mangrove Jack", icon: "🔴", confidence: 92, boundingBox: { x: 30, y: 25, w: 22, h: 18 } },
          { speciesId: "1", name: "Siganus canaliculatus", commonName: "Rabbitfish", icon: "🐟", confidence: 87, boundingBox: { x: 60, y: 55, w: 15, h: 12 } },
        ],
        frameStats: { fps: 20.1, inferenceMs: 49, vram: 2.41 },
      },
      {
        id: 2, timestamp: "00:00:34",
        detections: [
          { speciesId: "3", name: "Scarus ghobban", commonName: "Parrotfish", icon: "🦜", confidence: 95, boundingBox: { x: 40, y: 35, w: 20, h: 16 } },
        ],
        frameStats: { fps: 19.8, inferenceMs: 51, vram: 2.38 },
      },
      {
        id: 3, timestamp: "00:01:02",
        detections: [
          { speciesId: "8", name: "Pomacanthus asfur", commonName: "Arabian Angelfish", icon: "💜", confidence: 88, boundingBox: { x: 20, y: 40, w: 18, h: 14 } },
          { speciesId: "2", name: "Rastrelliger kanagurta", commonName: "Indian Mackerel", icon: "🐠", confidence: 76, boundingBox: { x: 55, y: 20, w: 25, h: 10 } },
          { speciesId: "12", name: "Acanthurus sohal", commonName: "Sohal Surgeonfish", icon: "🔷", confidence: 71, boundingBox: { x: 70, y: 65, w: 14, h: 12 } },
        ],
        frameStats: { fps: 18.5, inferenceMs: 54, vram: 2.52 },
      },
      {
        id: 4, timestamp: "00:01:45",
        detections: [
          { speciesId: "13", name: "Stegostoma tigrinum", commonName: "Zebra Shark", icon: "🦈", confidence: 82, boundingBox: { x: 15, y: 50, w: 35, h: 20 } },
        ],
        frameStats: { fps: 19.2, inferenceMs: 52, vram: 2.45 },
      },
      {
        id: 5, timestamp: "00:02:18",
        detections: [
          { speciesId: "6", name: "Epinephelus coioides", commonName: "Orangespotted Grouper", icon: "🟠", confidence: 90, boundingBox: { x: 45, y: 45, w: 20, h: 18 } },
          { speciesId: "4", name: "Lethrinus nebulosus", commonName: "Spangled Emperor", icon: "👑", confidence: 84, boundingBox: { x: 10, y: 30, w: 16, h: 14 } },
        ],
        frameStats: { fps: 20.4, inferenceMs: 48, vram: 2.39 },
      },
      {
        id: 6, timestamp: "00:02:55",
        detections: [
          { speciesId: "9", name: "Scomberomorus commerson", commonName: "Narrow-barred Mackerel", icon: "🌿", confidence: 79, boundingBox: { x: 25, y: 15, w: 30, h: 12 } },
          { speciesId: "10", name: "Caranx sexfasciatus", commonName: "Bigeye Trevally", icon: "🔵", confidence: 86, boundingBox: { x: 60, y: 40, w: 18, h: 14 } },
        ],
        frameStats: { fps: 19.6, inferenceMs: 50, vram: 2.43 },
      },
      {
        id: 7, timestamp: "00:03:30",
        detections: [
          { speciesId: "11", name: "Platax teira", commonName: "Longfin Batfish", icon: "🦇", confidence: 93, boundingBox: { x: 35, y: 30, w: 22, h: 20 } },
          { speciesId: "7", name: "Cephalopholis hemistiktos", commonName: "Yellowfin Hind", icon: "🟡", confidence: 81, boundingBox: { x: 65, y: 60, w: 16, h: 14 } },
        ],
        frameStats: { fps: 20.0, inferenceMs: 49, vram: 2.40 },
      },
      {
        id: 8, timestamp: "00:04:10",
        detections: [
          { speciesId: "1", name: "Siganus canaliculatus", commonName: "Rabbitfish", icon: "🐟", confidence: 94, boundingBox: { x: 20, y: 45, w: 18, h: 14 } },
          { speciesId: "3", name: "Scarus ghobban", commonName: "Parrotfish", icon: "🦜", confidence: 89, boundingBox: { x: 50, y: 25, w: 20, h: 16 } },
          { speciesId: "8", name: "Pomacanthus asfur", commonName: "Arabian Angelfish", icon: "💜", confidence: 91, boundingBox: { x: 75, y: 50, w: 15, h: 13 } },
        ],
        frameStats: { fps: 19.9, inferenceMs: 50, vram: 2.42 },
      },
    ],
  },
  {
    id: "ds-002",
    name: "Khor Fakkan Reef — Jan 2026",
    location: "Khor Fakkan, UAE",
    date: "2026-01-20",
    totalFrames: 5,
    duration: "2 min 48 sec",
    depth: "5–12m",
    frames: [
      {
        id: 1, timestamp: "00:00:08",
        detections: [
          { speciesId: "2", name: "Rastrelliger kanagurta", commonName: "Indian Mackerel", icon: "🐠", confidence: 91, boundingBox: { x: 35, y: 20, w: 22, h: 10 } },
        ],
        frameStats: { fps: 21.0, inferenceMs: 47, vram: 2.35 },
      },
      {
        id: 2, timestamp: "00:00:42",
        detections: [
          { speciesId: "1", name: "Siganus canaliculatus", commonName: "Rabbitfish", icon: "🐟", confidence: 85, boundingBox: { x: 45, y: 50, w: 16, h: 14 } },
          { speciesId: "12", name: "Acanthurus sohal", commonName: "Sohal Surgeonfish", icon: "🔷", confidence: 78, boundingBox: { x: 15, y: 35, w: 14, h: 12 } },
        ],
        frameStats: { fps: 20.5, inferenceMs: 48, vram: 2.37 },
      },
      {
        id: 3, timestamp: "00:01:15",
        detections: [
          { speciesId: "6", name: "Epinephelus coioides", commonName: "Orangespotted Grouper", icon: "🟠", confidence: 88, boundingBox: { x: 50, y: 45, w: 20, h: 18 } },
        ],
        frameStats: { fps: 19.7, inferenceMs: 51, vram: 2.44 },
      },
      {
        id: 4, timestamp: "00:01:58",
        detections: [
          { speciesId: "10", name: "Caranx sexfasciatus", commonName: "Bigeye Trevally", icon: "🔵", confidence: 83, boundingBox: { x: 30, y: 30, w: 24, h: 14 } },
          { speciesId: "9", name: "Scomberomorus commerson", commonName: "Narrow-barred Mackerel", icon: "🌿", confidence: 74, boundingBox: { x: 65, y: 55, w: 20, h: 10 } },
        ],
        frameStats: { fps: 20.2, inferenceMs: 49, vram: 2.40 },
      },
      {
        id: 5, timestamp: "00:02:35",
        detections: [
          { speciesId: "3", name: "Scarus ghobban", commonName: "Parrotfish", icon: "🦜", confidence: 96, boundingBox: { x: 40, y: 40, w: 18, h: 16 } },
        ],
        frameStats: { fps: 20.8, inferenceMs: 47, vram: 2.36 },
      },
    ],
  },
];
