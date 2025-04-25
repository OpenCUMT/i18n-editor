import type { ProjectInfo, ProjectListItem } from "@/api";
import api, { type UserData } from "@/api";
import config from "@/config";
import { projStore, setAccountStore, setProjStore } from "@/storage";
import HomeIcon from "@suid/icons-material/Home";
import MenuIcon from "@suid/icons-material/Menu";
import {
  AppBar,
  Button,
  CircularProgress,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Toolbar,
  Typography,
} from "@suid/material";
import { type ComponentProps, type JSX, Show, createSignal } from "solid-js";
import Link from "./link";

export function updateProject(source: (ProjectListItem & Partial<ProjectInfo>)[]) {
  const newProjStore = { ...projStore.projects };
  for (const proj of source) {
    newProjStore[proj.id] = {
      ...newProjStore[proj.id],
      ...proj,
    };
  }
  setProjStore({
    projects: newProjStore,
  });
  return projStore.projects;
}

export function ProjectList(props: { projects: ProjectListItem[]; target?: ComponentProps<"a">["target"] }) {
  console.log("ProjectList", props.projects);
  return SidebarList({
    items: props.projects.map((proj) => {
      return {
        text: proj.name,
        href: `${import.meta.env.VITE_BUILD_BASE || ""}/p/${proj.id}`,
        target: props.target,
      };
    }),
  });
}

type ListItemProps = {
  text: string;
  icon?: JSX.Element;
} & (
  | {
      href: string;
      target?: ComponentProps<"a">["target"];
    }
  | {
      onClick?: () => void;
    }
);

export function SidebarList(props: { items: ListItemProps[] }) {
  return (
    <List>
      {props.items.map((item) => (
        <ListItem disablePadding>
          {"onClick" in item ? (
            <ListItemButton onClick={item.onClick}>
              {item.icon && <ListItemIcon>{item.icon}</ListItemIcon>}
              <ListItemText primary={item.text} />
            </ListItemButton>
          ) : "href" in item ? (
            <ListItemButton component={Link} target={item.target} href={item.href}>
              {item.icon && <ListItemIcon>{item.icon}</ListItemIcon>}
              <ListItemText primary={item.text} />
            </ListItemButton>
          ) : (
            <></>
          )}
        </ListItem>
      ))}
    </List>
  );
}

export function Sidebar() {
  return (
    <>
      <span class="block h-4 w-full" />
      <SidebarList
        items={[
          {
            text: "首页",
            href: `${import.meta.env.VITE_BUILD_BASE}/`,
            icon: <HomeIcon />,
          },
        ]}
      />
      <span class="block h-4 w-full" />
      <Show when={Object.values(projStore.projects).length > 0}>
        <div class="text-xl px-4 my-4">项目列表</div>
        <Divider />
        <ProjectList projects={Object.values(projStore.projects)} />
      </Show>
    </>
  );
}

async function logout() {
  await fetch("/api/account/logout", {
    method: "POST",
    headers: {
      authorization: `Bearer ${JSON.parse(window.localStorage.getItem("account") || "{}")?.token}`,
    },
  }).catch((e) => {
    console.warn("登出失败", e);
  });
  setAccountStore({
    user: null,
  });
}

export function loginLink() {
  const u = new URL(window.location.href);
  const path = u.pathname + u.search;
  return `${config.api_base.replace(/\/$/, "")}/account/login?redirect=${encodeURIComponent(path)}`;
}

export default function NavSidebarLayout(props: {
  title?: string;
  sidebar?: boolean;
  children?: JSX.Element;
}) {
  const [sidebarOpen, setSidebarOpen] = createSignal(false);

  const [userMenuAnchor, setUserMenuAnchor] = createSignal<HTMLElement | null>(null);
  const [userMenuOpen, setUserMenuOpen] = createSignal(false);
  const [userData, setUserData] = createSignal<UserData | null>(null);
  const [loggingOut, setLoggingOut] = createSignal(false);

  api
    .getUserInfo()
    .then((user) => {
      setUserData(user);
      setAccountStore({
        user,
      });
    })
    .catch((e) => {
      console.warn("获取用户信息失败", e);
      // window.location.replace(loginLink());
    });

  return (
    <>
      <div class="fixed w-full top-0 left-0 z-1000">
        <AppBar position="fixed">
          <Toolbar>
            {props.sidebar && (
              <IconButton
                size="large"
                edge="start"
                color="inherit"
                aria-label="menu"
                sx={{ mr: 2 }}
                onClick={async () => {
                  setSidebarOpen(true);
                  updateProject(await api.getProjectList());
                }}
              >
                <MenuIcon />
              </IconButton>
            )}
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              {props.title ?? config.title}
            </Typography>
            <div class="*:!mx-2">
              {props.children}
              <Show
                when={userData()}
                fallback={
                  <Button color="inherit" component={"a"} href={loginLink()} target="_self">
                    Login
                  </Button>
                }
              >
                <Button
                  color="inherit"
                  onClick={(e) => {
                    setUserMenuOpen((prev) => !prev);
                    setUserMenuAnchor(e.currentTarget);
                  }}
                  disabled={loggingOut()}
                >
                  <span>{userData()!.account}</span>
                  <Show when={loggingOut()}>
                    <CircularProgress color="inherit" size={"1rem"} class="ml-2" />
                  </Show>
                </Button>
                <Menu
                  open={Boolean(userMenuOpen())}
                  anchorEl={userMenuAnchor()}
                  onClose={() => {
                    setUserMenuAnchor(null);
                    setUserMenuOpen(false);
                  }}
                >
                  <MenuItem component={"a"} href="/account/settings" target="_self">
                    {userData()!.nickname}
                  </MenuItem>
                  <MenuItem
                    onClick={async () => {
                      setUserMenuOpen(false);
                      setLoggingOut(true);
                      await logout();
                      setLoggingOut(false);
                      setUserData(null);
                    }}
                  >
                    <span>登出</span>
                  </MenuItem>
                </Menu>
              </Show>
            </div>
          </Toolbar>
        </AppBar>
        {props.sidebar && (
          <Drawer anchor="left" open={sidebarOpen()} sx={{ zIndex: 9999 }} onClose={() => setSidebarOpen(false)}>
            <div class="min-w-xs max-w-100vw">{Sidebar()}</div>
          </Drawer>
        )}
      </div>
    </>
  );
}
