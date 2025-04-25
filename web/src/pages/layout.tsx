import type { JSX } from "solid-js";

export default function Layout(props: {
  children?: JSX.Element;
}) {
  return (
    <>
      <div id="viewbox" class="block pb-[64px] pt-[56px] material-md:pt-[64px]">
        {props.children}
      </div>
    </>
  );
}
