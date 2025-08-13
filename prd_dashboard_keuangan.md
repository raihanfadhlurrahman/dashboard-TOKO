# PRD — Dashboard Keuangan untuk Sistem POS (berdasarkan schema yang kamu kirim)

Oke Dapa — sini PRD ringkas, jelas, dan langsung ke poin. Aku rangkum scope, user stories, fitur utama, mapping ke DB yang kamu punya, contoh API & SQL, metrik utama, requirement keamanan, acceptance criteria, dan backlog. Bisa dipakai sebagai panduan dev + QA.

---

# 1. Ringkasan Produk
**Tujuan:** Buat dashboard keuangan untuk pemilik toko / manajer yang menampilkan metrik penjualan, laporan transaksi, performa menu, dan data pelanggan — semua diambil dari tabel `toko`, `menu`, `transaksi`, `transaksi_detail`, dst. Dashboard harus real-time-ish (refresh tiap X menit), mobile-friendly, dan mudah dipakai.

**Nilai bisnis:** Visibilitas pendapatan, keuntungan, menu populer, dan pola pelanggan untuk keputusan stok, promo, dan staffing.

---

# 2. Persona Pengguna
- **Pemilik Toko / Owner** — lihat ringkasan pendapatan harian/mingguan/bulanan, top-selling items.
- **Manajer / Supervisor** — analisis performa menu, margin (kalau tersedia), dan transaksi per shift.
- **Kasir / Operator** — lihat transaksi terbaru; akses untuk debugging transaksi.
- **Akuntan** — ekspor data ke CSV / Excel, laporan lengkap per periode.

---

# 3. Scope & Prioritas (MVP)
**MVP (Wajib):**
- Ringkasan pendapatan (hari, minggu, bulan) per toko.
- Daftar transaksi terbaru (with details: item, qty, harga, nama pembeli).
- Laporan “Top Menu” (by qty & revenue).
- Export CSV (periode, toko).
- Filter: toko, tanggal (dari — sampai), user (kasir), kategori menu.
- Paging & sorting di tabel transaksi.

**Nice-to-have (setelah MVP):**
- Visualisasi jam sibuk (sales per hour).
- Cohort / repeat customers (butuh `pelanggan` lebih lengkap).
- Integrasi AI preset dari `toko.ai_prompt_*` (untuk insight otomatis).
- Forecast sederhana (tren berdasarkan 3 bulan terakhir).

---

# 4. Fitur Detail & User Stories

## 4.1 Dashboard Summary (homepage)
- **Card**: Total Pendapatan Hari Ini, Kemarin, Selama 30 hari.
- **Card**: Transaksi Hari Ini (count).
- **Chart**: Revenue trend (last 30 days).
- **Table**: Top 10 Menu (qty sold, revenue).
- **Table**: Transaksi terbaru (toko terpilih).

**User Story:** Sebagai owner, aku ingin melihat total pendapatan hari ini dan tren 30 hari supaya bisa lihat performa toko.

## 4.2 Laporan Transaksi (Transactions)
- Filter: toko_id, tanggal, user_id/kasir, pelanggan_id/nama_pembeli
- Columns: id, created_at, nama_pembeli, no_hp_pembeli, total, items_count, aksi (lihat detail)
- Detail modal: list transaksi_detail (menu, qty, harga_satuan, variasi, nama_menu)

**User Story:** Sebagai manajer, aku mau bisa mencari transaksi berdasarkan nama pembeli atau toko agar bisa konfirmasi order.

## 4.3 Produk & Kategori Performance
- Filter per toko, per kategori.
- Metrics per menu: total_qty_sold, total_revenue, avg_price.
- Sorting: by qty, revenue.

**User Story:** Sebagai owner, aku mau tahu menu mana yang paling laris agar bisa fokus promosi/stok.

## 4.4 Eksport & Report
- Export CSV/Excel untuk periode & toko.
- Pre-built report: daily sales, monthly summary.

---

# 5. Data Model Mapping (pakai schema kamu)
| Fitur | Tabel utama | Kolom penting |
|---|---:|---|
| Toko | `toko` | `id`, `nama_toko`, `ai_prompt_*` |
| Menu | `menu` | `id`, `nama`, `harga`, `toko_id`, `kategori_id` |
| Transaksi | `transaksi` | `id`, `toko_id`, `user_id`, `total`, `created_at`, `nama_pembeli`, `no_hp_pembeli`, `pelanggan_id` |
| Transaksi detail | `transaksi_detail` | `transaksi_id`, `menu_id`, `qty`, `harga_satuan`, `variasi_id`, `nama_menu` |

**Catatan:** Trigger `transaksi_detail_fill_nama_menu` mengisi `nama_menu` sehingga historical nama menu tersimpan walau menu berubah — bagus untuk laporan.

---

# 6. Contoh SQL Reports (siap pakai)

### Total revenue per day (last 30 days) — per toko
```sql
SELECT 
  date_trunc('day', t.created_at) AS day,
  SUM(t.total) AS revenue,
  COUNT(*) AS transactions
FROM transaksi t
WHERE t.toko_id = :toko_id
  AND t.created_at >= now() - interval '30 days'
GROUP BY day
ORDER BY day;
```

