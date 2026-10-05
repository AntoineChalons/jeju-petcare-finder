import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  addControl: vi.fn(),
  Map: vi.fn(),
  NavigationControl: vi.fn(),
  setWorkerUrl: vi.fn()
}));

vi.mock('maplibre-gl', () => ({
  Map: mocks.Map,
  NavigationControl: mocks.NavigationControl,
  setWorkerUrl: mocks.setWorkerUrl
}));

vi.mock('maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url', () => ({
  default: '/assets/maplibre-worker.js'
}));

import { initMap } from './map-controller.js';

describe('initMap', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.Map.mockImplementation(function () {
      this.addControl = mocks.addControl;
    });
    mocks.NavigationControl.mockImplementation(function () {});
  });

  it('sets the bundled worker URL before creating the map', () => {
    initMap();

    expect(mocks.setWorkerUrl).toHaveBeenCalledExactlyOnceWith(
      '/assets/maplibre-worker.js'
    );
    expect(mocks.setWorkerUrl.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.Map.mock.invocationCallOrder[0]
    );
  });

  it('keeps the Jeju view and navigation controls', () => {
    initMap();

    expect(mocks.Map).toHaveBeenCalledExactlyOnceWith({
      container: 'map',
      style: 'https://tiles.openfreemap.org/styles/positron',
      center: [126.55, 33.35],
      zoom: 9.2,
      attributionControl: true
    });
    expect(mocks.NavigationControl).toHaveBeenCalledExactlyOnceWith({
      showCompass: false
    });
    expect(mocks.addControl).toHaveBeenCalledExactlyOnceWith(
      mocks.NavigationControl.mock.instances[0],
      'top-right'
    );
  });
});
