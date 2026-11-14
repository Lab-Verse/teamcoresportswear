import api from "@/config/api";
import type { DesignDocument, TemplateSpec } from "./contract";
export type Template = {
  id: string;
  name: string;
  product_id: string;
  spec: TemplateSpec;
  status: string;
};
export type Asset = { id: string; width: number; height: number; url?: string };
export type Revision = {
  id: string;
  project_id: string;
  template_id: string;
  document: DesignDocument;
  inquiry_id: string;
  state: string;
  created_at: string;
  content_hash: string;
};
export type Proof = {
  id: string;
  revision_id: string;
  asset_id: string;
  notes: string;
  status: string;
  created_at: string;
};
export type Project = {
  id: string;
  name: string;
  document: DesignDocument;
  version: number;
  updated_at: string;
  revisions?: Revision[];
  proofs?: Proof[];
  templates?: Template[];
  events?: { id: string; kind: string; note: string; created_at: string }[];
};
const withImages = (t: Template): Template => ({
  ...t,
  spec: {
    ...t.spec,
    images: Object.fromEntries(
      Object.keys(t.spec.images).map((side) => [
        side,
        `${api.defaults.baseURL}/design-studio/templates/${t.id}/images/${side}`,
      ]),
    ),
  },
});
export const studioApi = {
  templates: () =>
    api
      .get<Template[]>("/design-studio/templates")
      .then((r) => r.data.map(withImages)),
  list: () => api.get<Project[]>("/design-studio/projects").then((r) => r.data),
  detail: (id: string) =>
    api
      .get<Project>(`/design-studio/projects/${id}`)
      .then((r) => ({
        ...r.data,
        templates: r.data.templates?.map(withImages),
      })),
  save: (
    id: string | undefined,
    name: string,
    document: DesignDocument,
    version: number,
  ) =>
    (id
      ? api.patch<Project>(`/design-studio/projects/${id}`, {
          name,
          document,
          version,
        })
      : api.post<Project>("/design-studio/projects", {
          name,
          document,
          version,
        })
    ).then((r) => r.data),
  upload: (file: File) => {
    const body = new FormData();
    body.append("file", file);
    return api
      .post<Asset>("/design-studio/assets", body, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((r) => r.data);
  },
  asset: (id: string) =>
    api
      .get<Blob>(`/design-studio/assets/${id}`, { responseType: "blob" })
      .then((r) => r.data),
  submit: (id: string, payload: unknown) =>
    api
      .post<Revision>(`/design-studio/projects/${id}/submit`, payload)
      .then((r) => r.data),
  decide: (id: string, decision: string, notes: string) =>
    api.post(`/design-studio/proofs/${id}/decision`, { decision, notes }),
};
export function message(error: unknown) {
  const e = error as {
    response?: { data?: { message?: string | string[]; details?: string[] } };
    message?: string;
  };
  const value = e.response?.data?.details || e.response?.data?.message;
  return Array.isArray(value)
    ? value.join(" ")
    : value ||
        e.message ||
        "Something went wrong. Your design is still here; please retry.";
}
