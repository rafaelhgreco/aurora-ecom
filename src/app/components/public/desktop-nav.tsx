"use client";

import { Box, chakra, HStack, Text } from "@chakra-ui/react";
import { useEffect, useRef, useState } from "react";
import { IoChevronDown } from "react-icons/io5";
import { NavLink } from "react-router-dom";
import type { NavItem } from "storybook-react";

const ChakraNavLink = chakra(NavLink);

const underlineCss = {
  position: "relative" as const,
  "&::after": {
    content: '""',
    position: "absolute",
    left: 0,
    right: 0,
    bottom: "-4px",
    height: "2px",
    backgroundColor: "#5932E6",
    transform: "scaleX(0)",
    transformOrigin: "center",
    transition: "transform 0.2s ease",
  },
  "&:hover::after, &[data-active='true']::after, &[aria-current='page']::after":
    {
      transform: "scaleX(1)",
    },
};

function ShopNavDropdown({ item }: { item: NavItem & { isButton: true } }) {
  const [open, setOpen] = useState(false);
  /**
   * Um clique "trava" o menu aberto — passar o mouse por fora não fecha
   * mais, só um clique fora fecha. Sem isso, o pequeno espaço entre o
   * botão e o painel do dropdown faz o hover fechar o menu antes do
   * usuário conseguir clicar num item.
   */
  const [pinned, setPinned] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const onMouseDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setPinned(false);
      }
    };

    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [open]);

  return (
    <Box
      ref={ref}
      position="relative"
      onMouseEnter={() => {
        if (!pinned) setOpen(true);
      }}
      onMouseLeave={() => {
        if (!pinned) setOpen(false);
      }}
    >
      <chakra.button
        type="button"
        onClick={() => {
          /**
           * Hover já pode ter aberto o menu antes do clique — por isso o
           * clique não alterna cegamente o estado atual. Ele só fecha
           * quando o menu já estava fixado (aberto por um clique
           * anterior); caso contrário, sempre garante que abra e fixe.
           */
          if (open && pinned) {
            setOpen(false);
            setPinned(false);
          } else {
            setOpen(true);
            setPinned(true);
          }
        }}
        display="flex"
        alignItems="center"
        gap="1"
        py="2"
        bg="transparent"
        border="none"
        cursor="pointer"
        fontSize="sm"
        fontWeight="medium"
        color="gray.800"
        css={underlineCss}
        data-active={open ? "true" : undefined}
      >
        <Text>{item.label}</Text>
        <Box
          as={IoChevronDown}
          fontSize="xs"
          css={{
            transition: "transform 0.2s ease",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
          }}
        />
      </chakra.button>

      {open && item.dropdownItems && item.dropdownItems.length > 0 && (
        <Box
          position="absolute"
          top="calc(100% + 8px)"
          left="0"
          zIndex={60}
          minW="220px"
          py="2"
          bg="#ffffff"
          borderRadius="14px"
          border="1px solid #e2e8f0"
          boxShadow="0 4px 12px rgba(0, 0, 0, 0.12)"
        >
          {item.dropdownItems.map((dropdownItem, index) => (
            <chakra.button
              key={dropdownItem.id}
              type="button"
              onClick={() => {
                dropdownItem.onClick?.();
                setOpen(false);
                setPinned(false);
              }}
              display="block"
              w="full"
              textAlign="left"
              px="4"
              py="2"
              mb={index === 0 ? "2" : undefined}
              pb={index === 0 ? "3" : undefined}
              borderBottom={index === 0 ? "1px solid #e2e8f0" : undefined}
              bg="transparent"
              border="none"
              cursor="pointer"
              fontSize="sm"
              fontWeight={index === 0 ? "semibold" : "normal"}
              color="gray.800"
              _hover={{ bg: "gray.50" }}
            >
              {dropdownItem.label}
            </chakra.button>
          ))}
        </Box>
      )}
    </Box>
  );
}

interface DesktopNavProps {
  items: NavItem[];
}

export function DesktopNav({ items }: DesktopNavProps) {
  return (
    <HStack as="nav" gap={{ base: 4, md: 6 }} align="center">
      {items.map((item) =>
        item.isButton ? (
          <ShopNavDropdown key={item.label} item={item} />
        ) : (
          <ChakraNavLink
            key={item.label}
            to={item.path ?? "#"}
            py="2"
            fontSize="sm"
            fontWeight="medium"
            color="gray.800"
            textDecoration="none"
            css={underlineCss}
          >
            {item.label}
          </ChakraNavLink>
        ),
      )}
    </HStack>
  );
}
