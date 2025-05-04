import api, { type Translations } from "@/api";
import NavSidebarLayout, { loginLink } from "@/pages/_blocks/nav";
import Title from "@/pages/_blocks/title";
import { projStore, setProjStore } from "@/storage";
import { AppointTimeCall, CallInterval, CallLock } from "@/utils/call";
import { useParams } from "@solidjs/router";
import { useSearchParams } from "@solidjs/router";
import CheckCircleOutlineOutlinedIcon from "@suid/icons-material/CheckCircleOutlineOutlined";
import CircleIcon from "@suid/icons-material/Circle";
import SearchOutlinedIcon from "@suid/icons-material/SearchOutlined";
import SubtitlesOutlinedIcon from "@suid/icons-material/SubtitlesOutlined";
import TranslateOutlinedIcon from "@suid/icons-material/TranslateOutlined";
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  FormControl,
  FormHelperText,
  IconButton,
  Input,
  InputAdornment,
  InputLabel,
  OutlinedInput,
  Pagination,
  Slide,
  Typography,
} from "@suid/material";
import createElementRef from "@suid/system/createElementRef";
import clsx from "clsx";
import { For, Show, createMemo, createRenderEffect, createSignal, onCleanup, onMount } from "solid-js";
import { createStore } from "solid-js/store";
import WorkspaceTopbar from "./_blocks/topbar";

