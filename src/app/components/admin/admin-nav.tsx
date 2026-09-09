/**
 * Componente: Admin Nav
 *
 * Navegação global da seção admin: bottom tab bar fixa no mobile
 * (display abaixo de md), barra superior equivalente no desktop.
 */

"use client";

import { Box, HStack, Text } from "@chakra-ui/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { IconType } from "react-icons";
import {
  IoAddCircle,
  IoAlbums,
  IoFlash,
  IoPricetags,
  IoReceipt,
} from "react-icons/io5";
import { adminFeatureFlagsClient } from "@/app/config/feature-flags";

interface AdminNavItem {
  label: string;
  href: string;
  icon: IconType;
  matchPrefixes?: string[];
}

const NAV_ITEMS: AdminNavItem[] = [
  {
    label: "Produtos",
    href: "/admin",
    icon: IoPricetags,
    matchPrefixes: [
      "/admin/novo",
      "/admin/editar",
      "/admin/importacao",
      "/admin/revisao",
    ],
  },
  { label: "Categorias", href: "/admin/categorias", icon: IoAlbums },
  ...(adminFeatureFlagsClient.promotions
    ? [{ label: "Promoções", href: "/admin/promocoes", icon: IoFlash }]
    : []),
  { label: "Pedidos", href: "/admin/pedidos", icon: IoReceipt },
  { label: "Novo", href: "/admin/novo", icon: IoAddCircle },
];

function isItemActive(pathname: string, item: AdminNavItem): boolean {
  if (item.href === "/admin") {
    return (
      pathname === "/admin" ||
      (item.matchPrefixes?.some((prefix) => pathname.startsWith(prefix)) ??
        false)
    );
  }
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

export function AdminNav() {
  const pathname = usePathname();

  return (
    <>
      <Box
        as="nav"
        aria-label="Navegação administrativa"
        position="fixed"
        bottom={0}
        left={0}
        right={0}
        zIndex="docked"
        bg="white"
        borderTopWidth="1px"
        borderColor="gray.200"
        display={{ base: "flex", md: "none" }}
        pb="env(safe-area-inset-bottom)"
      >
        <HStack justify="space-around" w="full" py={1} gap={0}>
          {NAV_ITEMS.map((item) => {
            const active = isItemActive(pathname, item);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{ flex: 1, textDecoration: "none" }}
              >
                <Box
                  display="flex"
                  flexDirection="column"
                  alignItems="center"
                  justifyContent="center"
                  gap={0.5}
                  minH="48px"
                  color={active ? "blue.500" : "gray.500"}
                >
                  <Icon size={22} />
                  <Text fontSize="xs" fontWeight={active ? "bold" : "medium"}>
                    {item.label}
                  </Text>
                </Box>
              </Link>
            );
          })}
        </HStack>
      </Box>

      <Box
        as="nav"
        aria-label="Navegação administrativa"
        display={{ base: "none", md: "flex" }}
        borderBottomWidth="1px"
        borderColor="gray.200"
        bg="white"
        px={6}
        py={3}
      >
        <HStack gap={2}>
          {NAV_ITEMS.map((item) => {
            const active = isItemActive(pathname, item);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{ textDecoration: "none" }}
              >
                <HStack
                  gap={2}
                  px={3}
                  py={2}
                  borderRadius="md"
                  bg={active ? "blue.50" : "transparent"}
                  color={active ? "blue.600" : "gray.600"}
                  fontWeight={active ? "semibold" : "medium"}
                  fontSize="sm"
                >
                  <Icon size={18} />
                  <Text>{item.label}</Text>
                </HStack>
              </Link>
            );
          })}
        </HStack>
      </Box>
    </>
  );
}