### Top menu (by qty) for period
```sql
SELECT td.menu_id, td.nama_menu, SUM(td.qty) as total_qty, SUM(td.qty * td.harga_satuan) as revenue
FROM transaksi_detail td
JOIN transaksi t ON t.id = td.transaksi_id
WHERE t.toko_id = :toko_id
  AND t.created_at BETWEEN :from AND :to
GROUP BY td.menu_id, td.nama_menu
ORDER BY total_qty DESC
LIMIT 10;
```

### Transaksi list with item count
```sql
SELECT t.id, t.created_at, t.nama_pembeli, t.total, COUNT(td.id) as items_count
FROM transaksi t
LEFT JOIN transaksi_detail td ON td.transaksi_id = t.id
WHERE t.toko_id = :toko_id
  AND t.created_at BETWEEN :from AND :to
GROUP BY t.id
ORDER BY t.created_at DESC
LIMIT 50 OFFSET :offset;
```

---

# 7. API Endpoints (proposal REST)
Auth assumed (JWT/sessions) — gunakan `toko_id` dari token atau param.

- `GET /api/dashboard/summary?toko_id=&from=&to=` — ringkasan revenue & transaksi
- `GET /api/reports/revenue?period=30d&toko_id=` — time series
- `GET /api/reports/top-menus?toko_id=&from=&to=&limit=10`
- `GET /api/transactions?toko_id=&from=&to=&page=&per_page=&user_id=&nama_pembeli=`
- `GET /api/transactions/:id` — full detail with transaksi_detail
- `GET /api/export/csv?toko_id=&from=&to=&type=transactions|summary`

**Response shape**: JSON with `statusCode`, `message`, `data` consistent dengan kebiasaanmu.

---

# 8. UX / Layout Proposal (high level)
- **Header**: toko selector, tanggal range picker, export button.
- **Left column (desktop)**: KPI cards (Revenue Today, Avg Order Value, Transactions Today).
- **Main**: charts (trend), top menu table.
- **Right**: latest transactions feed (click -> modal).
- Mobile: stack vertical, collapsible filters.

---

# 9. Metrik & KPI
- **Revenue** (hari / minggu / bulan)
- **Transactions Count**
- **Average Order Value (AOV)** = revenue / transactions
- **Items Sold** (total qty)
- **Top-selling menu items**
- **Repeat customers** (need better pelanggan tracking)
- **Sales per hour** (peak hours)

---

# 10. Non-Functional Requirements
- **Performance:** queries for 30 days must respond < 2s for 1 store with ~100k rows (indexing already ada untuk `toko_id`, `transaksi_id`).
- **Scalability:** paginate transaksi, use materialized view for heavy aggregations (refresh each X minutes).
- **Security:** role-based access (owner vs kasir), semua endpoint authenticated, sanitize inputs.
- **Export:** CSV size limit / async job for very large exports.

---

# 11. Data / Schema Gaps & Recommendations
- **Pelanggan table** exists? (schema references `pelanggan` but fields unseen). Add `email`, `phone`, `first_seen`.
- **Refunds / Discounts**: `transaksi` has `total` only — consider `discount_total`, `subtotal`, `tax`, `payment_method` columns.
- **Costs / margin**: Add `cost_price` in `menu` or `menu_bom` to calculate profit.
- **Shifts / cashier**: store `shift_id` or `shift_start` on transaksi to analyze staff performance.
- **Indexes**: add index on `transaksi.created_at` if reporting heavy by date range.

---

# 12. Security & Compliance
- Use TLS for API.
- Protect PII: mask `no_hp_pembeli` in UI unless authorized.
- Rate limit report endpoints.
- Audit log for export actions.

---

# 13. Acceptance Criteria (MVP)
1. Owner can view revenue for selected date range and selected toko.
2. Top 10 menus shown correctly for range and match sum of transaksi_detail.
3. Transactions list shows transactions with item counts and opens detail modal showing items.
4. CSV export returns a correctly formatted file with requested rows.
5. All endpoints require authentication; unauthorized requests return 401.

---

# 14. Milestone & Rough Timeline (example sprint plan)
- **Sprint 0 (1 wk)**: infra, auth, base API scaffolding, db read endpoints.
- **Sprint 1 (2 wk)**: Dashboard summary cards, revenue time series, filters.
- **Sprint 2 (2 wk)**: Transactions list + detail modal, export CSV.
- **Sprint 3 (1–2 wk)**: Top menus, charts, polish & mobile responsiveness.
- **Sprint 4 (ongoing)**: performance tuning, materialized views, extra features.

---

# 15. Backlog / Next features
- Drill-down from chart to transaction list.
- Alerts: daily revenue below threshold.
- Forecasting & AI insights (use `toko.ai_prompt_preset` to auto-generate insights).
- Multi-store aggregate reports.

---

# 16. Testing Checklist
- Unit tests for report SQL & aggregation functions.
- Integration tests for API endpoints (auth, filters).
- Frontend E2E for flows: filter -> view -> export.
- Performance test for 1M transaksi rows (simulate).

---

# 17. Quick wins & optimization tips
- Add materialized view: daily_revenue(toko_id, day, revenue) refreshed nightly or every 5m for live dashboards.
- Cache top-menu queries for short periods.
- Use `nama_menu` in `transaksi_detail` (trigger) as canonical snapshot — great for accurate historical reporting.
