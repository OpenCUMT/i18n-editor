import config from "@/config";
import { Show } from "solid-js";

export function setTitle(subtitle: string) {
  document.title = [subtitle, config.title].join(" - ");
}

function _Title(props: { subtitle?: string; title?: string }) {
  if (props.subtitle) {
    setTitle(props.subtitle);
  } else {
    document.title = props.title || config.title;
  }
  return <></>;
}

export default function Title(props: { subtitle?: string; title?: string }) {
  return (
    <Show when={props.subtitle} fallback={<_Title title={props.title} />}>
      <_Title subtitle={props.subtitle} />
    </Show>
  );
}
