import config from "@/config";
import { Show } from "solid-js";

export function setTitle(subtitle: string) {
  document.title = [subtitle, config.title].join(" - ");
}

function _Title(props: { subtitle?: string }) {
  if (props.subtitle) {
    setTitle(props.subtitle);
  }
  return <></>;
}

export default function Title(props: { subtitle?: string }) {
  return (
    <Show when={props.subtitle}>
      <_Title subtitle={props.subtitle} />
    </Show>
  );
}
