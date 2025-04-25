import { lazy } from "solid-js";

const globs = import.meta.glob("./pages/**/*.tsx");

// biome-ignore lint/suspicious/noExplicitAny: any component
export function constructRoutes(globs: Record<string, () => Promise<any>>) {
  const nodes = Object.entries(globs)
    .map(([path, c]) => {
      const route = path.replace(/\.tsx$/, "").replace(/^\.\/pages/, "");
      if (/\/_/.test(route)) return null; // ignore route starting with _
      const component = lazy(c);
      return {
        route: route,
        component,
      };
    })
    .filter((x) => x !== null);

  type RouteNode = {
    path: string;
    // biome-ignore lint/suspicious/noExplicitAny: any component
    component?: any;
    children?: RouteNode[];
  };
  const root: RouteNode = {
    path: "/",
  };

  for (const node of nodes) {
    if (node.route.endsWith("/index")) node.route = node.route.replace(/\/index$/, "/");
    else if (node.route.endsWith("/layout")) node.route = node.route.replace(/\/layout$/, "");
    const parts = node.route.split("/").map((x) => {
      if (/^\[.+\]$/.test(x)) {
        return `/${x.replace(/^\[(.+)\]$/, ":$1")}`;
      }
      return `/${x}`;
    });

    let cur = root;
    if (parts.length === 1) {
      // root
      cur.component = node.component;
    }
    for (let i = 1; i < parts.length; i++) {
      const part = parts[i];

      if (i === parts.length - 1) {
        // final
        if (!cur.children) cur.children = [];
        cur.children.push(<RouteNode>{
          path: part,
          component: node.component,
        });
      } else {
        // recurse
        if (!cur.children) cur.children = [];
        let child = cur.children.find((x) => x.path === part);
        if (!child) {
          child = <RouteNode>{
            path: part,
            children: [],
          };
          cur.children.push(child);
        }
        cur = child;
      }
    }
  }

  return root;
}

export const routes = constructRoutes(globs);
export default routes;
