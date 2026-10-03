"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition, Children } from "react";
import {
  Plus,
  Pencil,
  Power,
  Loader2,
  X,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Category, Executor, Region } from "@/lib/db-types";
import Pagination from "@/components/ui/Pagination";
import {
  saveCategoryAction,
  toggleCategoryAction,
  saveExecutorAction,
  toggleExecutorAction,
  saveRegionAction,
  toggleRegionAction,
  type ActionResult,
} from "@/app/admin/actions";

const PAGE_SIZE = 10;

interface Props {
  categories: Category[];
  executors: Executor[];
  regions?: Region[];
}

type Entity = "category" | "executor" | "region";

type ModalState =
  | { entity: "category"; item?: Category }
  | { entity: "executor"; item?: Executor }
  | { entity: "region"; item?: Region }
  | null;

/**
 * Panel admin: data master (FR-18) — kategori, pelaksana, & wilayah.
 * Tiap entitas di-list dengan tombol tambah/edit dan toggle aktif.
 */
export default function AdminMaster({ categories, executors, regions = [] }: Props) {
  const router = useRouter();
  const [modal, setModal] = useState<ModalState>(null);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [pending, startTransition] = useTransition();
  const [pageCat, setPageCat] = useState(1);
  const [pageExec, setPageExec] = useState(1);
  const [pageReg, setPageReg] = useState(1);

  const activeCategories = useMemo(
    () => categories.filter((c) => c.is_active),
    [categories]
  );

  const open = (m: ModalState) => {
    setError(null);
    setModal(m);
  };
  const close = () => {
    if (pending) return;
    setModal(null);
    setError(null);
  };

  function submit(formData: FormData) {
    startTransition(async () => {
      if (!modal) return;
      setError(null);
      let result: ActionResult;

      if (modal.entity === "category") {
        result = await saveCategoryAction({
          id: modal.item?.id,
          slug: String(formData.get("slug") || ""),
          name: String(formData.get("name") || ""),
          icon: String(formData.get("icon") || ""),
          description: String(formData.get("description") || "") || undefined,
          color: String(formData.get("color") || "") || undefined,
          isActive: true,
        });
      } else if (modal.entity === "executor") {
        result = await saveExecutorAction({
          id: modal.item?.id,
          name: String(formData.get("name") || ""),
          categoryId: String(formData.get("categoryId") || "") || null,
          isActive: true,
        });
      } else if (modal.entity === "region") {
        result = await saveRegionAction({
          id: modal.item?.id,
          kecamatan: String(formData.get("kecamatan") || ""),
          desa: String(formData.get("desa") || ""),
          isActive: true,
        });
      }

      if (result && "error" in result) {
        setError(result.error || "Terjadi kesalahan.");
        return;
      }
      close();
      router.refresh();
    });
  }

  async function toggle(entity: Entity, id: string, isActive: boolean) {
    startTransition(async () => {
      let result: ActionResult;
      if (entity === "category")
        result = await toggleCategoryAction({
          categoryId: id,
          isActive: !isActive,
        });
      else if (entity === "executor")
        result = await toggleExecutorAction({
          executorId: id,
          isActive: !isActive,
        });
      else if (entity === "region")
        result = await toggleRegionAction({
          regionId: id,
          isActive: !isActive,
        });
      if (result && "error" in result) setError(result.error || "Gagal.");
      router.refresh();
    });
  }

  const query = q.trim().toLowerCase();

  const filteredCategories = useMemo(
    () =>
      categories.filter((c) => {
        if (query.length < 3) return true;
        return (
          c.name.toLowerCase().includes(query) ||
          c.slug.toLowerCase().includes(query)
        );
      }),
    [categories, query]
  );
  const filteredExecutors = useMemo(
    () =>
      executors.filter((e) => {
        if (query.length < 3) return true;
        return (
          e.name.toLowerCase().includes(query) ||
          (e.category_id &&
            categories
              .find((c) => c.id === e.category_id)
              ?.name.toLowerCase()
              .includes(query))
        );
      }),
    [executors, categories, query]
  );
  const filteredRegions = useMemo(
    () =>
      regions.filter((r) => {
        if (query.length < 3) return true;
        return (
          (r.kecamatan ?? "").toLowerCase().includes(query) ||
          (r.desa ?? "").toLowerCase().includes(query)
        );
      }),
    [regions, query]
  );

  useEffect(() => {
    setPageCat(1);
    setPageExec(1);
    setPageReg(1);
  }, [query]);

  const catPage = Math.min(pageCat, Math.max(1, Math.ceil(filteredCategories.length / PAGE_SIZE)));
  const execPage = Math.min(pageExec, Math.max(1, Math.ceil(filteredExecutors.length / PAGE_SIZE)));
  const regPage = Math.min(pageReg, Math.max(1, Math.ceil(filteredRegions.length / PAGE_SIZE)));

  const catRows = filteredCategories.slice((catPage - 1) * PAGE_SIZE, catPage * PAGE_SIZE);
  const execRows = filteredExecutors.slice((execPage - 1) * PAGE_SIZE, execPage * PAGE_SIZE);
  const regRows = filteredRegions.slice((regPage - 1) * PAGE_SIZE, regPage * PAGE_SIZE);

  return (
    <div className="container-page py-8">
      <div>
        <h1 className="text-xl font-extrabold tracking-tight text-ink sm:text-2xl">
          Data Master
        </h1>
        <p className="mt-0.5 text-sm text-ink-muted">
          Kelola kategori &amp; pelaksana. Nonaktifkan agar tidak dipakai di
          form &amp; penugasan.
        </p>
      </div>

      {error && (
        <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      {/* Search */}
      <div className="relative mt-6 max-w-md">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Cari pada semua master (min. 3 huruf)..."
          className="input-field pl-10"
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Kategori */}
        <MasterCard
          title="Kategori Aduan"
          desc={`${activeCategories.length} aktif dari ${categories.length}`}
          onAdd={() => open({ entity: "category" })}
        >
          {catRows.map((c) => (
            <MasterRow
              key={c.id}
              title={c.name}
              sub={c.slug}
              isActive={c.is_active}
              protected={c.slug === "lainnya"}
              onEdit={() => open({ entity: "category", item: c })}
              onToggle={() =>
                toggle("category", c.id, c.is_active)
              }
            />
          ))}
          {filteredCategories.length > PAGE_SIZE && (
            <Pagination
              page={catPage}
              pageCount={Math.ceil(filteredCategories.length / PAGE_SIZE)}
              onChange={setPageCat}
            />
          )}
        </MasterCard>

        {/* Pelaksana */}
        <MasterCard
          title="Pelaksana"
          desc={`${executors.filter((e) => e.is_active).length} aktif dari ${executors.length}`}
          onAdd={() => open({ entity: "executor" })}
        >
          {execRows.map((e) => {
            const cat = categories.find((c) => c.id === e.category_id);
            return (
              <MasterRow
                key={e.id}
                title={e.name}
                sub={cat?.name ?? "Tanpa kategori"}
                isActive={e.is_active}
                onEdit={() => open({ entity: "executor", item: e })}
                onToggle={() =>
                  toggle("executor", e.id, e.is_active)
                }
              />
            );
          })}
          {filteredExecutors.length > PAGE_SIZE && (
            <Pagination
              page={execPage}
              pageCount={Math.ceil(filteredExecutors.length / PAGE_SIZE)}
              onChange={setPageExec}
            />
          )}
        </MasterCard>

        {/* Wilayah */}
        <MasterCard
          title="Data Wilayah"
          desc={`${regions.filter((r) => r.is_active).length} aktif dari ${regions.length}`}
          onAdd={() => open({ entity: "region" })}
        >
          {regRows.map((r) => (
            <MasterRow
              key={r.id}
              title={`Kec. ${r.kecamatan || "-"}`}
              sub={`Desa/Kel. ${r.desa || "-"}`}
              isActive={r.is_active}
              onEdit={() => open({ entity: "region", item: r })}
              onToggle={() => toggle("region", r.id, r.is_active)}
            />
          ))}
          {filteredRegions.length > PAGE_SIZE && (
            <Pagination
              page={regPage}
              pageCount={Math.ceil(filteredRegions.length / PAGE_SIZE)}
              onChange={setPageReg}
            />
          )}
        </MasterCard>
      </div>

      {/* Modal */}
      {modal && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-4 sm:items-center"
          onClick={pending ? undefined : close}
        >
          <div
            className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <h3 className="flex items-center gap-2 text-base font-extrabold text-ink">
                <Pencil className="h-4 w-4 text-brand-600" />
                {modal.item
                  ? `Ubah ${
                      modal.entity === "category"
                        ? "Kategori"
                        : modal.entity === "executor"
                          ? "Pelaksana"
                          : "Wilayah"
                    }`
                  : `Tambah ${
                      modal.entity === "category"
                        ? "Kategori"
                        : modal.entity === "executor"
                          ? "Pelaksana"
                          : "Wilayah"
                    }`}
              </h3>
              <button
                onClick={close}
                disabled={pending}
                className="flex h-8 w-8 items-center justify-center rounded-full text-ink-faint transition-colors hover:bg-slate-100 hover:text-ink"
                aria-label="Tutup"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {error && (
              <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {error}
              </div>
            )}

            <form action={submit} className="mt-4 space-y-4">
              {modal.entity === "category" && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-ink">
                        Nama <span className="text-rose-500">*</span>
                      </label>
                      <input
                        id="name"
                        name="name"
                        type="text"
                        required
                        maxLength={80}
                        defaultValue={modal.item?.name ?? ""}
                        className="input-field mt-1.5"
                      />
                    </div>
                    <div>
                      <label htmlFor="slug" className="block text-sm font-medium text-ink">
                        Slug <span className="text-rose-500">*</span>
                      </label>
                      <input
                        id="slug"
                        name="slug"
                        type="text"
                        required
                        maxLength={40}
                        defaultValue={modal.item?.slug ?? ""}
                        placeholder="mis. jalan"
                        className="input-field mt-1.5"
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-ink">
                      Deskripsi
                    </label>
                    <input
                      id="description"
                      name="description"
                      type="text"
                      maxLength={200}
                      defaultValue={modal.item?.description ?? ""}
                      className="input-field mt-1.5"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="icon" className="block text-sm font-medium text-ink">
                        Ikon (nama lucide)
                      </label>
                      <input
                        id="icon"
                        name="icon"
                        type="text"
                        maxLength={40}
                        defaultValue={modal.item?.icon ?? ""}
                        placeholder="mis. Trash2"
                        className="input-field mt-1.5"
                      />
                    </div>
                    <div>
                      <label htmlFor="color" className="block text-sm font-medium text-ink">
                        Warna (kelas Tailwind)
                      </label>
                      <input
                        id="color"
                        name="color"
                        type="text"
                        maxLength={80}
                        defaultValue={modal.item?.color ?? ""}
                        placeholder='mis. bg-emerald-50 text-emerald-700'
                        className="input-field mt-1.5"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-ink-muted">
                    Ikon mengikuti daftar di <code>Icon.tsx</code>; warna kelas Tailwind
                    bias — tidak dikenal akan tampil netral.
                  </p>
                </>
              )}

              {modal.entity === "executor" && (
                <>
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-ink">
                      Nama <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      required
                      minLength={3}
                      maxLength={120}
                      defaultValue={modal.item?.name ?? ""}
                      className="input-field mt-1.5"
                    />
                  </div>
                  <div>
                    <label htmlFor="categoryId" className="block text-sm font-medium text-ink">
                      Kategori <span className="font-normal text-ink-faint">(opsional)</span>
                    </label>
                    <select
                      id="categoryId"
                      name="categoryId"
                      defaultValue={modal.item?.category_id ?? ""}
                      className="input-field mt-1.5"
                    >
                      <option value="">— Tanpa kategori —</option>
                      {activeCategories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}
              {modal.entity === "region" && (
                <>
                  <div>
                    <label htmlFor="kecamatan" className="block text-sm font-medium text-ink">
                      Kecamatan <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="kecamatan"
                      name="kecamatan"
                      type="text"
                      required
                      maxLength={80}
                      defaultValue={modal.item?.kecamatan ?? ""}
                      placeholder="mis. Bojonegoro Kota"
                      className="input-field mt-1.5"
                    />
                  </div>
                  <div>
                    <label htmlFor="desa" className="block text-sm font-medium text-ink">
                      Desa / Kelurahan <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="desa"
                      name="desa"
                      type="text"
                      required
                      maxLength={80}
                      defaultValue={modal.item?.desa ?? ""}
                      placeholder="mis. Kauman"
                      className="input-field mt-1.5"
                    />
                  </div>
                </>
              )}
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={close}
                  disabled={pending}
                  className="btn-ghost"
                >
                  Batal
                </button>
                <button type="submit" disabled={pending} className="btn-primary">
                  {pending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    "Simpan"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function MasterCard({
  title,
  desc,
  onAdd,
  children,
  className,
}: {
  title: string;
  desc: string;
  onAdd: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("card overflow-hidden", className)}>
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <div>
          <h2 className="text-sm font-bold text-ink">{title}</h2>
          <p className="text-xs text-ink-muted">{desc}</p>
        </div>
        <button onClick={onAdd} className="btn-secondary !px-3 !py-2 text-xs">
          <Plus className="h-3.5 w-3.5" />
          Tambah
        </button>
      </div>
      <ul className="divide-y divide-slate-100">
        {Children.count(children) === 0 ? (
          <li className="px-5 py-10 text-center text-sm text-ink-muted">
            Tidak ada data.
          </li>
        ) : (
          children
        )}
      </ul>
    </div>
  );
}

function MasterRow({
  title,
  sub,
  isActive,
  protected: protectedItem = false,
  onEdit,
  onToggle,
}: {
  title: string;
  sub: string;
  isActive: boolean;
  protected?: boolean;
  onEdit: () => void;
  onToggle: () => void;
}) {
  return (
    <li className="flex items-center gap-3 px-5 py-3.5">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-ink">{title}</p>
        <p className="truncate text-xs text-ink-muted">{sub}</p>
      </div>
      <span
        className={cn(
          "badge ring-1",
          isActive
            ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
            : "bg-slate-100 text-slate-500 ring-slate-200"
        )}
      >
        {isActive ? "Aktif" : "Nonaktif"}
      </span>
      <button
        onClick={onEdit}
        disabled={protectedItem}
        className="btn-ghost !px-2.5 !py-1.5 text-xs disabled:opacity-40"
        aria-label={`Edit ${title}`}
      >
        <Pencil className="h-3.5 w-3.5" />
      </button>
      {!protectedItem && (
        <button
          onClick={onToggle}
          className={cn(
            "btn-ghost !px-2.5 !py-1.5 text-xs",
            isActive ? "text-rose-700" : "text-emerald-700"
          )}
          aria-label={isActive ? "Nonaktifkan" : "Aktifkan"}
        >
          <Power className="h-3.5 w-3.5" />
        </button>
      )}
    </li>
  );
}