/**
 * Missão, Visão e Valores como seções colapsáveis — texto corrido, sem
 * bullets nem imagens, com ícones neutros seguindo o padrão minimalista
 * do restante do projeto.
 */

import { Accordion, Box, Flex, Heading, Text } from "@chakra-ui/react";
import type { IconType } from "react-icons";
import {
  IoChevronDown,
  IoCompassOutline,
  IoDiamondOutline,
  IoEyeOutline,
} from "react-icons/io5";

interface Section {
  value: string;
  eyebrow: string;
  title: string;
  icon: IconType;
  body: React.ReactNode;
}

const SECTIONS: Section[] = [
  {
    value: "missao",
    eyebrow: "Missão",
    title: "Ser a marca que mais entende as mulheres",
    icon: IoCompassOutline,
    body: (
      <Text fontSize={{ base: "md", md: "lg" }} color="gray.700">
        Oferecendo produtos de qualidade excepcional e fáceis de usar, com a
        honestidade e integridade que elas merecem. Isso significa ouvir
        genuinamente o que as mulheres precisam, criar soluções práticas e
        confiáveis, e oferecer qualidade acessível e consistente — sempre
        comunicando com transparência total e estando presentes nos momentos
        reais da vida delas.
      </Text>
    ),
  },
  {
    value: "visao",
    eyebrow: "Visão",
    title: "Transformar a relação das mulheres com moda e beleza",
    icon: IoEyeOutline,
    body: (
      <Text fontSize={{ base: "md", md: "lg" }} color="gray.700">
        Tornando essa relação mais simples, confiável e autêntica. Queremos ser
        sinônimo de confiança inquestionável, mudar a forma como as mulheres
        veem produtos de moda e beleza, e ser a marca que realmente as entende —
        mantendo integridade e honestidade em cada passo do caminho.
      </Text>
    ),
  },
  {
    value: "valores",
    eyebrow: "Valores",
    title: "O que nos guia todos os dias",
    icon: IoDiamondOutline,
    body: (
      <Box display="flex" flexDirection="column" gap={4}>
        <Text fontSize={{ base: "md", md: "lg" }} color="gray.700">
          <Text as="span" fontWeight="semibold" color="gray.900">
            Honestidade.
          </Text>{" "}
          Comunicamos com transparência total. Sem promessas vazias, sem
          artificialidades. Nossas mulheres merecem saber exatamente o que estão
          comprando e por quê. Cada produto, cada decisão, cada ação nossa
          reflete essa verdade fundamental.
        </Text>
        <Text fontSize={{ base: "md", md: "lg" }} color="gray.700">
          <Text as="span" fontWeight="semibold" color="gray.900">
            Facilidade.
          </Text>{" "}
          Tornamos a vida das mulheres mais simples. Desde a escolha do produto
          até o resultado final, remover complicações é nossa obsessão. Produtos
          que funcionam, que são fáceis de usar, que economizam tempo real.
        </Text>
        <Text fontSize={{ base: "md", md: "lg" }} color="gray.700">
          <Text as="span" fontWeight="semibold" color="gray.900">
            Qualidade.
          </Text>{" "}
          Qualidade está em cada fio, em cada fórmula, em cada detalhe. Produtos
          que duram, que funcionam, que fazem diferença real. Não competimos por
          preço, mas por durabilidade e resultados.
        </Text>
        <Text fontSize={{ base: "md", md: "lg" }} color="gray.700">
          <Text as="span" fontWeight="semibold" color="gray.900">
            Integridade.
          </Text>{" "}
          Nossas ações refletem nossos valores. Fazemos o que promete, nos
          responsabilizamos, agimos com coerência moral. Somos confiáveis porque
          somos íntegras.
        </Text>
      </Box>
    ),
  },
];

export function AboutAccordion() {
  return (
    <Accordion.Root collapsible defaultValue={[]} variant="outline">
      {SECTIONS.map(({ value, eyebrow, title, icon: Icon, body }) => (
        <Accordion.Item key={value} value={value}>
          <Accordion.ItemTrigger py={5} cursor="pointer">
            <Flex
              flex="0 0 auto"
              align="center"
              justify="center"
              w="44px"
              h="44px"
              borderRadius="full"
              bg="gray.100"
              border="1px solid"
              borderColor="gray.200"
              color="gray.700"
              fontSize="xl"
            >
              <Icon />
            </Flex>
            <Box flex="1" textAlign="left">
              <Text
                fontSize="xs"
                fontWeight="semibold"
                letterSpacing="0.12em"
                textTransform="uppercase"
                color="gray.500"
              >
                {eyebrow}
              </Text>
              <Heading as="h2" size={{ base: "md", md: "lg" }} color="gray.900">
                {title}
              </Heading>
            </Box>
            <Accordion.ItemIndicator>
              <IoChevronDown />
            </Accordion.ItemIndicator>
          </Accordion.ItemTrigger>
          <Accordion.ItemContent>
            <Accordion.ItemBody pl={{ base: 0, md: "56px" }}>
              {body}
            </Accordion.ItemBody>
          </Accordion.ItemContent>
        </Accordion.Item>
      ))}
    </Accordion.Root>
  );
}
