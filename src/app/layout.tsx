import { Toaster } from "@/components/ui/toaster";
import { Provider } from "./components/ui";
import { CartProvider } from "./contexts/cart-context";

export default function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props;
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body>
        <Provider>
          <CartProvider>
            {children}
            <Toaster />
          </CartProvider>
        </Provider>
      </body>
    </html>
  );
}
