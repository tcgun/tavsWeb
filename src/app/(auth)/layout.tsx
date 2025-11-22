export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--color-background)]">
            <div className="w-full max-w-md space-y-8">
                <div className="text-center">
                    <h1 className="text-4xl font-bold tracking-tight text-[var(--color-primary)]">t a v s</h1>
                    <h2 className="mt-2 text-xl font-semibold text-[var(--color-text)]">Güven Çemberinden Gelen Tavsiye</h2>
                </div>
                {children}
            </div>
        </div>
    );
}
