export default function MarketingTemplate({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="marketing-route-enter flex min-w-0 flex-1 flex-col">
      {children}
    </div>
  );
}
