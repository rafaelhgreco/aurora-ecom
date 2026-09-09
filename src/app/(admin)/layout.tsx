import { Box } from "@chakra-ui/react";
import type { ReactNode } from "react";
import { AdminNav } from "@/app/components/admin/admin-nav";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <AdminNav />
      <Box pb={{ base: "72px", md: 0 }}>{children}</Box>
    </>
  );
}
