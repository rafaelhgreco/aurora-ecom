import { VStack } from "@chakra-ui/react";
import {
  AboutCta,
  AboutDivider,
  AboutHero,
  AboutPillars,
  AboutValuesGrid,
} from "@/app/components/public/about";
import { ShopPageShell } from "@/app/components/public/shop";

export default function Sobre() {
  return (
    <ShopPageShell containerMaxW="1100px">
      <VStack align="stretch" gap={{ base: 16, md: 20 }} w="full">
        <AboutHero />
        <AboutPillars />
        <AboutDivider />
        <AboutValuesGrid />
        <AboutCta />
      </VStack>
    </ShopPageShell>
  );
}
