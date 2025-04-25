import { CircularProgress, ToggleButton, ToggleButtonGroup } from "@suid/material";
import { type ComponentProps, createSignal, Show, splitProps } from "solid-js";

export default function WorkspaceTopbar(
  props: {
    locales: string[];
    compareLocale: string;
    workLocale: string;
    onLocaleChange?: (compare: string, work: string) => void | Promise<void>;
  } & ComponentProps<"div">
) {
  const [_, rest] = splitProps(props, ["locales", "compareLocale", "workLocale", "onLocaleChange"]);
  const [compareLocale, setCompareLocale] = createSignal<string>(props.compareLocale);
  const [workLocale, setWorkLocale] = createSignal<string>(props.workLocale);
  const [loading1, setLoading1] = createSignal(false);
  const [loading2, setLoading2] = createSignal(false);

  if (props.onLocaleChange) {
    setLoading1(true);
    setLoading2(true);
    props.onLocaleChange?.(compareLocale(), workLocale())?.then(() => {
      setLoading1(false);
      setLoading2(false);
    });
  }

  return (
    <div class="w-full" {...rest}>
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="flex flex-row items-center">
          <span class="whitespace-nowrap mr-4">参照语言</span>
          <Show when={loading1()}>
            <CircularProgress size={"1rem"} color="info" />
          </Show>
          <ToggleButtonGroup
            color="primary"
            class="ml-auto"
            value={compareLocale()}
            exclusive
            disabled={loading1()}
            onChange={async (_, newLocale) => {
              if (newLocale !== null) {
                setLoading1(true);
                await props.onLocaleChange?.(newLocale, workLocale());
                setLoading1(false);
                setCompareLocale(newLocale);
              }
            }}
          >
            {props.locales.map((locale) => (
              <ToggleButton size="small" value={locale}>
                <span class="px-1">{locale}</span>
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </div>

        <div class="flex flex-row items-center">
          <span class="whitespace-nowrap mr-4">翻译语言</span>
          <Show when={loading2()}>
            <CircularProgress size={"1rem"} color="info" />
          </Show>
          <ToggleButtonGroup
            color="primary"
            class="ml-auto"
            value={workLocale()}
            exclusive
            disabled={loading2()}
            onChange={async (_, newLocale) => {
              if (newLocale !== null) {
                setLoading2(true);
                await props.onLocaleChange?.(compareLocale(), newLocale);
                setLoading2(false);
                setWorkLocale(newLocale);
              }
            }}
          >
            {props.locales.map((locale) => (
              <ToggleButton size="small" value={locale}>
                <span class="px-1">{locale}</span>
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </div>
      </div>
    </div>
  );
}
