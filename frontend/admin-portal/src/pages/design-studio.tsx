import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import api from '@/config/api'
import { productsApi } from '@/services/api'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import type { TemplateSpec, Side } from '../../../../backend/src/modules/design-studio/design-contract'
type Template = { id: string; name: string; status: string; product_id: string; spec: TemplateSpec }
type Project = {
  id: string
  name: string
  updated_at: string
  document: unknown
  assets: { id: string; width: number; height: number }[]
  revisions: { id: string; state: string; inquiry_id: string; created_at: string; document: unknown }[]
  proofs: { id: string; revision_id: string; asset_id: string; status: string; notes: string }[]
  events: { id: string; kind: string; note: string; created_at: string }[]
}
const defaultSpec: TemplateSpec = {
  fabric: '',
  fit: '',
  neckline: '',
  sizeGuide: '',
  colours: ['#ffffff'],
  methods: ['Print'],
  patterns: ['plain'],
  sizes: [],
  zones: [
    {
      id: 'front',
      label: 'Front',
      side: 'front',
      width: 250,
      height: 300,
      x: 207,
      y: 205,
      previewWidth: 186,
      previewHeight: 223,
    },
    {
      id: 'back',
      label: 'Back',
      side: 'back',
      width: 250,
      height: 300,
      x: 207,
      y: 180,
      previewWidth: 186,
      previewHeight: 223,
    },
  ],
  images: {},
  minimumQuantity: 10,
  increment: 1,
  minimumDpi: 150,
  fulfilment: 'stock',
  productionNotes: '',
  sampleApproved: false,
}
const field = 'w-full border rounded px-3 py-2 bg-background min-h-11'
function errorText(e: unknown) {
  const x = e as { response?: { data?: { message?: string | string[]; details?: string[] } }; message?: string }
  return [x.response?.data?.details || x.response?.data?.message || x.message || 'Request failed'].flat().join(' ')
}
export default function DesignStudioAdmin() {
  const [tab, setTab] = useState<'requests' | 'templates'>('requests')
  const [selected, setSelected] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')
  const templates = useQuery({
    queryKey: ['studio-admin-templates'],
    queryFn: () => api.get<Template[]>('/design-studio/admin/templates').then((r) => r.data),
  })
  const projects = useQuery({
    queryKey: ['studio-admin-projects'],
    queryFn: () => api.get<Project[]>('/design-studio/projects').then((r) => r.data),
  })
  const detail = useQuery({
    queryKey: ['studio-admin-project', selected],
    queryFn: () => api.get<Project>(`/design-studio/projects/${selected}`).then((r) => r.data),
    enabled: !!selected,
  })
  const [name, setName] = useState('')
  const [productId, setProductId] = useState('')
  const [spec, setSpec] = useState<TemplateSpec>(structuredClone(defaultSpec))
  const [search, setSearch] = useState('')
  const products = useQuery({
    queryKey: ['studio-products', search],
    queryFn: () => productsApi.list({ page: 1, limit: 50, search }),
  })
  const variants = useQuery({
    queryKey: ['studio-variants', productId],
    queryFn: () => productsApi.getVariants(productId),
    enabled: !!productId,
  })
  const mail = useQuery({
    queryKey: ['studio-admin-mail'],
    queryFn: () =>
      api
        .get<{ id: string; title: string; attempts: number; next_attempt_at: string }[]>('/design-studio/admin/mail')
        .then((r) => r.data),
  })
  const [revision, setRevision] = useState('')
  const [notes, setNotes] = useState('')
  const [capacity, setCapacity] = useState('')
  const [proofFile, setProofFile] = useState<File | null>(null)
  async function action(work: () => Promise<unknown>, success: string) {
    setBusy(true)
    setError('')
    setNotice('')
    try {
      await work()
      setNotice(success)
      await Promise.all([
        templates.refetch(),
        projects.refetch(),
        mail.refetch(),
        selected ? detail.refetch() : Promise.resolve(),
      ])
    } catch (e) {
      setError(errorText(e))
    } finally {
      setBusy(false)
    }
  }
  async function proof() {
    if (!proofFile || !revision) throw new Error('Choose a revision and proof image.')
    const body = new FormData()
    body.append('file', proofFile)
    const a = await api.post<{ id: string }>('/design-studio/assets', body, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    await api.post(`/design-studio/admin/revisions/${revision}/proofs`, {
      assetId: a.data.id,
      notes,
      capacityNotes: capacity,
    })
  }
  async function openFile(path: string, name: string) {
    const r = await api.get(path, { responseType: 'blob' })
    const url = URL.createObjectURL(r.data)
    const a = document.createElement('a')
    a.href = url
    a.download = name
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 2000)
  }
  async function garment(side: Side, file?: File) {
    if (!file) return
    await action(async () => {
      const form = new FormData()
      form.append('file', file)
      const r = await api.post<{ url: string }>('/upload/image?folder=products', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      const path = new URL(r.data.url, window.location.origin).pathname
      setSpec((s) => ({ ...s, images: { ...s.images, [side]: path } }))
    }, 'Garment view uploaded.')
  }
  return (
    <div className="space-y-6">
      <PageHeader
        title="TEAM CORE Design Studio"
        description="Templates, customer artwork, production proofs and release decisions."
      />
      <div className="flex gap-3">
        <Button variant={tab === 'requests' ? 'default' : 'outline'} onClick={() => setTab('requests')}>
          Design requests
        </Button>
        <Button variant={tab === 'templates' ? 'default' : 'outline'} onClick={() => setTab('templates')}>
          Garment templates
        </Button>
      </div>
      {error && (
        <p role="alert" className="border border-red-300 bg-red-50 text-red-900 p-4">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="border p-4">
          {notice}
        </p>
      )}
      {tab === 'requests' ? (
        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <aside className="space-y-3">
            {projects.isPending ? (
              <p>Loading designs…</p>
            ) : projects.isError ? (
              <Button onClick={() => projects.refetch()}>Retry</Button>
            ) : projects.data?.length ? (
              projects.data.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    setSelected(p.id)
                    setRevision('')
                  }}
                  className={'block w-full text-left border rounded p-4 ' + (selected === p.id ? 'bg-muted' : '')}
                >
                  <strong>{p.name}</strong>
                  <small className="block mt-2">{new Date(p.updated_at).toLocaleDateString()}</small>
                </button>
              ))
            ) : (
              <p>No saved designs yet.</p>
            )}
          </aside>
          <section className="space-y-5">
            {detail.isFetching ? (
              <p>Loading design…</p>
            ) : detail.isError ? (
              <p>
                Unable to load design. <Button onClick={() => detail.refetch()}>Retry</Button>
              </p>
            ) : detail.data ? (
              <>
                <h2 className="text-2xl font-bold">{detail.data.name}</h2>
                <p className="text-sm text-muted-foreground">
                  Customer edits remain a separate working copy. Proofs and quotations refer to the submitted revision.
                </p>
                {detail.data.revisions.map((r) => (
                  <article className="border rounded p-5 space-y-3" key={r.id}>
                    <h3 className="font-semibold">
                      {r.state.replace(/_/g, ' ')} · {new Date(r.created_at).toLocaleString()}
                    </h3>
                    <p className="text-xs break-all">Revision {r.id}</p>
                    <div className="flex gap-2 flex-wrap">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setRevision(r.id)
                          setNotes('')
                          setCapacity('')
                        }}
                      >
                        Review this revision
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() =>
                          void action(
                            () => openFile(`/design-studio/revisions/${r.id}/specification`, `TEAM CORE-${r.id}.json`),
                            'Specification downloaded.',
                          )
                        }
                      >
                        Specification
                      </Button>
                      {(['front', 'back'] as const).map((side) => (
                        <Button
                          key={side}
                          variant="outline"
                          onClick={() =>
                            void action(
                              () =>
                                openFile(
                                  `/design-studio/revisions/${r.id}/preview/${side}`,
                                  `TEAM CORE-${side}-${r.id}.svg`,
                                ),
                              'Private preview downloaded.',
                            )
                          }
                        >
                          {side} preview
                        </Button>
                      ))}
                      <Link to="/wholesale" className="underline p-2">
                        Quotation requests
                      </Link>
                      <Button
                        disabled={busy || r.state !== 'ordered'}
                        onClick={() =>
                          void action(
                            () => api.post(`/design-studio/admin/revisions/${r.id}/release`),
                            'Production released.',
                          )
                        }
                      >
                        Release production
                      </Button>
                    </div>
                    <p className="text-xs">
                      Production requires the current approved proof, matching accepted quotation, confirmed capacity
                      and recorded payment.
                    </p>
                    {detail
                      .data!.proofs.filter((p) => p.revision_id === r.id)
                      .map((p) => (
                        <div className="border-t pt-3" key={p.id}>
                          <strong>Proof: {p.status}</strong>
                          <p className="whitespace-pre-wrap text-sm">{p.notes}</p>
                          <Button
                            variant="link"
                            onClick={() =>
                              void action(
                                () => openFile(`/design-studio/assets/${p.asset_id}`, `proof-${p.id}.png`),
                                'Proof downloaded.',
                              )
                            }
                          >
                            Download proof
                          </Button>
                        </div>
                      ))}
                  </article>
                ))}
                {revision && (
                  <form
                    className="border rounded p-5 space-y-4"
                    onSubmit={(e) => {
                      e.preventDefault()
                      void action(proof, 'Proof sent for customer approval.')
                    }}
                  >
                    <h3 className="font-semibold">Send a production proof</h3>
                    <label className="block">
                      Proof image (PNG, JPEG or WebP)
                      <input
                        required
                        className={field}
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                      />
                    </label>
                    <label className="block">
                      Customer-facing proof notes
                      <textarea
                        required
                        minLength={5}
                        maxLength={3000}
                        className={field}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                      />
                    </label>
                    <label className="block">
                      Confirmed material, capacity and lead time
                      <textarea
                        required
                        minLength={5}
                        maxLength={3000}
                        className={field}
                        value={capacity}
                        onChange={(e) => setCapacity(e.target.value)}
                      />
                    </label>
                    <p className="text-sm">
                      A replacement proof supersedes previous approval and open quotations. Include every side, size and
                      personalization detail in the proof.
                    </p>
                    <div className="flex gap-3">
                      <Button type="submit" disabled={busy}>
                        Send proof
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        disabled={busy || notes.length < 5}
                        onClick={() =>
                          void action(
                            () => api.post(`/design-studio/admin/revisions/${revision}/changes`, { notes }),
                            'Changes requested.',
                          )
                        }
                      >
                        Request customer changes
                      </Button>
                    </div>
                  </form>
                )}
                <h3 className="font-semibold">Original artwork</h3>
                {detail.data.assets.map((a) => (
                  <Button
                    key={a.id}
                    variant="outline"
                    onClick={() =>
                      void openFile(`/design-studio/assets/${a.id}?original=true`, `${a.id}.original`).catch((e) =>
                        setError(errorText(e)),
                      )
                    }
                  >
                    Download original · {a.width} × {a.height}
                  </Button>
                ))}
                {detail.data.events.map((e) => (
                  <p className="text-sm border-l-2 pl-4" key={e.id}>
                    <strong>{e.kind.replace(/_/g, ' ')}</strong> · {new Date(e.created_at).toLocaleString()}
                    <span className="block whitespace-pre-wrap">{e.note}</span>
                  </p>
                ))}
              </>
            ) : (
              <p>Select a design to review its history and proofs.</p>
            )}
          </section>
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            {templates.data?.map((t) => (
              <article className="border rounded p-5 space-y-3" key={t.id}>
                <h3 className="font-semibold">{t.name}</h3>
                <p>
                  {t.status} · {t.spec.fulfilment.replace(/_/g, ' ')}
                </p>
                <div className="flex gap-2 flex-wrap">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setName(t.name + ' — new version')
                      setProductId(t.product_id)
                      setSpec({ ...structuredClone(t.spec), sampleApproved: false })
                    }}
                  >
                    Copy as new version
                  </Button>
                  {t.status === 'draft' && (
                    <Button
                      disabled={busy}
                      onClick={() =>
                        void action(
                          () => api.post(`/design-studio/admin/templates/${t.id}/publish`),
                          'Template published.',
                        )
                      }
                    >
                      Publish
                    </Button>
                  )}
                  {t.status === 'published' && (
                    <Button
                      variant="outline"
                      disabled={busy}
                      onClick={() =>
                        void action(
                          () => api.post(`/design-studio/admin/templates/${t.id}/retire`),
                          'Template retired. Existing records retained.',
                        )
                      }
                    >
                      Retire
                    </Button>
                  )}
                </div>
              </article>
            ))}
          </div>
          <form
            className="border rounded p-6 space-y-5"
            onSubmit={(e) => {
              e.preventDefault()
              void action(
                () =>
                  api.post('/design-studio/admin/templates', {
                    name,
                    productId,
                    spec: {
                      ...spec,
                      colours: spec.colours.map((c) => c.trim()),
                      methods: spec.methods.map((m) => m.trim()),
                    },
                  }),
                'New immutable template version saved as a draft.',
              )
            }}
          >
            <h2 className="text-xl font-bold">Prepare a garment template</h2>
            <p className="text-sm text-muted-foreground">
              Starter measurements below are configuration placeholders. Replace them with actual factory dimensions and
              aligned 600 × 650 transparent garment images. Production templates need physical sample approval; design briefs accept quotation requests only.
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              <label>
                Template name
                <input
                  required
                  className={field}
                  maxLength={120}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </label>
              <label>
                Find product
                <input
                  className={field}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search TEAM CORE products"
                />
              </label>
              <label>
                Catalogue product
                <select
                  required
                  className={field}
                  value={productId}
                  onChange={(e) => {
                    setProductId(e.target.value)
                    setSpec((s) => ({ ...s, sizes: [] }))
                  }}
                >
                  <option value="">Choose a product</option>
                  {products.data?.data.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Fulfilment
                <select
                  className={field}
                  value={spec.fulfilment}
                  onChange={(e) =>
                    setSpec({ ...spec, fulfilment: e.target.value as TemplateSpec['fulfilment'], patterns: ['plain'] })
                  }
                >
                  <option value="stock">Decorate stocked blanks</option>
                  <option value="made_to_order">Manufacture to order</option>
                </select>
              </label>
              <label>Garment silhouette<select className={field} value={spec.garment || 'tee'} onChange={e=>setSpec({...spec,garment:e.target.value as TemplateSpec['garment']})}>{['tee','polo','hoodie','long-sleeve','jersey','shorts'].map(kind=><option key={kind} value={kind}>{kind}</option>)}</select></label>
              {(['fabric', 'fit', 'neckline', 'sizeGuide', 'productionNotes'] as const).map((k) => (
                <label key={k}>
                  {k}
                  <textarea
                    className={field}
                    value={spec[k]}
                    required
                    maxLength={2000}
                    onChange={(e) => setSpec({ ...spec, [k]: e.target.value })}
                  />
                </label>
              ))}
              <label>
                Methods (comma separated)
                <input
                  className={field}
                  value={spec.methods.join(',')}
                  onChange={(e) => setSpec({ ...spec, methods: e.target.value.split(',') })}
                />
              </label>
              <label>
                Colour hex values (comma separated)
                <input
                  className={field}
                  value={spec.colours.join(',')}
                  onChange={(e) => setSpec({ ...spec, colours: e.target.value.split(',') })}
                />
              </label>
              {(['minimumQuantity', 'increment', 'minimumDpi'] as const).map((k) => (
                <label key={k}>
                  {k}
                  <input
                    type="number"
                    min={1}
                    required
                    className={field}
                    value={spec[k]}
                    onChange={(e) => setSpec({ ...spec, [k]: Number(e.target.value) })}
                  />
                </label>
              ))}
            </div>
            {spec.fulfilment === 'made_to_order' && (
              <label className="flex gap-3">
                <input
                  type="checkbox"
                  checked={spec.patterns.length > 1}
                  onChange={(e) =>
                    setSpec({ ...spec, patterns: e.target.checked ? ['plain', 'stripe', 'chevron','diagonal','hoops','split','dots'] : ['plain'] })
                  }
                />{' '}
                Supports panel patterns shown in the studio
              </label>
            )}
            <h3 className="font-semibold">Map each colour and size to its real SKU</h3>
            {spec.sizes.map((s, i) => (
              <div className="grid gap-2 md:grid-cols-4" key={i}>
                <input
                  aria-label="Size label"
                  className={field}
                  value={s.label}
                  onChange={(e) =>
                    setSpec({
                      ...spec,
                      sizes: spec.sizes.map((x, j) => (i === j ? { ...x, label: e.target.value } : x)),
                    })
                  }
                />
                <select
                  aria-label="Variant colour"
                  className={field}
                  value={s.colour}
                  onChange={(e) =>
                    setSpec({
                      ...spec,
                      sizes: spec.sizes.map((x, j) => (i === j ? { ...x, colour: e.target.value } : x)),
                    })
                  }
                >
                  {spec.colours.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
                <select
                  aria-label="Variant SKU"
                  required
                  className={field}
                  value={s.variantId}
                  onChange={(e) =>
                    setSpec({
                      ...spec,
                      sizes: spec.sizes.map((x, j) => (i === j ? { ...x, variantId: e.target.value } : x)),
                    })
                  }
                >
                  <option value="">Choose SKU</option>
                  {variants.data?.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.sku}
                    </option>
                  ))}
                </select>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSpec({ ...spec, sizes: spec.sizes.filter((_, j) => j !== i) })}
                >
                  Remove size
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                setSpec({ ...spec, sizes: [...spec.sizes, { label: '', colour: spec.colours[0], variantId: '' }] })
              }
            >
              Add size mapping
            </Button>
            <h3 className="font-semibold">Print areas and aligned garment views</h3>
            {spec.zones.map((z, i) => (
              <fieldset className="border rounded p-4 grid gap-3 md:grid-cols-4" key={z.id}>
                <legend>{z.label}</legend>
                {(['width', 'height', 'x', 'y', 'previewWidth', 'previewHeight'] as const).map((k) => (
                  <label key={k}>
                    {k} {['width', 'height'].includes(k) ? '(mm)' : '(view units)'}
                    <input
                      type="number"
                      required
                      className={field}
                      value={z[k]}
                      onChange={(e) =>
                        setSpec({
                          ...spec,
                          zones: spec.zones.map((x, j) => (i === j ? { ...x, [k]: Number(e.target.value) } : x)),
                        })
                      }
                    />
                  </label>
                ))}
                <label>
                  Aligned {z.side} image
                  <input
                    type="file"
                    className={field}
                    accept="image/png,image/jpeg,image/webp"
                    onChange={(e) => void garment(z.side, e.target.files?.[0])}
                  />
                  <small>{spec.images[z.side] ? 'Uploaded' : 'Required before publishing'}</small>
                </label>
              </fieldset>
            ))}
            <div className="flex gap-3">
              {(['left', 'right'] as Side[])
                .filter((side) => !spec.zones.some((z) => z.side === side))
                .map((side) => (
                  <Button
                    type="button"
                    variant="outline"
                    key={side}
                    onClick={() =>
                      setSpec({
                        ...spec,
                        zones: [
                          ...spec.zones,
                          {
                            id: side,
                            label: side + ' sleeve',
                            side,
                            width: 80,
                            height: 80,
                            x: 260,
                            y: 260,
                            previewWidth: 80,
                            previewHeight: 80,
                          },
                        ],
                      })
                    }
                  >
                    Add {side} sleeve
                  </Button>
                ))}
            </div>
            <label className="flex gap-3">
              Publication mode
              <select value={spec.publicationMode || 'production'} onChange={(e) => setSpec({ ...spec, publicationMode: e.target.value as 'production' | 'design_brief', sampleApproved: false })}>
                <option value="production">Sample-approved production template</option>
                <option value="design_brief">Design brief — quote-only, made-to-order</option>
              </select>
            </label>
            <label className="flex gap-3">
              <input
                type="checkbox"
                checked={spec.sampleApproved}
                onChange={(e) => setSpec({ ...spec, sampleApproved: e.target.checked })}
              />{' '}
              TEAM CORE has checked the garment views, measurements, size policy and physical production sample.
            </label>
            <Button disabled={busy} type="submit">
              Save template version as draft
            </Button>
          </form>
        </>
      )}
      <details className="border rounded p-5">
        <summary>Notification delivery queue ({mail.data?.length || 0})</summary>
        {mail.isError && <p>Unable to load delivery status.</p>}
        {mail.data?.map((j) => (
          <div className="flex flex-wrap gap-3 items-center border-t py-3" key={j.id}>
            <span>
              {j.title} · {j.attempts >= 8 ? 'Needs attention' : 'Retry scheduled'} · {j.attempts} attempts
            </span>
            <Button
              variant="outline"
              disabled={busy}
              onClick={() =>
                void action(() => api.post(`/design-studio/admin/mail/${j.id}/retry`), 'Email queued for retry.')
              }
            >
              Retry delivery
            </Button>
          </div>
        ))}
      </details>
    </div>
  )
}
