

## Dataset Explorer Redesign

### What changes

The page becomes a clean video viewer with bounding box overlays. No sidebar panels.

### Layout

```text
┌─────────────────────────────────────────────────┐
│  Dataset Explorer 🔬         [Demo] [Raw/WNet]  │
│  Browse AI detection results...                  │
├─────────────────────────────────────────────────┤
│  📦 [Dataset ▼]  📍 Location  📅 Date  ⏱ Dur   │
├─────────────────────────────────────────────────┤
│                                                  │
│           Video Frame (full width)               │
│     Bounding boxes (labels hidden by default)    │
│     Hover on box → shows species + confidence    │
│                                                  │
├─────────────────────────────────────────────────┤
│  ▶ ║  ━━━━━━━●━━━━━━━━━━  00:12 / 01:30  1x ▼  │
└─────────────────────────────────────────────────┘
```

### Steps

1. **Remove sidebar panels** -- Delete TelemetryPanel, TaxonomyPanel, SpeciesHUD from the page. The frame viewer goes full-width (no grid layout).

2. **Redesign bounding boxes** -- Bounding boxes show only a colored border by default. On hover, a tooltip appears with species name and confidence percentage. No permanent labels cluttering the frame.

3. **Add video player controls** -- Replace the dot-based frame progress with a proper control bar:
   - Play/Pause button
   - Seek bar (slider showing current frame position)
   - Time/frame counter
   - Speed control dropdown (0.5x, 1x, 2x)
   - The existing Demo Mode toggle becomes the play button

4. **Update DatasetFrameView component** -- Accept new props for play/pause, seek, and speed. Manage hover state per detection for tooltip display.

5. **Update LiveMonitor page** -- Remove sidebar grid, wire up video controls, remove SpeciesHUD import.

### Technical details

- Hover tooltip: local state `hoveredDetectionIdx` in DatasetFrameView, conditionally render label div
- Seek bar: HTML range input or custom slider mapped to `currentFrameIdx`
- Speed control: `playbackSpeed` state controlling the `setInterval` delay (2000ms / speed)
- The Raw/WaterNet toggle stays in the header as-is

