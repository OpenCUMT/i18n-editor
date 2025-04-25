import { useNavigate } from "@solidjs/router";
import type { ComponentProps } from "solid-js";

export default function Link(props: ComponentProps<"a">) {
  const navigate = useNavigate();
  return (
    <a
      {...props}
      // biome-ignore lint/a11y/useValidAnchor: we need rewrite the navigation
      onClick={(e) => {
        if (props.target === "_blank") return;
        if (props.href) {
          if (/^\w+?:\/\//.test(props.href)) {
            // external link
            const u = new URL(props.href);
            if (u.origin === window.location.origin) {
              e.preventDefault();
              if (u.pathname !== window.location.pathname) navigate(u.pathname + u.search);
              else return;
            } else {
              return;
            }
          } else {
            // internal link
            const u = new URL(props.href, window.location.origin);
            e.preventDefault();
            if (u.pathname !== window.location.pathname) navigate(u.pathname + u.search);
            else return;
          }
        }
      }}
    >
      {props.children}
    </a>
  );
}
