"use client";

import { useEffect, useId, useState } from "react";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { Users, BarChart3, Radio, RefreshCcw } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { STATUS_HEX } from "@/lib/pimpinan/chartColors";
import type { ComplaintStatus, UserRole } from "@/lib/db-types";

interface Props {
  initialUsers: { role: UserRole; isActive: boolean }[];
  initialComplaints: { status: ComplaintStatus; category?: { name: string } | null; created_at: string }[];
}

const ROLE_COLORS: Record<string, string> = {
  admin: "#8b5cf6",       // violet
  pimpinan: "#3b82f6",    // blue
  petugas: "#06b6d4",     // cyan
  masyarakat: "#10b981",  // emerald
};

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  pimpinan: "Pimpinan",
  petugas: "Petugas",
  masyarakat: "Masyarakat",
};

export default function AdminRealtimeCharts({ initialUsers, initialComplaints }: Props) {
  const channelId = useId();
  const [complaints, setComplaints] = useState(initialComplaints);
  const [users, setUsers] = useState(initialUsers);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    setLastUpdated(new Date());
    let mounted = true;
    const supabase = createClient();

    async function refetchComplaints() {
      const { data } = await supabase
        .from("complaints")
        .select("status, created_at, category:categories(name)");
      if (mounted && data) {
        setComplaints(data as any);
        setLastUpdated(new Date());
      }
    }

    async function refetchUsers() {
      const { data } = await supabase
        .from("profiles")
        .select("role, is_active");
      if (mounted && data) {
        setUsers(data.map((u) => ({ role: u.role as UserRole, isActive: u.is_active })));
        setLastUpdated(new Date());
      }
    }

    const channelName = "admin-charts-" + channelId.replace(/[^a-zA-Z0-9_-]/g, "");
    const channel = supabase.channel(channelName);

    channel
      .on("postgres_changes", { schema: "public", table: "complaints", event: "*" }, () => {
        refetchComplaints();
      })
      .on("postgres_changes", { schema: "public", table: "profiles", event: "*" }, () => {
        refetchUsers();
      })
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [channelId]);

  // 1. Data Distribusi Pengguna berdasarkan Role
  const roleCounts: Record<string, number> = {};
  users.forEach((u) => {
    roleCounts[u.role] = (roleCounts[u.role] || 0) + 1;
  });
  const roleChartData = Object.entries(roleCounts).map(([role, count]) => ({
    name: ROLE_LABELS[role] || role,
    count,
    role,
  }));

  // 2. Data Status Aduan
  const statusLabels: Record<string, string> = {
    diajukan: "Diajukan",
    diterima: "Diterima",
    diproses: "Diproses",
    selesai: "Selesai",
    ditolak: "Ditolak",
  };
  const statusCounts: Record<string, number> = {
    diajukan: 0,
    diterima: 0,
    diproses: 0,
    selesai: 0,
    ditolak: 0,
  };
  complaints.forEach((c) => {
    if (statusCounts[c.status] !== undefined) {
      statusCounts[c.status]++;
    }
  });
  const statusChartData = Object.entries(statusCounts).map(([status, count]) => ({
    name: statusLabels[status] || status,
    count,
    status,
  }));

  return (
    <div className="space-y-6">
      {/* Realtime Status Indicator */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white px-5 py-3.5 shadow-soft">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
          </span>
          <span className="text-xs font-bold text-ink">Diagram Real-time Aktif</span>
          <span className="text-xs text-ink-muted">· terhubung ke Supabase Live Database</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-ink-muted" suppressHydrationWarning>
          {lastUpdated ? (
            <span>Pembaruan terakhir: {lastUpdated.toLocaleTimeString("id-ID")}</span>
          ) : (
            <span>Live Sync</span>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Diagram 1: Komposisi Peran Pengguna (Pie Chart) */}
        <div className="card p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-brand-600" />
              <h3 className="text-sm font-bold text-ink">Komposisi Akun Pengguna</h3>
            </div>
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-ink">
              {users.length} Total
            </span>
          </div>
          <p className="mt-1 text-xs text-ink-muted">
            Perbandingan jumlah akun masyarakat, petugas, pimpinan, dan admin.
          </p>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={roleChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="count"
                >
                  {roleChartData.map((entry) => (
                    <Cell key={entry.name} fill={ROLE_COLORS[entry.role] || "#94a3b8"} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Diagram 2: Volume Status Pengaduan (Bar Chart) */}
        <div className="card p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-brand-600" />
              <h3 className="text-sm font-bold text-ink">Status Pengaduan Masuk</h3>
            </div>
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-ink">
              {complaints.length} Aduan
            </span>
          </div>
          <p className="mt-1 text-xs text-ink-muted">
            Distribusi seluruh aduan menurut progres penanganan saat ini.
          </p>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                <Tooltip cursor={{ fill: "rgba(148,163,184,0.12)" }} />
                <Bar dataKey="count" radius={[8, 8, 0, 0]} barSize={36}>
                  {statusChartData.map((entry) => (
                    <Cell key={entry.name} fill={STATUS_HEX[entry.status] || "#db2777"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}