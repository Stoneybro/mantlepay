import DeploymentGuard from "@/components/auth/DeploymentGuard";


export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <>
            <DeploymentGuard>
                {children}
            </DeploymentGuard>

        </>
    );
}
