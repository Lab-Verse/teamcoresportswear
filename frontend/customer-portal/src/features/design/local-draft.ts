import type { Asset } from "./api";
import type { DesignDocument } from "./contract";
export type LocalDraft = {
  name: string;
  document: DesignDocument;
  assets: Record<string, Asset>;
  id?: string;
  version: number;
  owner?: string;
  step: number;
};
function open() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const r = indexedDB.open("teamcore-design-studio", 1);
    r.onupgradeneeded = () => {
      r.result.createObjectStore("drafts");
      r.result.createObjectStore("artwork");
    };
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
}
async function transaction<T>(
  store: string,
  mode: IDBTransactionMode,
  action: (s: IDBObjectStore) => IDBRequest<T>,
) {
  const db = await open();
  return new Promise<T>((resolve, reject) => {
    const tx = db.transaction(store, mode);
    const req = action(tx.objectStore(store));
    let result: T;
    req.onsuccess = () => {
      result = req.result;
    };
    tx.oncomplete = () => {
      db.close();
      resolve(result);
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
    tx.onabort = () => {
      db.close();
      reject(tx.error);
    };
  });
}
export const localDraft = {
  read: (key: string) =>
    transaction<LocalDraft | undefined>("drafts", "readonly", (s) =>
      s.get(key),
    ),
  save: (key: string, value: LocalDraft) =>
    transaction("drafts", "readwrite", (s) => s.put(value, key)),
  remove: (key: string) =>
    transaction("drafts", "readwrite", (s) => s.delete(key)),
  putFile: (id: string, file: Blob) =>
    transaction("artwork", "readwrite", (s) => s.put(file, id)),
  file: (id: string) =>
    transaction<Blob | undefined>("artwork", "readonly", (s) => s.get(id)),
};
