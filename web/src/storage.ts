import type { UserData, ProjectInfo, ProjectListItem } from "@/api";
import { createStore } from "solid-js/store";

export const [projStore, setProjStore] = createStore({
  projects: {} as Record<string, ProjectListItem & Partial<ProjectInfo>>,
  current: null as ProjectInfo | null,
});

export const [accountStore, setAccountStore] = createStore({
  user: null as UserData | null,
});

export function getToken(): string | null {
  return JSON.parse(window.localStorage.getItem("account") || "{}")?.token ?? null;
}
