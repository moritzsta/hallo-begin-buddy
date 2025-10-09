import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  Activity,
  HardDrive,
  Zap,
  DollarSign,
  Users,
  AlertTriangle,
  TrendingUp,
  Database,
} from 'lucide-react';
import { fadeInUp, staggerContainer, getAnimationProps } from '@/lib/animations';
import { Navigate } from 'react-router-dom';

interface UsageStats {
  totalSmartUploads: number;
  totalStorage: number;
  totalUsers: number;
  totalFiles: number;
  smartUploadsByDay: Array<{ date: string; count: number }>;
  storageByUser: Array<{ user: string; storage: number }>;
  planDistribution: Array<{ plan: string; count: number }>;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
};

export default function Admin() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  // Check if user is admin
  useEffect(() => {
    const checkAdmin = async () => {
      if (!user) {
        setIsAdmin(false);
        return;
      }

      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle();

      setIsAdmin(!error && data !== null);
    };

    checkAdmin();
  }, [user]);

  // Fetch usage statistics
  const { data: usageStats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['admin-usage-stats'],
    queryFn: async (): Promise<UsageStats> => {
      // Get smart uploads count
      const { data: smartUploads } = await supabase
        .from('usage_tracking')
        .select('count, date')
        .eq('feature', 'smart_upload');

      const totalSmartUploads = smartUploads?.reduce((sum, item) => sum + item.count, 0) || 0;

      // Get smart uploads by day (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const smartUploadsByDay = smartUploads
        ?.filter(item => new Date(item.date) >= thirtyDaysAgo)
        .map(item => ({
          date: new Date(item.date).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' }),
          count: item.count,
        }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()) || [];

      // Get total storage used
      const { data: files } = await supabase
        .from('files')
        .select('size, owner_id');

      const totalStorage = files?.reduce((sum, file) => sum + file.size, 0) || 0;

      // Get storage by user (top 10)
      const storageByUserMap = new Map<string, number>();
      files?.forEach(file => {
        const current = storageByUserMap.get(file.owner_id) || 0;
        storageByUserMap.set(file.owner_id, current + file.size);
      });

      const storageByUser = Array.from(storageByUserMap.entries())
        .map(([userId, storage]) => ({
          user: userId.substring(0, 8) + '...',
          storage,
        }))
        .sort((a, b) => b.storage - a.storage)
        .slice(0, 10);

      // Get total users and plan distribution
      const { data: profiles } = await supabase
        .from('profiles')
        .select('plan_tier');

      const totalUsers = profiles?.length || 0;

      const planDistribution = Object.entries(
        profiles?.reduce((acc, profile) => {
          acc[profile.plan_tier] = (acc[profile.plan_tier] || 0) + 1;
          return acc;
        }, {} as Record<string, number>) || {}
      ).map(([plan, count]) => ({ plan, count }));

      // Get total files
      const totalFiles = files?.length || 0;

      return {
        totalSmartUploads,
        totalStorage,
        totalUsers,
        totalFiles,
        smartUploadsByDay,
        storageByUser,
        planDistribution,
      };
    },
    enabled: isAdmin === true,
  });

  // Check for warnings
  const storageWarning = usageStats && usageStats.totalStorage > 1024 * 1024 * 1024 * 10; // > 10 GB warning
  const smartUploadWarning = usageStats && usageStats.totalSmartUploads > 1000; // > 1000 total

  if (isAdmin === null) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  if (isAdmin === false) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <motion.div {...getAnimationProps(fadeInUp)}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Activity className="h-8 w-8 text-primary" />
              Admin Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">
              Usage-Tracking & System-Übersicht
            </p>
          </div>
          <Badge variant="default" className="h-8">
            Admin
          </Badge>
        </div>
      </motion.div>

      {/* Warnings */}
      {(storageWarning || smartUploadWarning) && (
        <motion.div {...getAnimationProps(fadeInUp)}>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Warnung: Limits erreicht</AlertTitle>
            <AlertDescription>
              <ul className="list-disc list-inside mt-2 space-y-1">
                {storageWarning && (
                  <li>Speicher-Nutzung überschreitet 10 GB ({formatBytes(usageStats.totalStorage)})</li>
                )}
                {smartUploadWarning && (
                  <li>Smart-Uploads überschreiten 1000 ({usageStats.totalSmartUploads})</li>
                )}
              </ul>
            </AlertDescription>
          </Alert>
        </motion.div>
      )}

      {/* Stats Overview */}
      <motion.div
        {...getAnimationProps(staggerContainer)}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        <motion.div {...getAnimationProps(fadeInUp)}>
          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Smart Uploads</p>
                <p className="text-3xl font-bold mt-1">
                  {isLoadingStats ? <Skeleton className="h-9 w-20" /> : usageStats?.totalSmartUploads || 0}
                </p>
              </div>
              <Zap className="h-12 w-12 text-primary opacity-50" />
            </div>
          </Card>
        </motion.div>

        <motion.div {...getAnimationProps(fadeInUp)}>
          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Speicher</p>
                <p className="text-3xl font-bold mt-1">
                  {isLoadingStats ? (
                    <Skeleton className="h-9 w-20" />
                  ) : (
                    formatBytes(usageStats?.totalStorage || 0)
                  )}
                </p>
              </div>
              <HardDrive className="h-12 w-12 text-green-500 opacity-50" />
            </div>
          </Card>
        </motion.div>

        <motion.div {...getAnimationProps(fadeInUp)}>
          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Nutzer</p>
                <p className="text-3xl font-bold mt-1">
                  {isLoadingStats ? <Skeleton className="h-9 w-20" /> : usageStats?.totalUsers || 0}
                </p>
              </div>
              <Users className="h-12 w-12 text-blue-500 opacity-50" />
            </div>
          </Card>
        </motion.div>

        <motion.div {...getAnimationProps(fadeInUp)}>
          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Dateien</p>
                <p className="text-3xl font-bold mt-1">
                  {isLoadingStats ? <Skeleton className="h-9 w-20" /> : usageStats?.totalFiles || 0}
                </p>
              </div>
              <Database className="h-12 w-12 text-orange-500 opacity-50" />
            </div>
          </Card>
        </motion.div>
      </motion.div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Smart Uploads Trend */}
        <motion.div {...getAnimationProps(fadeInUp)}>
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <TrendingUp className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold">Smart Uploads (30 Tage)</h2>
            </div>
            {isLoadingStats ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={usageStats?.smartUploadsByDay || []}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Line type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </Card>
        </motion.div>

        {/* Plan Distribution */}
        <motion.div {...getAnimationProps(fadeInUp)}>
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <DollarSign className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold">Plan-Verteilung</h2>
            </div>
            {isLoadingStats ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={usageStats?.planDistribution || []}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.plan}: ${entry.count}`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {usageStats?.planDistribution.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </Card>
        </motion.div>

        {/* Storage by User */}
        <motion.div {...getAnimationProps(fadeInUp)} className="lg:col-span-2">
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <HardDrive className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold">Speicher-Nutzung (Top 10 Nutzer)</h2>
            </div>
            {isLoadingStats ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={usageStats?.storageByUser || []}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="user" className="text-xs" />
                  <YAxis
                    className="text-xs"
                    tickFormatter={(value) => formatBytes(value)}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number) => formatBytes(value)}
                  />
                  <Bar dataKey="storage" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
