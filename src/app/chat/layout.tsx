export default function ChatLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="h-screen w-full">
      {children}
    </div>
  )
}
