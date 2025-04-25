import api from "@/api";
import NavSidebarLayout, { ProjectList, updateProject } from "@/pages/_blocks/nav";
import { projStore } from "@/storage";
import { Divider, Skeleton, Typography } from "@suid/material";
import { Show, onMount } from "solid-js";
import Title from "./_blocks/title";

export default function () {
  onMount(async () => {
    const projects = await api.getProjectList();
    updateProject(projects);
  });
  return (
    <>
      <Title />
      <NavSidebarLayout />

      <div class="h-4" />
      <div class="block py-4 px-4 md:py-8 md:px-8 lg:px-16 xl:px-32">
        <div class="m-auto max-w-full w-[600px] lg:w-[50vw]">
          <Typography variant="h4" component="h1" gutterBottom>
            项目列表
          </Typography>
          <Divider />
          <Show
            when={Object.values(projStore.projects).length > 0}
            fallback={
              <div>
                <Skeleton variant="rectangular" width="100%" height={50} class="mt-4" />
                <Skeleton variant="rectangular" width="100%" height={50} class="mt-4" />
              </div>
            }
          >
            <ProjectList projects={Object.values(projStore.projects)} />
          </Show>
        </div>
      </div>
    </>
  );
}
