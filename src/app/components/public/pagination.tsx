import { Button, HStack, Text, VStack } from "@chakra-ui/react";
import { IoChevronBack, IoChevronForward } from "react-icons/io5";

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalCount?: number;
  pageSize?: number;
  mt?: number | string;
}

type PageItem = number | "ellipsis";

function getPageItems(current: number, total: number): PageItem[] {
  const delta = 1;
  const candidates = new Set<number>([1, total]);
  for (let p = current - delta; p <= current + delta; p++) {
    if (p >= 1 && p <= total) candidates.add(p);
  }
  const sorted = [...candidates].sort((a, b) => a - b);

  const items: PageItem[] = [];
  let prev = 0;
  for (const p of sorted) {
    if (prev && p - prev === 2) items.push(prev + 1);
    else if (prev && p - prev > 2) items.push("ellipsis");
    items.push(p);
    prev = p;
  }
  return items;
}

export function Pagination({
  page,
  totalPages,
  onPageChange,
  totalCount,
  pageSize,
  mt = 12,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const pageItems = getPageItems(page, totalPages);

  const rangeStart =
    totalCount !== undefined && pageSize !== undefined
      ? (page - 1) * pageSize + 1
      : undefined;
  const rangeEnd =
    totalCount !== undefined && pageSize !== undefined
      ? Math.min(page * pageSize, totalCount)
      : undefined;

  return (
    <VStack gap={3} mt={mt} align="center">
      {rangeStart !== undefined && rangeEnd !== undefined && (
        <Text fontSize="sm" color="gray.600">
          Mostrando {rangeStart}-{rangeEnd} de {totalCount} produtos
        </Text>
      )}

      <HStack gap={{ base: "1", sm: "2" }} justify="center" flexWrap="nowrap">
        <Button
          size="sm"
          variant="outline"
          minW={{ base: "32px", sm: "36px" }}
          px={0}
          disabled={page === 1}
          onClick={() => onPageChange(Math.max(1, page - 1))}
          aria-label="Página anterior"
        >
          <IoChevronBack />
        </Button>

        {pageItems.map((item, index) =>
          item === "ellipsis" ? (
            <Text
              key={`ellipsis-before-${pageItems[index + 1]}`}
              px="1"
              color="gray.400"
              fontSize="sm"
            >
              …
            </Text>
          ) : (
            <Button
              key={item}
              size="sm"
              variant={item === page ? "solid" : "ghost"}
              minW={{ base: "32px", sm: "36px" }}
              px={0}
              fontWeight={item === page ? "bold" : "normal"}
              onClick={() => onPageChange(item)}
              aria-label={`Página ${item}`}
              aria-current={item === page ? "page" : undefined}
            >
              {item}
            </Button>
          ),
        )}

        <Button
          size="sm"
          variant="outline"
          minW={{ base: "32px", sm: "36px" }}
          px={0}
          disabled={page === totalPages}
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          aria-label="Próxima página"
        >
          <IoChevronForward />
        </Button>
      </HStack>
    </VStack>
  );
}
