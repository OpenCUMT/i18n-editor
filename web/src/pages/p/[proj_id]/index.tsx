import api, { type Translations } from "@/api";
import NavSidebarLayout, { loginLink } from "@/pages/_blocks/nav";
import Title from "@/pages/_blocks/title";
import { projStore, setProjStore } from "@/storage";
import { useParams } from "@solidjs/router";
import { useSearchParams } from "@solidjs/router";
import SubtitlesOutlinedIcon from "@suid/icons-material/SubtitlesOutlined";
import TranslateOutlinedIcon from "@suid/icons-material/TranslateOutlined";
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  FormControl,
  IconButton,
  Input,
  InputLabel,
  Slide,
  Typography,
} from "@suid/material";
import createElementRef from "@suid/system/createElementRef";
import clsx from "clsx";
import { Show, createMemo, createSignal, onCleanup, onMount } from "solid-js";
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
  const [workText, setWorkText] = createSignal(props.workText);
  const [loading, setLoading] = createSignal(false);
  return (
    <div class="block my-4">
      <Card class="w-full px-2">
        <CardContent>
          <Typography class="!text-lg pb-4 w-full">
            <div class="flex flex-row">
              <span id={props.key} class="absolute translate-y-[-236px] lg:translate-y-[-172px]" />
              <span>
                <a class="mr-2" href={`#${props.key}`} title={props.key}>
                  <SubtitlesOutlinedIcon />
                </a>
                <span>{props.key}</span>
              </span>
              <span class="ml-auto">
                <Show when={loading()}>
                  <Button variant="text" size="small" class="!min-w-0 !mx-2" disabled>
                    <CircularProgress size={"1rem"} color="info" />
                  </Button>
                </Show>
                <Button
                  variant="outlined"
                  size="small"
                  class="!min-w-2"
                  disabled={loading()}
                  onClick={async () => {
                    if (props.onSave) {
                      setLoading(true);
                      await props.onSave(props.workLocale, props.key, workText());
                      setLoading(false);
                    }
                  }}
                >
                  保存
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
                  {props.workLocale}
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
                  defaultValue={workText()}
                  onChange={(e) => {
                    setWorkText(e.currentTarget.value);
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
    if (e.response && e.response.status === 401 && !alerted) {
      alerted = true;
      const opt = window.confirm("未登录，请先登录");
      if (opt) window.location.href = loginLink();
      else window.location.replace(`${import.meta.env.VITE_BUILD_BASE || ""}/`);
    }
    throw e;
  });
}

export default function () {
  alerted = false;
  const params = useParams();
  const proj_id = params.proj_id;
  const [searchParams, setSearchParams] = useSearchParams<{ compare?: string; work?: string }>();

  const [translations, setTranslations] = createStore<Record<string, Translations>>({});
  const compareLocale = createMemo(() => searchParams.compare);
  const workLocale = createMemo(() => searchParams.work);

  const [showWorkspaceTopbar, setShowWorkspaceTopbar] = createSignal(true);
  const workspaceBox = createElementRef();
  const [workspaceBoxHeight, setWorkspaceBoxHeight] = createSignal(0);

  const translateKeys = createMemo(() => Object.keys(translations[workLocale()! ?? ""] ?? {}));

  async function onLocaleChange(compare: string, work: string) {
    setSearchParams({ compare, work }, { replace: true });
    const [compareTranslation, workTranslation] = await Promise.all([
      getTranslations(proj_id, compare),
      getTranslations(proj_id, work),
    ]);
    setTranslations({
      [compare]: compareTranslation,
      [work]: workTranslation,
    });
  }

  async function onSave(locale: string, key: string, value: string) {
    const resp = await api.updateTranslation(proj_id, locale, key, value);
    if (resp.success) {
      setTranslations({
        [locale]: resp.data,
      });
    }
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
  });

  return (
    <>
      <Title subtitle={projStore.current?.name} />
      <NavSidebarLayout sidebar title={projStore.current?.name}>
        <IconButton
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
      <div class="block py-4 px-4 md:py-8 md:px-8 lg:px-16 xl:px-32">
        <Show
          when={projStore.current}
          fallback={
            <div class="flex flex-col items-center justify-center w-full h-full">
              <CircularProgress size={30} color="info" />
            </div>
          }
        >
          <div class="block w-full max-w-[1320px] m-auto">
            {translateKeys().map((key) => {
              return (
                <>
                  <TransDisplay
                    key={key}
                    compareLocale={compareLocale()!}
                    compareText={translations[compareLocale()!][key] ?? ""}
                    workLocale={workLocale()!}
                    workText={translations[workLocale()!][key] ?? ""}
                    onSave={onSave}
                  />
                </>
              );
            })}
          </div>
        </Show>
      </div>
    </>
  );
}
