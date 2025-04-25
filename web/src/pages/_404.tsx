import NavSidebarLayout from "@/pages/_blocks/nav";
import { Typography } from "@suid/material";
import Title from "./_blocks/title";

export default function () {
  return (
    <>
      <Title subtitle="404" />
      <NavSidebarLayout sidebar />

      <div class="h-8" />
      <div class="block py-4 px-4 md:py-8 md:px-8 lg:px-16 xl:px-32">
        <div class="m-auto text-center">
          <Typography variant="h3">404 Not Found</Typography>
        </div>
      </div>
    </>
  );
}
