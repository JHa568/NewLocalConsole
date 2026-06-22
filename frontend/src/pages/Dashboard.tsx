import { isSameDay, parseISO } from "date-fns";
import { useEffect, useState } from "react";
import { api } from "../api/client";
import Page from "../components/ui/Page";
import type { GTask } from "../types/calendar";
import Holdings from "./dashboard/Holdings";
import NetWorthCard from "./dashboard/NetWorthCard";
import StatsGrid from "./dashboard/StatsGrid";
import TodaysTasks from "./dashboard/TodaysTasks";
import type { Summary } from "./dashboard/types";

export default function Dashboard() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [tasks, setTasks] = useState<GTask[]>([]);

  const fetchSummary = () => {
    api
      .get<Summary>("/finance/summary/")
      .then((r) => {
        setSummary(r.data);
        setUpdatedAt(new Date());
        setError(null);
      })
      .catch(() => setError("Could not load dashboard data."));
  };

  const fetchTasks = () => {
    api
      .get<GTask[]>("/calendar/tasks/")
      .then((r) => setTasks(Array.isArray(r.data) ? r.data : []))
      .catch(() => setTasks([]));
  };

  useEffect(() => {
    fetchSummary();
    fetchTasks();
  }, []);

  if (error) return <div className="p-6 text-bad">{error}</div>;
  if (!summary) return <div className="p-6 text-muted">Loading dashboard…</div>;

  const today = new Date();
  const todaysTasks = tasks.filter(
    (t) => t.due && isSameDay(parseISO(t.due), today) && t.status !== "completed",
  );

  const completeTask = async (t: GTask) => {
    setTasks((prev) => prev.filter((x) => x.id !== t.id));
    try {
      await api.patch(`/calendar/tasks/${t.id}/`, { title: t.title, due: t.due, completed: true });
    } finally {
      fetchTasks();
    }
  };

  return (
    <Page title="Dashboard" testId="dashboard">
      <TodaysTasks tasks={todaysTasks} onComplete={completeTask} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.6fr_1fr]">
        <StatsGrid summary={summary} />
        <NetWorthCard summary={summary} updatedAt={updatedAt} onRefresh={fetchSummary} />
      </div>

      <Holdings positions={summary.positions} />
    </Page>
  );
}
