import type { ProjectInfo, ProjectListItem } from "@/api";
import { createStore } from "solid-js/store";

export const [projStore, setProjStore] = createStore({
  projects: {} as Record<string, ProjectListItem & Partial<ProjectInfo>>,
  current: null as ProjectInfo | null,
});
