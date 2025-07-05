export default function TestNoAuthPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Test Page - No Auth</h1>
      <p>If you can see this page, the issue is with the AuthProvider.</p>
      <p>Current time: {new Date().toISOString()}</p>
    </div>
  )
}
