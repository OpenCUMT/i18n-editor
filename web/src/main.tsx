import { Router } from "@solidjs/router";
import { render } from "solid-js/web";
import "overlayscrollbars/overlayscrollbars.css";
import { OverlayScrollbarsComponent } from "overlayscrollbars-solid";
import routes from "./routes";
import "@/styles/theme.css";
import config from "@/config";

import { ThemeProvider, createTheme } from "@suid/material";

function getTheme(): "light" | "dark" {
  const localClass = JSON.parse(localStorage.getItem("theme") || "{}").colorScheme;
  if (localClass) return localClass;
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  return prefersDark ? "dark" : "light";
}

render(() => {
  const theme = getTheme();
  document.documentElement.style.colorScheme = theme;
  document.documentElement.setAttribute("data-theme", theme);
  document.title = config.title;
  return (
    <ThemeProvider theme={createTheme({ palette: { mode: theme } })}>
      <OverlayScrollbarsComponent
        options={{
          scrollbars: {
            theme: `os-theme-${theme === "dark" ? "light" : "dark"}`,
            autoHide: "scroll",
          },
        }}
        class="relative w-screen h-screen print:h-auto print:overflow-auto"
      >
        <Router explicitLinks>{routes}</Router>
      </OverlayScrollbarsComponent>
    </ThemeProvider>
  );
}, document.getElementById("app") as HTMLElement);
