/** Lightweight module-level store for BE mesh IDs. */
type MeshStoreState = {
  geometryId: string | null;
  meshId: string | null;
};

let _state: MeshStoreState = {
  geometryId: null,
  meshId: null,
};

export const meshStore = {
  setGeometryId(id: string) {
    _state.geometryId = id;
  },
  setMeshId(id: string) {
    _state.meshId = id;
  },
  getGeometryId(): string | null {
    return _state.geometryId;
  },
  getMeshId(): string | null {
    return _state.meshId;
  },
  clear() {
    _state = { geometryId: null, meshId: null };
  },
};
