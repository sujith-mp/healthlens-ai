import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
    title: "HealthLens AI — AI-Powered Health Platform",
    description:
        "Predict disease risk, analyze symptoms, get personalized nutrition plans, and chat with an AI health assistant.",
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <head>
                <link
                    href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap"
                    rel="stylesheet"
                />
                <script src="https://accounts.google.com/gsi/client" async defer></script>
            </head>
            <body>
                <Providers>{children}</Providers>
            </body>
        </html>
    );
}
