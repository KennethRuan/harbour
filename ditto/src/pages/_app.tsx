import "@/styles/globals.css";
import "@/styles/main_menu.scss";
import "@/styles/chat.scss";
import "@/styles/card.scss";
import "@/styles/chatItem.scss";
import {
  useQuery,
  useMutation,
  useQueryClient,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import "regenerator-runtime/runtime";
import type { AppProps } from "next/app";

const queryClient = new QueryClient();

export default function App({ Component, pageProps }: AppProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <Component {...pageProps} />;
    </QueryClientProvider>
  );
}