function TransDisplay(props: {
  key: string;
  compareLocale: string;
  compareText: string;
  workLocale: string;
  workText: string;
  onSave?: (locale: string, key: string, value: string) => void | Promise<void>;
}) {
  const [initialWorkLocale, setInitialWorkLocale] = createSignal(props.workLocale);
  const [initialWorkText, setInitialWorkText] = createSignal(props.workText);
  const [workText, setWorkText] = createSignal(props.workText);
  const [loading, setLoading] = createSignal(false);
  const [saved, setSaved] = createSignal(false);
  const workInputRef = createElementRef<HTMLInputElement | HTMLTextAreaElement>();
  const saveBtnRef = createElementRef<HTMLButtonElement>();
  const modifying = createMemo(() => initialWorkLocale() === props.workLocale && initialWorkText() !== workText());

  function tryLocaleChange(prevLocale: string) {
    if (prevLocale !== props.workLocale) {
      setInitialWorkLocale(props.workLocale);
      setInitialWorkText(props.workText);
      setWorkText(props.workText);
      if (workInputRef.ref) {
        workInputRef.ref.value = props.workText;
      }
      return true;
    }
    return false;
  }

  createRenderEffect(() => {
    const localeChanged = tryLocaleChange(initialWorkLocale());
    if (!localeChanged) {
      // only update workText
      if (!modifying()) {
        setInitialWorkText(props.workText);
        setWorkText(props.workText);
        if (workInputRef.ref) {
          workInputRef.ref.value = props.workText;
        }
      }
    }
  }, [props.workLocale, props.workText]);

  const saveLock = new CallLock((e: KeyboardEvent) => {
    e.preventDefault();
    if (saveBtnRef.ref) {
      saveBtnRef.ref.click();
    }
  });

  return (
    <div class="block my-4">
      <Card class="w-full px-2">
        <CardContent>
          <Typography class="!text-lg pb-4 w-full">
            <div class="flex flex-row">
              <span id={props.key} class="absolute translate-y-[-236px] lg:translate-y-[-172px]" />
              <a class="mr-2" href={`#${props.key}`} title={props.key}>
                <SubtitlesOutlinedIcon />
              </a>
              <span class="flex flex-wrap">
                {props.key.split(".").map((s, i) => (
                  <span class="break-all">{i === 0 ? s : `.${s}`}</span>
                ))}
              </span>
              <span class="flex items-center ml-auto float-right">
                <Show when={loading()}>
                  <Button variant="text" size="small" class="!min-w-0 !mx-2" disabled>
                    <CircularProgress size={"1rem"} color="info" />
                  </Button>
                </Show>
                <Show when={modifying() && !loading() && !saved()}>
                  <span class="min-w-0 mx-2 block place-self-start">
                    <CircleIcon
                      sx={{
                        height: ".5rem",
                        width: ".5rem",
                        transform: "translateY(-0.5rem)",
                        color: "var(--primary-color)",
                      }}
                    />
                  </span>
                </Show>
                <Button
                  variant="outlined"
                  size="small"
                  class={clsx("!min-w-2 whitespace-nowrap", saved() && "!bg-success/10 !text-success !border-success")}
                  disabled={loading() || saved()}
                  onClick={async () => {
                    if (props.onSave) {
                      setLoading(true);
                      await props.onSave(props.workLocale, props.key, workText());
                      setInitialWorkText(workText());
                      setSaved(true);
                      setLoading(false);
                      setTimeout(() => {
                        setSaved(false);
                      }, 2000);
                    }
                  }}
                  ref={saveBtnRef}
                >
                  <Show when={saved()}>
                    <CheckCircleOutlineOutlinedIcon
                      class="mr-1"
                      sx={{
                        height: "1rem",
                        width: "1rem",
                      }}
                    />
                  </Show>
                  <span>保存</span>
                </Button>
              </span>
            </div>
          </Typography>
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <FormControl fullWidth variant="standard">
                <InputLabel disableAnimation>参照语言</InputLabel>
                <InputLabel
                  class="!left-[unset] !right-0"
                  sx={{ transform: "translate(0, -1.5px) scale(0.75)" }}
                  disableAnimation
                >
                  {props.compareLocale}
                </InputLabel>
                <Input type="text" class="!bg-transparent !px-0" multiline value={props.compareText} />
              </FormControl>
            </div>
            <div>
              <FormControl fullWidth variant="standard">
                <InputLabel disableAnimation={!!workText()}>翻译语言</InputLabel>
                <InputLabel
                  class="!left-[unset] !right-0"
                  sx={{ transform: "translate(0, -1.5px) scale(0.75)" }}
                  disableAnimation
                >
                  {props.workLocale}
                </InputLabel>
                <Input
                  type="text"
                  multiline
                  defaultValue={props.workText}
                  onChange={(e) => {
                    setWorkText(e.currentTarget.value);
                  }}
                  inputRef={workInputRef}
                  onKeyDown={(e) => {
                    if (e.ctrlKey && e.key === "s") {
                      saveLock.tryLockCall(e);
                    }
                  }}
                  onKeyUp={(e) => {
                    if (e.ctrlKey && e.key === "s") {
                      saveLock.unlock();
                    }
                  }}
                />
              </FormControl>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

let alerted = false;
function getTranslations(...args: Parameters<typeof api.getTranslations>) {
  return api.getTranslations(...args).catch((e) => {
    if (e.response) {
      if (e.response.status === 401 && !alerted) {
        alerted = true;
        const opt = window.confirm("未登录，请先登录");
        if (opt) window.location.href = loginLink();
        else window.location.replace(`${import.meta.env.VITE_BUILD_BASE || ""}/`);
      } else if (e.response.status === 403 && !alerted) {
        alerted = true;
        window.alert("无权限，请联系管理员");
        window.location.replace(`${import.meta.env.VITE_BUILD_BASE || ""}/`);
      }
    }
    throw e;
  });
}

function compareTranslation(a: string, b: string) {
  const aArray = a.split(".");
  const bArray = b.split(".");
  let ac = aArray.shift();
  let bc = bArray.shift();
  if (typeof ac === "undefined") return -1;
  if (typeof bc === "undefined") return 1;
  let cmp = ac.localeCompare(bc);
  while (ac === bc) {
    ac = aArray.shift();
    bc = bArray.shift();
    if (typeof ac === "undefined") return -1;
    if (typeof bc === "undefined") return 1;
    cmp = ac.localeCompare(bc);
  }
  return cmp;
}

const PAGE_SIZE = 50;

export default function () {
  alerted = false;
  const params = useParams();
  const proj_id = params.proj_id;
  const [searchParams, setSearchParams] = useSearchParams<{
    compare?: string;
    work?: string;
    page?: string;
    search?: string;
  }>();

  const [translations, setTranslations] = createStore<Record<string, Translations>>({});
  const compareLocale = createMemo(() => searchParams.compare);
  const workLocale = createMemo(() => searchParams.work);

  const [showWorkspaceTopbar, setShowWorkspaceTopbar] = createSignal(true);
  const workspaceBox = createElementRef();
  const [workspaceBoxHeight, setWorkspaceBoxHeight] = createSignal(0);
  const searchInput = createElementRef<HTMLInputElement | HTMLTextAreaElement>();

  const translateKeys = createMemo(() =>
    Object.keys(translations[workLocale()! ?? ""] ?? translations[compareLocale()! ?? ""] ?? {}).sort((a, b) =>
      compareTranslation(a, b)
    )
  );
  const filterString = createMemo(() => searchParams.search?.trim()?.toLowerCase() ?? "");
  const filteredKeys = createMemo(() => {
    const keys = translateKeys();
    if (!filterString()) return keys;
    return keys.filter((key) => key.toLowerCase().includes(filterString()!));
  });
  const totalPages = createMemo(() => Math.ceil(filteredKeys().length / PAGE_SIZE));
  const curPage = createMemo(() => {
    const page = Number.parseInt(searchParams.page ?? "1");
    return Number.isNaN(page) ? page : page > totalPages() ? totalPages() : page < 1 ? 1 : page;
  });

  const AppointCall = new AppointTimeCall(500);
  const compareTransSchedule = new CallInterval(() => {
    getTranslations(proj_id, compareLocale()!).then((resp) => {
      setTranslations({
        [compareLocale()!]: resp,
      });
    });
  }, 60 * 1000);
  const workTransSchedule = new CallInterval(() => {
    getTranslations(proj_id, workLocale()!).then((resp) => {
      setTranslations({
        [workLocale()!]: resp,
      });
    });
  }, 30 * 1000);

  async function onLocaleChange(compare: string, work: string) {
    compareTransSchedule.pause();
    workTransSchedule.pause();
    setSearchParams({ compare, work }, { replace: true });
    const [compareTranslation, workTranslation] = await Promise.all([
      getTranslations(proj_id, compare),
      getTranslations(proj_id, work),
    ]);
    setTranslations({
      [compare]: compareTranslation,
      [work]: workTranslation,
    });
    compareTransSchedule.restart();
    workTransSchedule.restart();
    if (searchParams.page && searchParams.page !== String(curPage())) {
      setSearchParams({ page: String(curPage()) }, { replace: true });
    }
  }

  async function onSave(locale: string, key: string, value: string) {
    compareTransSchedule.pause();
    workTransSchedule.pause();
    const resp = await api.updateTranslation(proj_id, locale, key, value);
    if (resp.success) {
      setTranslations({
        [locale]: resp.data,
      });
    }
    compareTransSchedule.start();
    workTransSchedule.start();
  }

  const SearchLock = new CallLock(() => {
    onSearch(searchInput.ref?.value || "");
  });

  function onSearch(searchText?: string | null) {
    AppointCall.cancel();
    setSearchParams({ search: searchText?.trim().toLowerCase() || null }, { replace: true });
  }

  onMount(async () => {
    const curProject = await api.getProjectInfo(proj_id);
    setProjStore({
      projects: {
        [curProject.id]: curProject,
      },
      current: curProject,
    });
    setWorkspaceBoxHeight(workspaceBox.ref?.children[0].clientHeight ?? 0);
  });

  onCleanup(() => {
    setProjStore({
      current: null,
    });
    setTranslations({});
    AppointCall.cancel();
    compareTransSchedule.stop();
    workTransSchedule.stop();
  });

  return (
    <>
      <Title subtitle={projStore.current?.name} />
      <NavSidebarLayout sidebar title={projStore.current?.name}>
        <IconButton
          color="inherit"
          onClick={() =>
            setShowWorkspaceTopbar((prev) => {
              if (prev) {
                setWorkspaceBoxHeight(workspaceBox.ref?.children[0].clientHeight ?? 0);
              }
              return !prev;
            })
          }
        >
          <TranslateOutlinedIcon />
        </IconButton>
      </NavSidebarLayout>
      <Show when={projStore.current}>
        <Box
          class={clsx("block w-full", showWorkspaceTopbar() || "!h-0")}
          sx={{
            transition: "height 225ms cubic-bezier(0, 0, 0.2, 1)",
            height: workspaceBoxHeight() ? `${workspaceBoxHeight()}px` : "auto",
          }}
          ref={workspaceBox}
        >
          <Slide direction="down" in={showWorkspaceTopbar()} mountOnEnter unmountOnExit container={workspaceBox.ref}>
            <div
              class={clsx(
                "fixed left-0 right-0 z-10",
                "w-full py-4 px-4 md:px-8 lg:px-16 xl:px-32",
                "bg-(--bg-color) border-b-1 border-solid border-(--font-color)/30"
              )}
            >
              <WorkspaceTopbar
                class="max-w-[1320px] m-auto"
                locales={projStore.current!.locales}
                compareLocale={compareLocale()! ?? projStore.current!.default}
                workLocale={
                  workLocale() ??
                  projStore.current!.locales.find((l) => l !== projStore.current!.default) ??
                  projStore.current!.default
                }
                onLocaleChange={onLocaleChange}
              />
            </div>
          </Slide>
        </Box>
      </Show>

      <div class="block py-8 px-4 md:px-8 lg:px-16 xl:px-32 *:not-first:not-last:my-8">
        <div class="block w-full max-w-[1320px] m-auto">
          <FormControl fullWidth variant="outlined">
            <InputLabel>搜索</InputLabel>
            <OutlinedInput
              fullWidth
              label="搜索"
              placeholder="请输入翻译键"
              defaultValue={filterString()}
              inputRef={searchInput}
              endAdornment={
                <InputAdornment position="end" class="mr-2">
                  <IconButton edge="end" onClick={(_) => onSearch(searchInput.ref?.value || "")}>
                    <SearchOutlinedIcon />
                  </IconButton>
                </InputAdornment>
              }
              onChange={(e) => {
                const v = e.currentTarget.value;
                if (v.trim()) AppointCall.setNext(() => onSearch(v));
                else onSearch("");
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  SearchLock.tryLockCall();
                }
              }}
              onKeyUp={(e) => {
                if (e.key === "Enter") {
                  SearchLock.unlock();
                }
              }}
            />
            <FormHelperText>
              <Show when={filterString()} fallback={<span>已加载 {filteredKeys().length} 条结果</span>}>
                <span>共找到 {filteredKeys().length} 条搜索结果</span>
              </Show>
            </FormHelperText>
          </FormControl>
        </div>
        <Show
          when={projStore.current}
          fallback={
            <div class="flex flex-col items-center justify-center w-full h-full">
              <CircularProgress size={30} color="info" />
            </div>
          }
        >
          <div class="block w-full max-w-[1320px] m-auto">
            <For each={filteredKeys().slice((curPage() - 1) * PAGE_SIZE, curPage() * PAGE_SIZE)}>
              {(key) => {
                return (
                  <>
                    <TransDisplay
                      key={key}
                      compareLocale={compareLocale()!}
                      compareText={translations[compareLocale()!]?.[key] ?? ""}
                      workLocale={workLocale()!}
                      workText={translations[workLocale()!]?.[key] ?? ""}
                      onSave={onSave}
                    />
                  </>
                );
              }}
            </For>
          </div>
          <div class="block w-full">
            <div class="w-max max-w-full m-auto">
              <Pagination
                count={totalPages()}
                page={curPage()}
                showFirstButton
                showLastButton
                onChange={(_, page) => {
                  setSearchParams({ page: String(page) }, { replace: true });
                }}
              />
            </div>
          </div>
        </Show>
      </div>
    </>
  );
}
