import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import type { Site, User } from '../../types';
import { usePagination } from '../../hooks/usePagination';
import { Pagination } from '../../components/shared/Pagination';
import {
  Building2,
  MapPin,
  User as UserIcon,
  Plus,
  Loader2,
  AlertCircle,
  X,
  CheckCircle,
} from 'lucide-react';

const OwnerSites: React.FC = () => {
  const [sites, setSites] = useState<Site[]>([]);
  const [supervisors, setSupervisors] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const {
    paginatedData: paginatedSites,
    currentPage,
    totalPages,
    goToPage,
    totalItems,
  } = usePagination(sites, 10);

  // Form State
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [supervisorId, setSupervisorId] = useState('');

  const fetchSitesAndSupervisors = async () => {
    try {
      setLoading(true);
      const [sitesData, usersData]: any = await Promise.all([
        api.get('/api/sites?limit=100'),
        api.get('/api/users?limit=100'),
      ]);
      setSites(sitesData.data || sitesData || []);
      // Filter out supervisors only
      const supervisorsList = (usersData.data || usersData || []).filter((u: User) => u.role === 'SUPERVISOR');
      setSupervisors(supervisorsList);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to fetch sites.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSitesAndSupervisors();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSubmitting(true);

    if (!code || !name || !location) {
      setErrorMsg('Code, Name, and Location are required.');
      setSubmitting(false);
      return;
    }

    try {
      await api.post('/api/sites', {
        code,
        name,
        location,
        supervisorId: supervisorId || null,
      });
      // Reset & Reload
      setModalOpen(false);
      setCode('');
      setName('');
      setLocation('');
      setSupervisorId('');
      fetchSitesAndSupervisors();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create site.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="space-y-8">
      {/* Header and Quick action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Construction Sites</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Manage operational budgets and assigned supervisors per site.</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm shadow-lg shadow-amber-500/20 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer"
        >
          <Plus className="w-5 h-5" />
          Create New Site
        </button>
      </div>

      {loading ? (
        <div className="min-h-[40vh] flex items-center justify-center">
          <Loader2 className="w-10 h-10 animate-spin text-amber-500" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sites.length === 0 ? (
            <div className="md:col-span-3 text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800 text-slate-450">
              <Building2 className="w-12 h-12 text-slate-350 dark:text-slate-600 mx-auto mb-3" />
              <p className="text-lg font-bold">No Construction Sites Found</p>
              <p className="text-sm text-slate-550 mt-0.5">Click "Create New Site" to configure your first location.</p>
            </div>
          ) : (
            paginatedSites.map((site) => (
              <div
                key={site.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800 p-6 hover:shadow-lg transition-all relative flex flex-col justify-between"
              >
                {/* Site Header */}
                <div className="space-y-2">
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full uppercase tracking-wider">
                      {site.code}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      site.status === 'ACTIVE'
                        ? 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20'
                        : 'bg-rose-50/10 text-rose-500'
                    }`}>
                      {site.status}
                    </span>
                  </div>
                  <h3 className="font-bold text-lg text-slate-900 dark:text-white line-clamp-1 hover:text-amber-500 transition-colors">
                    <Link to={`/owner/sites/${site.id}`}>{site.name}</Link>
                  </h3>
                  <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs">
                    <MapPin className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{site.location}</span>
                  </div>
                </div>

                {/* Supervisor info & Running cash */}
                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-850/50 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Running Cash</span>
                    <span className="text-lg font-extrabold text-amber-500 dark:text-amber-400 flex items-center gap-0.5">
                      {formatCurrency(site.currentBalance)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Supervisor</span>
                    <div className="flex items-center gap-1.5 text-slate-650 dark:text-slate-300 text-sm font-semibold">
                      <UserIcon className="w-4 h-4 text-slate-400" />
                      <span>{site.supervisor?.name || 'Unassigned'}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {!loading && sites.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={goToPage}
          totalItems={totalItems}
          itemsPerPage={10}
        />
      )}

      {/* Creation Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg p-6 sm:p-8 z-10 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-6 right-6 p-2 rounded-xl bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5 text-slate-500" />
            </button>

            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
              <Building2 className="text-amber-500 w-6 h-6" />
              Configure Construction Site
            </h3>

            <form onSubmit={handleSubmit} className="space-y-5">
              {errorMsg && (
                <div className="flex items-center gap-2 p-3 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-455 text-xs rounded-xl border border-rose-100 dark:border-rose-900/30">
                  <AlertCircle className="w-4.5 h-4.5 flex-shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-505 dark:text-slate-400 uppercase tracking-wider">Site Code (Unique ID)</label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="E.G., SITE-003"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-505 dark:text-slate-400 uppercase tracking-wider">Site Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Greenwood Premium Mall"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-505 dark:text-slate-400 uppercase tracking-wider">Location / Address</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Plot 14, OMR, Chennai, Tamil Nadu"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-505 dark:text-slate-400 uppercase tracking-wider">Assign Site Supervisor (Optional)</label>
                <select
                  value={supervisorId}
                  onChange={(e) => setSupervisorId(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 text-sm font-semibold"
                >
                  <option value="">Unassigned / Keep Blank</option>
                  {supervisors.map((s) => (
                    <option key={s.id} value={s.id} disabled={s.isActive === false}>
                      {s.name} ({s.email}) {s.isActive === false && '— Deactivated'}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="w-1/2 py-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-sm transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-1/2 py-3 rounded-xl gradient-orange-amber text-white font-bold text-sm shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  Deploy Site
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OwnerSites;
