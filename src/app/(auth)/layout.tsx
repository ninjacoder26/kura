

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[min-h-screen]">
      {children}
    </div>
  );
}
