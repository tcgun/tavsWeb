export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="h-screen w-full flex bg-[var(--color-background)] overflow-hidden">
            {/* Left Side - Logo & Slogan (Desktop Only) */}
            <div className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center p-12 border-r border-[var(--color-border)] relative">
                {/* Background decoration */}
                <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-primary)]/5 to-transparent pointer-events-none" />

                <div className="text-center space-y-6 relative z-10">
                    <h1 className="text-8xl font-bold tracking-tighter text-[var(--color-primary)] drop-shadow-lg">t a v s</h1>
                    <h2 className="text-2xl font-medium text-[var(--color-text)] opacity-90 tracking-wide">Güven Çemberinden Gelen Tavsiye</h2>
                </div>
            </div>

            {/* Right Side - Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-4 lg:p-12 relative">
                <div className="w-full max-w-md">
                    {/* Mobile Logo (visible only on small screens) */}
                    <div className="lg:hidden text-center mb-8">
                        <h1 className="text-5xl font-bold tracking-tight text-[var(--color-primary)]">t a v s</h1>
                        <h2 className="mt-3 text-base font-medium text-[var(--color-text)] opacity-80">Güven Çemberinden Gelen Tavsiye</h2>
                    </div>

                    {/* Stable Card Container */}
                    <div className="bg-[var(--color-card)] p-8 rounded-2xl border border-[var(--color-border)] shadow-2xl min-h-[600px] flex flex-col justify-center">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
}
